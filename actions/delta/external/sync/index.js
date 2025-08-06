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
  AIO_STATE_KEY_DELTA_SYNC_IN_PROGRESS,
  AIO_STATE_KEY_FULL_SYNC_IN_PROGRESS,
  AIO_STATE_KEY_LAST_SYNC,
  AIO_STATE_KEY_LAST_DELTA_SYNC_RUN,
  HTTP_INTERNAL_ERROR,
} = require('../../../constants');
const { actionSuccessResponse, actionErrorResponse, StarterKitActionError } = require('../../../responses');
const { defineMain } = require('../../../telemetry');
const { syncAllChanges, configureSalesforceApiOptions, configureAcoClient } = require('../../../../api');

const deltaSyncSite = async (params, logger, since) => {
  /** @type {SalesforceApiOptions} */
  const salesforceApiOptions = configureSalesforceApiOptions(params);
  /** @type {AcoClientOptions} */
  const acoClientOptions = configureAcoClient(params);
  const localesToSync = params.SFCC_LOCALES_TO_SYNC.split(',');

  await syncAllChanges(
    salesforceApiOptions,
    acoClientOptions,
    params.SFCC_ORGANIZATION_ID,
    params.SFCC_SITE_ID,
    localesToSync,
    since,
    logger,
  );
};

const main = async params => {
  const logger = Core.Logger('sync-delta-site', {
    level: params.LOG_LEVEL || 'info',
  });

  logger.debug('Initializing AIO state lib');
  const state = await stateLib.init();

  const fullSyncInProgress = await state.get(AIO_STATE_KEY_FULL_SYNC_IN_PROGRESS);
  if (fullSyncInProgress?.value === 'true') {
    logger.info('Full sync is in progress, skipping delta sync');
    return actionSuccessResponse('Full sync is in progress, skipping delta sync');
  }

  const deltaSyncInProgress = await state.get(AIO_STATE_KEY_DELTA_SYNC_IN_PROGRESS);
  if (deltaSyncInProgress?.value === 'true') {
    logger.info('Another delta sync is in progress, skipping this one');
    return actionSuccessResponse('Another delta sync is in progress, skipping this one');
  }

  state.put(AIO_STATE_KEY_DELTA_SYNC_IN_PROGRESS, 'true', { ttl: AIO_STATE_MAX_TTL });

  try {
    logger.info(`Starting delta sync for siteId: ${params.SFCC_SITE_ID}`);

    let now = new Date();
    now.setDate(now.getDate() - 10);
    let since = now.toISOString();

    if (params.data.overrideSince) {
      since = params.data.overrideSince;
      logger.info(`Using override since date for delta sync: ${since}`);
    } else {
      /*
       * This value is set in the delta.js syncAllChanges function (last delta sync)
       * or in the products.js syncAllProducts function (last full sync) in order for
       * the timestamp to be closer to the SFCC operations so we do not
       * miss any changes.
       */
      const lastSync = await state.get(AIO_STATE_KEY_LAST_SYNC);
      if (lastSync?.value) {
        since = lastSync.value;
        logger.info(`Syncing delta changes since last sync: ${since}`);
      } else {
        logger.info(`No last sync found, syncing delta changes since ${since} (default 7 days ago)`);
      }
    }

    await deltaSyncSite(params, logger, since);

    state.put(AIO_STATE_KEY_LAST_DELTA_SYNC_RUN, new Date().toISOString(), { ttl: AIO_STATE_MAX_TTL });
    logger.info(`Delta sync for siteId: ${params.SFCC_SITE_ID} completed successfully`);
    return actionSuccessResponse('Delta sync completed successfully');
  } catch (error) {
    logger.error(`Error executing delta sync: ${error}`);
    if (error instanceof StarterKitActionError) {
      return actionErrorResponse(error.status, error.message);
    }
    return actionErrorResponse(HTTP_INTERNAL_ERROR, error.message);
  } finally {
    state.put(AIO_STATE_KEY_DELTA_SYNC_IN_PROGRESS, 'false', { ttl: AIO_STATE_MAX_TTL });
  }
};

module.exports.main = defineMain(main);
