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

const { Core } = require('@adobe/aio-sdk');
const stateLib = require('@adobe/aio-lib-state');
const {
  AIO_STATE_MAX_TTL,
  AIO_STATE_KEY_LAST_SPECIFIC_PRODUCTS_SYNC_RUN,
  HTTP_INTERNAL_ERROR,
  HTTP_BAD_REQUEST,
} = require('../../../constants');
const { actionSuccessResponse, actionErrorResponse, StarterKitActionError } = require('../../../responses');
const { defineMain } = require('../../../telemetry');
const { validateData } = require('./validator');
const {
  configureSalesforceApiOptions,
  configureAcoClient,
  createAcoClient,
  createSalesforceAdminHttpClient,
  syncProductsBatch,
} = require('../../../../api');

const MAX_PRODUCTS_TO_UPSERT = 25;

/**
 * Syncs the given product SKUs from Salesforce to ACO.
 *
 * @param {object} params - The environment parameters
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance
 * @throws {StarterKitActionError} If there's an error retrieving or syncing the product
 */
const syncProducts = async (params, logger) => {
  /** @type {SalesforceApiOptions} */
  const salesforceApiOptions = configureSalesforceApiOptions(params);
  /** @type {AcoClientOptions} */
  const acoClientOptions = configureAcoClient(params);
  const salesforceClient = await createSalesforceAdminHttpClient(salesforceApiOptions);
  const acoClient = createAcoClient(acoClientOptions);

  const localesToSync = params.SFCC_LOCALES_TO_SYNC.split(',');
  await Promise.all(
    localesToSync.map(async locale => {
      await syncProductsBatch(
        acoClient,
        salesforceClient,
        params.SFCC_ORGANIZATION_ID,
        logger,
        params.SFCC_SITE_ID,
        locale,
        params.data.skus,
      );
    }),
  );
};

const main = async params => {
  const logger = Core.Logger('sync-products', {
    level: params.LOG_LEVEL || 'info',
  });

  try {
    logger.info(`Starting product sync for siteId: ${params.SFCC_SITE_ID} and SKUs: ${params.data.skus.join(', ')}`);
    logger.debug('Initializing AIO state lib');
    const state = await stateLib.init();

    logger.debug(`Validating data: ${JSON.stringify(params.data)}`);
    const validation = await validateData(params);
    if (!validation.success) {
      logger.error(`Validation failed with error: ${validation.error}`);
      return actionErrorResponse(validation.statusCode, validation.error);
    }
    if (params.data.skus.length > MAX_PRODUCTS_TO_UPSERT) {
      return actionErrorResponse(HTTP_BAD_REQUEST, `Maximum number of products to sync is ${MAX_PRODUCTS_TO_UPSERT}`);
    }

    await syncProducts(params, logger);

    state.put(AIO_STATE_KEY_LAST_SPECIFIC_PRODUCTS_SYNC_RUN, new Date().toISOString(), { ttl: AIO_STATE_MAX_TTL });
    logger.debug('Specific product sync completed successfully');
    return actionSuccessResponse('Specific product sync completed successfully');
  } catch (error) {
    logger.error(`Error syncing specific products to ACO: ${error}`);
    if (error instanceof StarterKitActionError) {
      return actionErrorResponse(error.status, error.message);
    }
    return actionErrorResponse(HTTP_INTERNAL_ERROR, error.message);
  }
};

module.exports.main = defineMain(main);
