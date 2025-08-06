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
const { StarterKitActionError } = require('../actions/responses');
const { getDefaultMetadata } = require('../data/metadata');

const BATCH_SIZE = 100;

const getBatchNumber = index => Math.floor(index / BATCH_SIZE) + 1;

/**
 * Syncs all metadata to ACO for a given set of locales.
 *
 * @param {AcoClientOptions} acoClientOptions - The ACO client options.
 * @param {string[]} locales - The locales to sync.
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @throws {StarterKitActionError} If there's an error retrieving or syncing the metadata
 */
const syncAllMetadata = async (acoClientOptions, locales, logger) => {
  logger.info('Syncing all metadata to ACO');
  const acoClient = createAcoClient(acoClientOptions);

  const allMetadata = locales.flatMap(locale => getDefaultMetadata(locale));
  let totalSyncedMetadata = 0;
  let totalAccepted = 0;

  for (let i = 0; i < allMetadata.length; i += BATCH_SIZE) {
    const metadataBatch = allMetadata.slice(i, i + BATCH_SIZE);
    const batchNumber = getBatchNumber(i);
    logger.debug(`Processing metadata batch ${batchNumber} containing ${metadataBatch.length} metadata items.`);
    totalAccepted += await syncMetadataBatch(acoClient, metadataBatch, logger);
    totalSyncedMetadata += metadataBatch.length;
    logger.debug(`Progress: ${totalAccepted} successfully synced out of ${allMetadata.length} metadata items.`);
  }
  logger.info(`Metadata sync completed successfully. Total synced metadata: ${totalSyncedMetadata}`);
};

/**
 * Syncs a batch of metadata from Salesforce to ACO.
 *
 * @param {import('@adobe-commerce/aco-ts-sdk').Client} acoClient - The ACO client
 * @param {import('@adobe-commerce/aco-ts-sdk').FeedMetadata[]} metadata - The metadata to sync
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @returns {Promise<number>} The number of metadata items accepted by ACO
 * @throws {StarterKitActionError} If there's an error retrieving or syncing the metadata
 */
const syncMetadataBatch = async (acoClient, metadata, logger) => {
  logger.debug('Executing batch metadata sync');
  const acoRes = await acoClient.createProductMetadata(metadata);
  logger.debug(`ACO metadata response: ${JSON.stringify(acoRes)}`);

  if (!acoRes.ok) {
    logger.error(`Failed to sync product metadata to ACO: ${acoRes.status} ${acoRes.statusText}`);
    throw new StarterKitActionError('Failed to sync product metadata to ACO', acoRes.status, acoRes.statusText);
  }
  logger.debug('Batch metadata sync completed successfully');
  return acoRes.data.acceptedCount || 0;
};

module.exports = {
  syncAllMetadata,
  syncMetadataBatch,
};
