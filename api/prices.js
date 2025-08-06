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
const { StarterKitActionError } = require('../actions/responses');
const { transformPrices } = require('../transformers');

const BATCH_SIZE = 100;

/**
 * Syncs a batch of prices from Salesforce to ACO.
 *
 * @param {import('@adobe-commerce/aco-ts-sdk').Client} acoClient - The ACO client
 * @param {SalesforceProduct[]} salesforceProducts - The Salesforce products with prices
 * @param {string} locale - The locale being synced
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @throws {StarterKitActionError} If there's an error retrieving or syncing the prices
 */
const syncPricesFromProducts = async (acoClient, salesforceProducts, locale, logger) => {
  logger.debug(`[${locale}] Executing batch price sync`);
  logger.debug(`[${locale}] Transforming product prices from Salesforce to ACO structure`);
  const acoPrices = transformPrices(salesforceProducts);
  let batchNumber = 1;
  let totalAccepted = 0;

  logger.debug(`[${locale}] Syncing product prices to ACO`);
  for (let i = 0; i < acoPrices.length; i += BATCH_SIZE) {
    const priceBatch = acoPrices.slice(i, i + BATCH_SIZE);
    logger.debug(`[${locale}] Syncing price batch ${batchNumber} containing ${priceBatch.length} prices.`);
    const acoRes = await acoClient.createPrices(priceBatch);
    logger.debug(`[${locale}] ACO prices response: ${JSON.stringify(acoRes)}`);

    if (!acoRes.ok) {
      logger.error(`[${locale}] Failed to sync product prices to ACO: ${acoRes.status} ${acoRes.statusText}`);
      throw new StarterKitActionError('Failed to sync product prices to ACO', acoRes.status, acoRes.statusText);
    }
    totalAccepted += acoRes.data.acceptedCount || 0;
    logger.debug(`[${locale}] Progress: ${totalAccepted} successfully synced out of ${acoPrices.length} items.`);
    batchNumber++;
  }
  logger.debug(`[${locale}] Batch price sync completed successfully. Total prices synced: ${totalAccepted}`);
};

/**
 * Deletes prices from ACO.
 *
 * @param {import('@adobe-commerce/aco-ts-sdk').Client} acoClient - The ACO client
 * @param {import('@adobe-commerce/aco-ts-sdk').FeedPricesDelete[]} prices - Array of ACO price delete objects.
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @returns {Promise<number>} The number of prices deleted
 * @throws {StarterKitActionError} If there's an error deleting the prices
 */
const deletePrices = async (acoClient, prices, logger) => {
  const totalPrices = prices.length;
  logger.info(`Deleting ${totalPrices} prices from ACO`);

  let totalDeleted = 0;
  let batchNumber = 1;

  for (let i = 0; i < totalPrices; i += BATCH_SIZE) {
    const batch = prices.slice(i, i + BATCH_SIZE);
    const batchSize = batch.length;

    logger.debug(`Deleting prices batch ${batchNumber} containing ${batchSize} prices.`);
    const acoRes = await acoClient.deletePrices(batch);

    if (!acoRes.ok) {
      logger.error(`Failed to delete prices from ACO: ${acoRes.status} ${acoRes.statusText}`);
      throw new StarterKitActionError('Failed to delete prices from ACO', acoRes.status, acoRes.statusText);
    }

    totalDeleted += acoRes.data.acceptedCount || 0;

    logger.debug(`Progress: ${totalDeleted} successfully deleted out of ${totalPrices} prices.`);
    batchNumber++;
  }

  logger.info(`Prices deletion completed. Total prices deleted: ${totalDeleted}`);
  return totalDeleted;
};

module.exports = {
  syncPricesFromProducts,
  deletePrices,
};
