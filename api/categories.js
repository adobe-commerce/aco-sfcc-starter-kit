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
const { createAcoClient } = require('./aco');
const { getSiteCatalogId } = require('./helpers');
const { createSalesforceAdminHttpClient, getSalesforceCategories } = require('./salesforce');
const { StarterKitActionError } = require('../actions/responses');
const { transformCategories } = require('../transformers');

const SALESFORCE_BATCH_SIZE = 50;
const ACO_BATCH_SIZE = 100;

/**
 * Syncs all Categories from Salesforce to ACO.
 *
 * @param {SalesforceApiOptions} salesforceApiOptions - Configuration options for the API client.
 * @param {AcoClientOptions} acoClientOptions - Configuration options for the ACO client.
 * @param {string} salesforceOrgId - The Salesforce organization ID.
 * @param {string} siteId - The Salesforce site ID.
 * @param {string[]} locales - The locales to sync.
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance.
 * @throws {StarterKitActionError} If there's an error retrieving or syncing the product.
 */
const syncAllCategories = async (salesforceApiOptions, acoClientOptions, salesforceOrgId, siteId, locales, logger) => {
  logger.info('Syncing all categories from Salesforce to ACO');
  logger.debug('Retrieving categories from Salesforce');
  const client = await createSalesforceAdminHttpClient(salesforceApiOptions);
  const acoClient = createAcoClient(acoClientOptions);

  let totalCategories = 0;
  let offset = 0;
  let totalSyncedCategories = 0;
  let batchNumber = 1;
  let totalAccepted = 0;
  let categoriesBuffer = [];

  do {
    const catalogId = await getSiteCatalogId(client, salesforceOrgId, siteId, logger);
    const res = await getSalesforceCategories(client, salesforceOrgId, catalogId, SALESFORCE_BATCH_SIZE, offset);
    if (!res.ok) {
      logger.error(`Failed to get categories from Salesforce: ${res.status} ${res.statusText}`);
      throw new StarterKitActionError('Failed to get categories from Salesforce', res.status, res.statusText);
    }

    /** @type {SalesforceCategoryResponse} */
    const salesforceResponse = await res.json();
    /** @type {SalesforceCategory[]} */
    let salesforceCategories = salesforceResponse.data;
    // Remove the root category
    salesforceCategories = salesforceCategories.filter(category => category.id !== 'root');
    const categoriesInBatch = salesforceCategories.length;
    totalCategories = salesforceResponse.total;

    if (categoriesInBatch > 0) {
      logger.debug(`Retrieved Salesforce batch ${batchNumber} containing ${categoriesInBatch} categories.`);
      categoriesBuffer.push(...salesforceCategories);
      totalSyncedCategories += categoriesInBatch;

      // Flush buffer when we have enough to create a full ACO batch
      if (categoriesBuffer.length >= ACO_BATCH_SIZE) {
        // Process complete batches
        while (categoriesBuffer.length >= ACO_BATCH_SIZE) {
          const batch = categoriesBuffer.splice(0, ACO_BATCH_SIZE);
          // Sync this batch for each locale
          for (const locale of locales) {
            totalAccepted += await syncCategoriesBatch(acoClient, batch, locale, logger);
          }
        }
      }
    }

    offset += SALESFORCE_BATCH_SIZE;
    batchNumber++;
  } while (offset < totalCategories);

  // Flush any remaining categories in the buffer
  if (categoriesBuffer.length > 0) {
    for (const locale of locales) {
      totalAccepted += await syncCategoriesBatch(acoClient, categoriesBuffer, locale, logger);
    }
  }

  logger.info(
    `Categories sync completed. Total categories synced: ${totalSyncedCategories}, total accepted: ${totalAccepted}`,
  );
};

/**
 * Syncs a batch of Categories from Salesforce to ACO.
 *
 * @param {import('@adobe-commerce/aco-ts-sdk').Client} acoClient - The ACO client
 * @param {SalesforceCategory[]} salesforceCategories - The Salesforce categories
 * @param {string} locale - The locale to sync
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @returns {Promise<number>} The number of categories accepted by ACO
 * @throws {StarterKitActionError} If there's an error retrieving or syncing the product
 */
const syncCategoriesBatch = async (acoClient, salesforceCategories, locale, logger) => {
  logger.debug(`[${locale}] Transforming ${salesforceCategories.length} categories`);
  const acoCategories = transformCategories(salesforceCategories, locale);

  logger.debug(`[${locale}] Syncing batch of ${acoCategories.length} categories to ACO`);
  const acoRes = await acoClient.createCategories(acoCategories);
  logger.debug(`[${locale}] ACO categories response: ${JSON.stringify(acoRes)}`);

  if (!acoRes.ok) {
    logger.error(`[${locale}] Failed to sync categories to ACO: ${acoRes.status} ${acoRes.statusText}`);
    throw new StarterKitActionError('Failed to sync categories to ACO', acoRes.status, acoRes.statusText);
  }

  return acoRes.data.acceptedCount || 0;
};

/**
 * Deletes a batch of categories from ACO for a single locale.
 *
 * @param {import('@adobe-commerce/aco-ts-sdk').Client} acoClient - The ACO client
 * @param {string[]} slugs - The category slugs to delete
 * @param {string} locale - The locale to delete the categories from
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @returns {Promise<number>} The number of categories deleted by ACO
 * @throws {StarterKitActionError} If there's an error deleting the categories
 */
const deleteCategories = async (acoClient, slugs, locale, logger) => {
  const deletionObjects = slugs.map(slug => ({ slug, source: { locale } }));

  logger.debug(`[${locale}] Deleting batch of ${deletionObjects.length} categories from ACO`);
  const acoRes = await acoClient.deleteCategories(deletionObjects);

  if (!acoRes.ok) {
    logger.error(`[${locale}] Failed to delete categories from ACO: ${acoRes.status} ${acoRes.statusText}`);
    throw new StarterKitActionError('Failed to delete categories from ACO', acoRes.status, acoRes.statusText);
  }

  return acoRes.data.acceptedCount || 0;
};

module.exports = {
  syncAllCategories,
  syncCategoriesBatch,
  deleteCategories,
};
