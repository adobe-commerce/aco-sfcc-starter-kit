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
const { syncPricesFromProducts } = require('./prices');
const {
  createSalesforceAdminHttpClient,
  searchSalesforceProducts,
  getSalesforceProductByIds,
} = require('./salesforce');
const { AIO_STATE_MAX_TTL, AIO_STATE_KEY_LAST_SYNC } = require('../actions/constants');
const { StarterKitActionError } = require('../actions/responses');
const { transformProduct } = require('../transformers');

const BATCH_SIZE = 100;

/**
 * Syncs all products from Salesforce to ACO.
 *
 * @param {SalesforceApiOptions} salesforceApiOptions - Configuration options for the API client.
 * @param {AcoClientOptions} acoClientOptions - Configuration options for the ACO client.
 * @param {string} salesforceOrgId - The Salesforce organization ID.
 * @param {string} siteId - The Salesforce site ID.
 * @param {string} locale - The locale to sync.
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @throws {StarterKitActionError} If there's an error retrieving or syncing the product
 */
const syncAllProducts = async (salesforceApiOptions, acoClientOptions, salesforceOrgId, siteId, locale, logger) => {
  logger.info(`Syncing all products from Salesforce to ACO for siteId: ${siteId} and locale: ${locale}`);

  logger.debug('Initializing AIO state lib');
  const state = await stateLib.init();

  logger.debug(`[${locale}] Retrieving products from Salesforce`);
  const salesforceClient = await createSalesforceAdminHttpClient(salesforceApiOptions);
  const acoClient = createAcoClient(acoClientOptions);

  let totalProducts = 0;
  let offset = 0;
  let totalSyncedProducts = 0;
  let batchNumber = 1;
  let totalAccepted = 0;

  do {
    const res = await searchSalesforceProducts(salesforceClient, salesforceOrgId, siteId, BATCH_SIZE, offset, '*', [
      'none',
    ]);
    if (!res.ok) {
      logger.error(`[${locale}] Failed to retrieve product ids from Salesforce: ${res.status} ${res.statusText}`);
      throw new StarterKitActionError('Failed to retrieve product ids from Salesforce', res.status, res.statusText);
    }
    // Save the last sync timestamp to AIO state
    state.put(AIO_STATE_KEY_LAST_SYNC, new Date().toISOString(), { ttl: AIO_STATE_MAX_TTL });

    /** @type {SalesforceProductSearchResponse} */
    const data = await res.json();
    const productIds = data.hits.map(product => product.id);
    const productsInBatch = productIds.length;
    totalProducts = data.total;

    if (productsInBatch > 0) {
      logger.debug(`[${locale}] Processing batch ${batchNumber} containing ${productsInBatch} products.`);
      totalAccepted += await syncProductsBatch(
        acoClient,
        salesforceClient,
        salesforceOrgId,
        logger,
        siteId,
        locale,
        productIds,
      );
      totalSyncedProducts += productsInBatch;
      logger.debug(`[${locale}] Progress: ${totalAccepted} successfully synced out of ${totalProducts} products.`);
    }
    offset += BATCH_SIZE;
    batchNumber++;
  } while (offset < totalProducts);

  logger.info(
    `Sync for siteId: ${siteId} and locale: ${locale} completed. Total products synced: ${totalSyncedProducts}`,
  );
};

/**
 * Syncs a batch of products from Salesforce to ACO.
 *
 * @param {import('@adobe-commerce/aco-ts-sdk').Client} acoClient - The ACO client.
 * @param {import('ky').KyInstance} salesforceClient - The Salesforce HTTP client.
 * @param {string} salesforceOrgId - The Salesforce organization ID.
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @param {string} siteId - The Salesforce site ID.
 * @param {string} locale - The locale to sync.
 * @param {string[]} productIds - The product IDs to sync
 * @returns {Promise<number>} The number of products accepted by ACO
 * @throws {StarterKitActionError} If there's an error retrieving or syncing the product
 */
const syncProductsBatch = async (acoClient, salesforceClient, salesforceOrgId, logger, siteId, locale, productIds) => {
  logger.debug(`[${locale}] Executing batch sync for ${productIds.length} products`);
  const res = await getSalesforceProductByIds(salesforceClient, salesforceOrgId, siteId, locale, productIds);
  if (!res.ok) {
    logger.error(`[${locale}] Failed to get products from Salesforce: ${res.status} ${res.statusText}`);
    throw new StarterKitActionError('Failed to get products from Salesforce', res.status, res.statusText);
  }

  /** @type {SalesforceProductsResponse} */
  const salesforceResponse = await res.json();
  /** @type {SalesforceProduct[]} */
  const salesforceProducts = salesforceResponse.data;
  logger.debug(`[${locale}] Transforming products from Salesforce to ACO structure`);
  const acoProducts = salesforceProducts.map(product => transformProduct(product));

  logger.debug(`[${locale}] Syncing products to ACO`);
  const acoRes = await acoClient.createProducts(acoProducts);
  logger.debug(`[${locale}] ACO response: ${JSON.stringify(acoRes)}`);

  if (!acoRes.ok) {
    logger.error(`[${locale}] Failed to sync products to ACO: ${acoRes.status} ${acoRes.statusText}`);
    throw new StarterKitActionError('Failed to sync products to ACO', acoRes.status, acoRes.statusText);
  }

  // Sync prices to ACO from products retrieved from Salesforce
  await syncPricesFromProducts(acoClient, salesforceProducts, locale, logger);
  logger.debug(`[${locale}] Batch sync completed successfully`);
  return acoRes.data.acceptedCount || 0;
};

/**
 * Deletes products from ACO.
 *
 * @param {import('@adobe-commerce/aco-ts-sdk').Client} acoClient - The ACO client
 * @param {string[]} productIds - The product IDs to delete
 * @param {string} locale - The locale to delete the products from
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @returns {Promise<number>} The number of products deleted by ACO
 * @throws {StarterKitActionError} If there's an error deleting the products
 */
const deleteProducts = async (acoClient, productIds, locale, logger) => {
  const totalProducts = productIds.length;
  logger.info(`Deleting ${totalProducts} products from ACO`);

  let totalDeleted = 0;
  let batchNumber = 1;

  for (let i = 0; i < totalProducts; i += BATCH_SIZE) {
    const batch = productIds.slice(i, i + BATCH_SIZE);
    const batchSize = batch.length;

    logger.debug(`Processing products deletion batch ${batchNumber} containing ${batchSize} products.`);
    const acoRes = await acoClient.deleteProducts(batch.map(id => ({ sku: id, source: { locale } })));

    if (!acoRes.ok) {
      logger.error(`Failed to delete products from ACO: ${acoRes.status} ${acoRes.statusText}`);
      throw new StarterKitActionError('Failed to delete products from ACO', acoRes.status, acoRes.statusText);
    }

    totalDeleted += acoRes.data.acceptedCount || 0;

    logger.debug(`Progress: ${totalDeleted} successfully deleted out of ${totalProducts} products.`);
    batchNumber++;
  }

  logger.info(`Products deletion completed. Total products deleted: ${totalDeleted}`);
  return totalDeleted;
};

module.exports = {
  syncAllProducts,
  syncProductsBatch,
  deleteProducts,
};
