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
const { HTTP_INTERNAL_ERROR, HTTP_NOT_FOUND } = require('../../constants');
const { getDefaultMetadata } = require('../../../data/metadata');
const { actionSuccessResponse, actionErrorResponse, StarterKitActionError } = require('../../responses');
const { defineMain } = require('../../telemetry');

const main = async params => {
  const logger = Core.Logger('list-metadata', {
    level: params.LOG_LEVEL || 'debug',
  });

  try {
    const metadata = params.SFCC_LOCALES_TO_SYNC.split(',').flatMap(locale => getDefaultMetadata(locale));
    if (metadata.length > 0) {
      return actionSuccessResponse('Predefined metadata retrieved successfully', {
        metadata,
      });
    }
    return actionErrorResponse(HTTP_NOT_FOUND, 'No predefined metadata found');
  } catch (error) {
    logger.error(`Error listing predefined metadata: ${error}`);
    if (error instanceof StarterKitActionError) {
      return actionErrorResponse(error.status, error.message);
    }
    return actionErrorResponse(HTTP_INTERNAL_ERROR, error.message);
  }
};

module.exports.main = defineMain(main);
