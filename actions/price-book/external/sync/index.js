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
  AIO_STATE_KEY_LAST_PRICE_BOOK_SYNC_RUN,
  HTTP_INTERNAL_ERROR,
} = require('../../../constants');
const { actionSuccessResponse, actionErrorResponse, StarterKitActionError } = require('../../../responses');
const { defineMain } = require('../../../telemetry');
const { configureAcoClient, configureSalesforceApiOptions, syncAllPriceBooks } = require('../../../../api');

const main = async params => {
  const logger = Core.Logger('sync-price-books', {
    level: params.LOG_LEVEL || 'info',
  });

  try {
    logger.info(`Starting price book sync for siteId: ${params.SFCC_SITE_ID}`);
    logger.debug('Initializing AIO state lib');
    const state = await stateLib.init();

    /** @type {SalesforceApiOptions} */
    const salesforceApiOptions = configureSalesforceApiOptions(params);
    /** @type {AcoClientOptions} */
    const acoClientOptions = configureAcoClient(params);

    logger.info(`Syncing all price books for siteId: ${params.SFCC_SITE_ID}`);
    await syncAllPriceBooks(
      salesforceApiOptions,
      acoClientOptions,
      params.SFCC_ORGANIZATION_ID,
      params.SFCC_SITE_ID,
      logger,
    );

    state.put(AIO_STATE_KEY_LAST_PRICE_BOOK_SYNC_RUN, new Date().toISOString(), { ttl: AIO_STATE_MAX_TTL });
    logger.info('Price book sync completed successfully');
    return actionSuccessResponse('Price book sync completed successfully');
  } catch (error) {
    logger.error(`Error syncing price books to ACO: ${error}`);
    if (error instanceof StarterKitActionError) {
      return actionErrorResponse(error.status, error.message);
    }
    return actionErrorResponse(HTTP_INTERNAL_ERROR, error.message);
  }
};

module.exports.main = defineMain(main);
