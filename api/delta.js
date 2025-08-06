/*
  Copyright 2025 Adobe. All rights reserved.
  This file is licensed to you under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License. You may obtain a copy
  of the License at http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software distributed under
  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
  OF ANY KIND, either express or implied. See the License for the specific language
  governing permissions and limitations under the License.
*/

// eslint-disable-next-line no-unused-vars
const { Core } = require('@adobe/aio-sdk');
const stateLib = require('@adobe/aio-lib-state');
const { createAcoClient } = require('./aco');
const {
  createSalesforceAdminHttpClient,
  getSalesforcePriceBookById,
  getSalesforceProductByIds,
  getSalesforceTrackedChanges,
} = require('./salesforce');
const { syncPriceBooksBatch, deletePriceBooks } = require('./priceBooks');
const { syncPricesFromProducts, deletePrices } = require('./prices');
const { syncProductsBatch, deleteProducts } = require('./products');
const { AIO_STATE_MAX_TTL, AIO_STATE_KEY_LAST_SYNC } = require('../actions/constants');
const { StarterKitActionError } = require('../actions/responses');

const SFCC_BATCH_SIZE = 1000;
const ACO_BATCH_SIZE = 100;

/**
 * Syncs all tracked changes from Salesforce to ACO.
 *
 * @param {SalesforceApiOptions} salesforceApiOptions - Configuration options for the API client.
 * @param {AcoClientOptions} acoClientOptions - Configuration options for the ACO client.
 * @param {string} salesforceOrgId - The Salesforce organization ID.
 * @param {string} siteId - The Salesforce site ID.
 * @param {string[]} locales - The locales to sync.
 * @param {string} since - The date and time to sync from.
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @throws {StarterKitActionError} If there's an error syncing the changes
 */
const syncAllChanges = async (
  salesforceApiOptions,
  acoClientOptions,
  salesforceOrgId,
  siteId,
  locales,
  since,
  logger,
) => {
  logger.info(`Syncing all tracked changes from Salesforce to ACO for siteId: ${siteId} since: ${since}`);

  logger.debug('Initializing AIO state lib');
  const state = await stateLib.init();

  logger.debug(`Retrieving tracked changes from Salesforce`);
  const salesforceClient = await createSalesforceAdminHttpClient(salesforceApiOptions);
  const acoClient = createAcoClient(acoClientOptions);

  let totalChanges = 0;
  let offset = 0;
  let totalSyncedChanges = 0;
  let batchNumber = 1;
  const totalAcceptedByType = { product: 0, priceBook: 0, price: 0 };

  do {
    const res = await getSalesforceTrackedChanges(
      salesforceClient,
      salesforceOrgId,
      siteId,
      SFCC_BATCH_SIZE,
      offset,
      since,
    );
    if (!res.ok) {
      logger.error(`Failed to retrieve tracked changes from Salesforce: ${res.status} ${res.statusText}`);
      throw new StarterKitActionError('Failed to retrieve tracked changes from Salesforce', res.status, res.statusText);
    }
    // Save the last sync timestamp to AIO state
    state.put(AIO_STATE_KEY_LAST_SYNC, new Date().toISOString(), { ttl: AIO_STATE_MAX_TTL });

    /** @type {SalesforceTrackedChangesResponse} */
    const data = await res.json();
    const changesInBatch = data.data.length;
    totalChanges = data.total;

    if (totalChanges === 0) {
      logger.info(`No changes found in SFCC since: ${since}. Skipping delta sync.`);
      break;
    }

    if (changesInBatch > 0) {
      logger.debug(`Processing batch ${batchNumber} containing ${changesInBatch} changes.`);
      const acceptedByType = await syncChangesBatch(
        acoClient,
        salesforceClient,
        salesforceOrgId,
        siteId,
        locales,
        logger,
        data.data,
      );

      Object.keys(acceptedByType).forEach(type => {
        totalAcceptedByType[type] += acceptedByType[type];
      });

      totalSyncedChanges += changesInBatch;
      const totalAccepted = Object.values(totalAcceptedByType).reduce((sum, count) => sum + count, 0);
      logger.debug(`Progress: ${totalAccepted} successfully synced out of ${totalChanges} changes.`);
    }
    offset += SFCC_BATCH_SIZE;
    batchNumber++;
  } while (offset < totalChanges);

  logger.info(`Delta sync for siteId: ${siteId} completed. Total changes synced: ${totalSyncedChanges}`);
  logger.info(
    `${totalAcceptedByType.product} products, ${totalAcceptedByType.priceBook} price books, and ${totalAcceptedByType.price} prices accepted.`,
  );
};

/**
 * Syncs a batch of changes to ACO by grouping them by type and processing each type appropriately.
 *
 * @param {import('@adobe-commerce/aco-ts-sdk').Client} acoClient - The ACO client
 * @param {import('ky').KyInstance} salesforceClient - The Salesforce HTTP client
 * @param {string} salesforceOrgId - The Salesforce organization ID
 * @param {string} siteId - The Salesforce site ID
 * @param {string[]} locales - The locales to sync
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @param {SalesforceTrackedChanges[]} changes - The tracked changes from Salesforce
 * @returns {Promise<{ product: number; priceBook: number; price: number }>} The number of items accepted by ACO by type
 * @throws {StarterKitActionError} If there's an error syncing the changes
 */
const syncChangesBatch = async (acoClient, salesforceClient, salesforceOrgId, siteId, locales, logger, changes) => {
  logger.debug(`Executing batch sync for ${changes.length} changes.`);

  const acceptedByType = { product: 0, priceBook: 0, price: 0 };

  // Group changes by type
  const changesByType = changes.reduce((acc, change) => {
    if (!acc[change.type]) {
      acc[change.type] = [];
    }
    acc[change.type].push(change);
    return acc;
  }, {});

  // Process each change type
  for (const [type, typeChanges] of Object.entries(changesByType)) {
    if (typeChanges.length === 0) continue;

    switch (type) {
      case 'product':
        // Sync products for each locale
        for (const locale of locales) {
          const accepted = await syncProductChanges(
            acoClient,
            salesforceClient,
            salesforceOrgId,
            siteId,
            locale,
            logger,
            typeChanges,
          );
          acceptedByType.product += accepted;
        }
        break;
      case 'priceBook':
        acceptedByType.priceBook = await syncPriceBookChanges(
          acoClient,
          salesforceClient,
          salesforceOrgId,
          siteId,
          logger,
          typeChanges,
        );
        break;
      case 'price':
        acceptedByType.price = await syncPriceChanges(
          acoClient,
          salesforceClient,
          salesforceOrgId,
          siteId,
          locales[0], // The price is the same for all locales
          logger,
          typeChanges,
        );
        break;
      default:
        logger.warn(`Unknown change type: ${type}`);
    }
  }

  logger.debug(
    `Batch changes sync completed. ${acceptedByType.product} products, ${acceptedByType.priceBook} price books, and ${acceptedByType.price} prices accepted.`,
  );
  return acceptedByType;
};

/**
 * Syncs product changes by batching entity IDs and processing them.
 *
 * @param {import('@adobe-commerce/aco-ts-sdk').Client} acoClient - The ACO client
 * @param {import('ky').KyInstance} salesforceClient - The Salesforce HTTP client
 * @param {string} salesforceOrgId - The Salesforce organization ID
 * @param {string} siteId - The Salesforce site ID
 * @param {string} locale - The locale to sync
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @param {SalesforceTrackedChanges[]} changes - The product changes from Salesforce
 * @returns {Promise<number>} The number of products accepted by ACO
 * @throws {StarterKitActionError} If there's an error syncing the changes
 */
const syncProductChanges = async (acoClient, salesforceClient, salesforceOrgId, siteId, locale, logger, changes) => {
  logger.debug(`[${locale}] Processing ${changes.length} product changes`);

  const productIdsToSync = changes.filter(change => !change.isDeleted).map(change => change.entityId);
  logger.debug(`[${locale}] Found ${productIdsToSync.length} products to sync`);
  const productIdsToDelete = changes.filter(change => change.isDeleted).map(change => change.entityId);
  logger.debug(`[${locale}] Found ${productIdsToDelete.length} products to delete`);

  let totalAccepted = 0;
  for (let i = 0; i < productIdsToSync.length; i += ACO_BATCH_SIZE) {
    const productIdBatch = productIdsToSync.slice(i, i + ACO_BATCH_SIZE);
    const accepted = await syncProductsBatch(
      acoClient,
      salesforceClient,
      salesforceOrgId,
      logger,
      siteId,
      locale,
      productIdBatch,
    );
    totalAccepted += accepted;
  }

  if (productIdsToDelete.length > 0) {
    totalAccepted += await deleteProducts(acoClient, productIdsToDelete, locale, logger);
  }

  return totalAccepted;
};

/**
 * Syncs price book changes by fetching individual price books and processing them.
 *
 * @param {import('@adobe-commerce/aco-ts-sdk').Client} acoClient - The ACO client
 * @param {import('ky').KyInstance} salesforceClient - The Salesforce HTTP client
 * @param {string} salesforceOrgId - The Salesforce organization ID
 * @param {string} siteId - The Salesforce site ID
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @param {SalesforceTrackedChanges[]} changes - The price book changes from Salesforce
 * @returns {Promise<number>} The number of price books accepted by ACO
 * @throws {StarterKitActionError} If there's an error fetching or syncing the price book
 */
const syncPriceBookChanges = async (acoClient, salesforceClient, salesforceOrgId, siteId, logger, changes) => {
  logger.debug(`Processing ${changes.length} price book changes`);
  const salesforcePriceBooks = [];
  const priceBooksToDelete = [];

  let totalAccepted = 0;
  for (const change of changes) {
    try {
      const res = await getSalesforcePriceBookById(salesforceClient, salesforceOrgId, siteId, change.entityId);
      logger.debug(`Status: ${res.status}`);
      if (!res.ok) {
        logger.error(`Failed to fetch price book ${change.entityId}: ${res.status} ${res.statusText}`);
        throw new StarterKitActionError('Failed to fetch price book', res.status, res.statusText);
      }

      /** @type {SalesforcePriceBook} */
      const priceBookData = await res.json();
      salesforcePriceBooks.push(priceBookData);
    } catch (error) {
      // Handle 404 errors (price book was deleted)
      if (error.response && error.response.status === 404) {
        logger.warn(`Price book ${change.entityId} not found: also deleting from ACO`);
        priceBooksToDelete.push(change.entityId);
        continue;
      }
      // Re-throw other errors
      throw error;
    }
  }

  for (let i = 0; i < salesforcePriceBooks.length; i += ACO_BATCH_SIZE) {
    const priceBookBatch = salesforcePriceBooks.slice(i, i + ACO_BATCH_SIZE);
    const accepted = await syncPriceBooksBatch(acoClient, priceBookBatch, logger);
    totalAccepted += accepted;
  }

  if (priceBooksToDelete.length > 0) {
    totalAccepted += await deletePriceBooks(acoClient, priceBooksToDelete, logger);
  }

  return totalAccepted;
};

/**
 * Syncs price changes by fetching products (which contain prices) and processing them.
 *
 * @param {import('@adobe-commerce/aco-ts-sdk').Client} acoClient - The ACO client
 * @param {import('ky').KyInstance} salesforceClient - The Salesforce HTTP client
 * @param {string} salesforceOrgId - The Salesforce organization ID
 * @param {string} siteId - The Salesforce site ID
 * @param {string} locale - The locale to sync. This can be any valid locale, as the price is the same for all locales.
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @param {SalesforceTrackedChanges[]} changes - The price changes from Salesforce
 * @returns {Promise<number>} The number of prices accepted by ACO
 * @throws {StarterKitActionError} If there's an error syncing the changes
 */
const syncPriceChanges = async (acoClient, salesforceClient, salesforceOrgId, siteId, locale, logger, changes) => {
  logger.debug(`Processing ${changes.length} price changes`);

  const productIdsToSync = changes.filter(change => !change.isDeleted).map(change => change.entityId);
  logger.debug(`Found ${productIdsToSync.length} prices to sync`);
  const pricesToDelete = changes
    .filter(change => change.isDeleted)
    .map(change => ({
      sku: change.entityId,
      priceBookId: change.priceBookId,
    }));
  logger.debug(`Found ${pricesToDelete.length} prices to delete`);

  let totalAccepted = 0;
  for (let i = 0; i < productIdsToSync.length; i += ACO_BATCH_SIZE) {
    const productIdBatch = productIdsToSync.slice(i, i + ACO_BATCH_SIZE);
    logger.debug(`Fetching products for price sync batch containing ${productIdBatch.length} products`);

    const res = await getSalesforceProductByIds(salesforceClient, salesforceOrgId, siteId, locale, productIdBatch);
    if (!res.ok) {
      logger.error(`Failed to fetch products for price sync: ${res.status} ${res.statusText}`);
      throw new StarterKitActionError('Failed to fetch products for price sync', res.status, res.statusText);
    }

    /** @type {SalesforceProductsResponse} */
    const salesforceResponse = await res.json();
    const salesforceProducts = salesforceResponse.data;

    if (salesforceProducts && salesforceProducts.length > 0) {
      await syncPricesFromProducts(acoClient, salesforceProducts, locale, logger);
      totalAccepted += salesforceProducts.length;
    }
  }

  if (pricesToDelete.length > 0) {
    totalAccepted += await deletePrices(acoClient, pricesToDelete, logger);
  }

  return totalAccepted;
};

module.exports = {
  syncAllChanges,
  syncChangesBatch,
};
