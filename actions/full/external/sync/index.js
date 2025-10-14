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
  AIO_STATE_KEY_FULL_SYNC_IN_PROGRESS,
  AIO_STATE_KEY_LAST_FULL_SYNC_RUN,
  HTTP_INTERNAL_ERROR,
} = require('../../../constants');
const { actionSuccessResponse, actionErrorResponse, StarterKitActionError } = require('../../../responses');
const { defineMain } = require('../../../telemetry');
const {
  configureAcoClient,
  configureSalesforceApiOptions,
  createSalesforceAdminHttpClient,
  getSiteCatalogId,
  syncAllMetadata,
  syncAllPriceBooks,
  syncAllProducts,
  syncAllCategories,
} = require('../../../../api');

const fullSyncSite = async (params, logger) => {
  /** @type {SalesforceApiOptions} */
  const salesforceApiOptions = configureSalesforceApiOptions(params);
  const salesforceClient = await createSalesforceAdminHttpClient(salesforceApiOptions);
  /** @type {AcoClientOptions} */
  const acoClientOptions = configureAcoClient(params);
  const localesToSync = params.SFCC_LOCALES_TO_SYNC.split(',');

  const catalogId = await getSiteCatalogId(salesforceClient, params.SFCC_ORGANIZATION_ID, params.SFCC_SITE_ID, logger);

  await syncAllMetadata(acoClientOptions, localesToSync, logger);

  await syncAllPriceBooks(
    salesforceApiOptions,
    acoClientOptions,
    params.SFCC_ORGANIZATION_ID,
    params.SFCC_SITE_ID,
    logger,
  );

  await syncAllCategories(
    salesforceApiOptions,
    acoClientOptions,
    params.SFCC_ORGANIZATION_ID,
    params.SFCC_SITE_ID,
    localesToSync,
    logger,
  );

  for (const locale of localesToSync) {
    await syncAllProducts(
      salesforceApiOptions,
      acoClientOptions,
      params.SFCC_ORGANIZATION_ID,
      params.SFCC_SITE_ID,
      catalogId,
      locale,
      logger,
    );
  }
};

const main = async params => {
  const logger = Core.Logger('sync-full-site', {
    level: params.LOG_LEVEL || 'info',
  });

  logger.debug('Initializing AIO state lib');
  const state = await stateLib.init();

  const fullSyncInProgress = await state.get(AIO_STATE_KEY_FULL_SYNC_IN_PROGRESS);
  if (fullSyncInProgress?.value === 'true') {
    logger.info('Full sync is in progress, skipping this one');
    return actionSuccessResponse('Full sync is in progress, skipping this one');
  }

  state.put(AIO_STATE_KEY_FULL_SYNC_IN_PROGRESS, 'true', { ttl: AIO_STATE_MAX_TTL });

  try {
    logger.info(`Starting full site sync for siteId: ${params.SFCC_SITE_ID}`);

    await fullSyncSite(params, logger);

    state.put(AIO_STATE_KEY_LAST_FULL_SYNC_RUN, new Date().toISOString(), { ttl: AIO_STATE_MAX_TTL });
    logger.info(`Full site sync completed successfully`);
    return actionSuccessResponse('Full site sync completed successfully');
  } catch (error) {
    logger.error(`Error executing full site sync: ${error}`);
    if (error instanceof StarterKitActionError) {
      return actionErrorResponse(error.status, error.message);
    }
    return actionErrorResponse(HTTP_INTERNAL_ERROR, error.message);
  } finally {
    state.put(AIO_STATE_KEY_FULL_SYNC_IN_PROGRESS, 'false', { ttl: AIO_STATE_MAX_TTL });
  }
};

module.exports.main = defineMain(main);
