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

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_ERROR = 500;

const BACKOFFICE_PROVIDER_KEY = 'backoffice';

const PUBLISH_EVENT_SUCCESS = 'OK';

const AIO_STATE_MAX_TTL = 31536000;

const AIO_STATE_KEY_LAST_SYNC = 'lastSyncTimestamp';
const AIO_STATE_KEY_LAST_FULL_SYNC_RUN = 'lastFullSyncRun';
const AIO_STATE_KEY_LAST_DELTA_SYNC_RUN = 'lastDeltaSyncRun';
const AIO_STATE_KEY_LAST_PRICE_BOOK_SYNC_RUN = 'lastPriceBookSyncRun';
const AIO_STATE_KEY_LAST_METADATA_SYNC_RUN = 'lastMetadataSyncRun';
const AIO_STATE_KEY_LAST_SPECIFIC_PRODUCTS_SYNC_RUN = 'lastSpecificProductsSyncRun';
const AIO_STATE_KEY_FULL_SYNC_IN_PROGRESS = 'fullSyncInProgress';
const AIO_STATE_KEY_DELTA_SYNC_IN_PROGRESS = 'deltaSyncInProgress';

module.exports = {
  HTTP_OK,
  HTTP_BAD_REQUEST,
  HTTP_UNAUTHORIZED,
  HTTP_NOT_FOUND,
  HTTP_INTERNAL_ERROR,
  BACKOFFICE_PROVIDER_KEY,
  PUBLISH_EVENT_SUCCESS,
  AIO_STATE_MAX_TTL,
  AIO_STATE_KEY_LAST_SYNC,
  AIO_STATE_KEY_LAST_FULL_SYNC_RUN,
  AIO_STATE_KEY_LAST_DELTA_SYNC_RUN,
  AIO_STATE_KEY_LAST_PRICE_BOOK_SYNC_RUN,
  AIO_STATE_KEY_LAST_METADATA_SYNC_RUN,
  AIO_STATE_KEY_LAST_SPECIFIC_PRODUCTS_SYNC_RUN,
  AIO_STATE_KEY_FULL_SYNC_IN_PROGRESS,
  AIO_STATE_KEY_DELTA_SYNC_IN_PROGRESS,
};
