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
const { createSalesforceAdminHttpClient, getSalesforcePriceBooks } = require('./salesforce');
const { StarterKitActionError } = require('../actions/responses');
const { transformPriceBooks } = require('../transformers');

const BATCH_SIZE = 100;

/**
 * Syncs all Price Books from Salesforce to ACO.
 *
 * @param {SalesforceApiOptions} salesforceApiOptions - Configuration options for the API client.
 * @param {AcoClientOptions} acoClientOptions - Configuration options for the ACO client.
 * @param {string} salesforceOrgId - The Salesforce organization ID.
 * @param {string} siteId - The Salesforce site ID.
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @throws {StarterKitActionError} If there's an error retrieving or syncing the product
 */
const syncAllPriceBooks = async (salesforceApiOptions, acoClientOptions, salesforceOrgId, siteId, logger) => {
  logger.info('Syncing all price books from Salesforce to ACO');
  logger.debug('Retrieving price books from Salesforce');
  const client = await createSalesforceAdminHttpClient(salesforceApiOptions);
  const acoClient = createAcoClient(acoClientOptions);

  let totalPriceBooks = 0;
  let offset = 0;
  let totalSyncedPriceBooks = 0;
  let batchNumber = 1;
  let totalAccepted = 0;

  do {
    const res = await getSalesforcePriceBooks(client, salesforceOrgId, siteId, BATCH_SIZE, offset);
    if (!res.ok) {
      logger.error(`Failed to get price books from Salesforce: ${res.status} ${res.statusText}`);
      throw new StarterKitActionError('Failed to get price books from Salesforce', res.status, res.statusText);
    }

    /** @type {SalesforcePriceBookResponse} */
    const salesforceResponse = await res.json();
    /** @type {SalesforcePriceBook[]} */
    const salesforcePriceBooks = salesforceResponse.data;
    const priceBooksInBatch = salesforcePriceBooks.length;
    totalPriceBooks = salesforceResponse.total;

    if (priceBooksInBatch > 0) {
      logger.debug(`Processing price books batch ${batchNumber} containing ${priceBooksInBatch} price books.`);
      totalAccepted += await syncPriceBooksBatch(acoClient, salesforcePriceBooks, logger);
      totalSyncedPriceBooks += priceBooksInBatch;
      logger.debug(`Progress: ${totalAccepted} successfully synced out of ${totalPriceBooks} price books.`);
    }

    offset += BATCH_SIZE;
    batchNumber++;
  } while (offset < totalPriceBooks);
  logger.info(`Price books sync completed. Total price books synced: ${totalSyncedPriceBooks}`);
};

/**
 * Syncs a batch of Price Books from Salesforce to ACO.
 *
 * @param {import('@adobe-commerce/aco-ts-sdk').Client} acoClient - The ACO client
 * @param {SalesforcePriceBook[]} salesforcePriceBooks - The Salesforce price books
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @returns {Promise<number>} The number of price books accepted by ACO
 * @throws {StarterKitActionError} If there's an error retrieving or syncing the product
 */
const syncPriceBooksBatch = async (acoClient, salesforcePriceBooks, logger) => {
  logger.debug('Transforming price books from Salesforce to ACO structure');
  const acoPriceBooks = transformPriceBooks(salesforcePriceBooks);

  logger.debug('Syncing price books to ACO');
  const acoRes = await acoClient.createPriceBooks(acoPriceBooks);
  logger.debug(`ACO price books response: ${JSON.stringify(acoRes)}`);

  if (!acoRes.ok) {
    logger.error(`Failed to sync price books to ACO: ${acoRes.status} ${acoRes.statusText}`);
    throw new StarterKitActionError('Failed to sync price books to ACO', acoRes.status, acoRes.statusText);
  }
  return acoRes.data.acceptedCount || 0;
};

/**
 * Deletes price books from ACO.
 *
 * @param {import('@adobe-commerce/aco-ts-sdk').Client} acoClient - The ACO client
 * @param {string[]} priceBooksIds - The price book IDs to delete
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @returns {Promise<number>} The number of price books deleted by ACO
 * @throws {StarterKitActionError} If there's an error deleting the price books
 */
const deletePriceBooks = async (acoClient, priceBooksIds, logger) => {
  const totalPriceBooks = priceBooksIds.length;
  logger.info(`Deleting ${totalPriceBooks} price books from ACO`);

  let totalDeleted = 0;
  let batchNumber = 1;

  for (let i = 0; i < totalPriceBooks; i += BATCH_SIZE) {
    const batch = priceBooksIds.slice(i, i + BATCH_SIZE);
    const batchSize = batch.length;

    logger.debug(`Processing price books deletion batch ${batchNumber} containing ${batchSize} price books.`);
    const acoRes = await acoClient.deletePriceBooks(batch.map(id => ({ priceBookId: id })));

    if (!acoRes.ok) {
      logger.error(`Failed to delete price books from ACO: ${acoRes.status} ${acoRes.statusText}`);
      throw new StarterKitActionError('Failed to delete price books from ACO', acoRes.status, acoRes.statusText);
    }

    totalDeleted += acoRes.data.acceptedCount || 0;

    logger.debug(`Progress: ${totalDeleted} successfully deleted out of ${totalPriceBooks} price books.`);
    batchNumber++;
  }

  logger.info(`Price books deletion completed. Total price books deleted: ${totalDeleted}`);
  return totalDeleted;
};

module.exports = {
  syncAllPriceBooks,
  syncPriceBooksBatch,
  deletePriceBooks,
};
