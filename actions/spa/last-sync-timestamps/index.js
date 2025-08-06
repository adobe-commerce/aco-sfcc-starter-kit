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
  AIO_STATE_KEY_LAST_FULL_SYNC_RUN,
  AIO_STATE_KEY_LAST_DELTA_SYNC_RUN,
  AIO_STATE_KEY_LAST_PRICE_BOOK_SYNC_RUN,
  AIO_STATE_KEY_LAST_METADATA_SYNC_RUN,
  AIO_STATE_KEY_LAST_SPECIFIC_PRODUCTS_SYNC_RUN,
  HTTP_INTERNAL_ERROR,
} = require('../../constants');
const { actionSuccessResponse, actionErrorResponse, StarterKitActionError } = require('../../responses');
const { defineMain } = require('../../telemetry');

const main = async params => {
  const logger = Core.Logger('last-sync-timestamps', {
    level: params.LOG_LEVEL || 'debug',
  });

  try {
    const state = await stateLib.init();

    const lastFullSyncRun = await state.get(AIO_STATE_KEY_LAST_FULL_SYNC_RUN);
    const lastDeltaSyncRun = await state.get(AIO_STATE_KEY_LAST_DELTA_SYNC_RUN);
    const lastPriceBookSyncRun = await state.get(AIO_STATE_KEY_LAST_PRICE_BOOK_SYNC_RUN);
    const lastMetadataSyncRun = await state.get(AIO_STATE_KEY_LAST_METADATA_SYNC_RUN);
    const lastSpecificProductsSyncRun = await state.get(AIO_STATE_KEY_LAST_SPECIFIC_PRODUCTS_SYNC_RUN);

    const lastSyncTimestamps = {
      lastFullSyncRun: lastFullSyncRun?.value,
      lastDeltaSyncRun: lastDeltaSyncRun?.value,
      lastPriceBookSyncRun: lastPriceBookSyncRun?.value,
      lastMetadataSyncRun: lastMetadataSyncRun?.value,
      lastSpecificProductsSyncRun: lastSpecificProductsSyncRun?.value,
    };
    return actionSuccessResponse('Last sync timestamps retrieved successfully', {
      lastSyncTimestamps,
    });
  } catch (error) {
    logger.error(`Error retrieving last sync timestamps: ${error}`);
    if (error instanceof StarterKitActionError) {
      return actionErrorResponse(error.status, error.message);
    }
    return actionErrorResponse(HTTP_INTERNAL_ERROR, error.message);
  }
};

module.exports.main = defineMain(main);
