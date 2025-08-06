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
const { actionSuccessResponse, actionErrorResponse } = require('../responses');
const { HTTP_OK, HTTP_INTERNAL_ERROR } = require('../constants');

/**
 * Please DO NOT DELETE this action; future functionalities planned for upcoming starter kit releases may stop working.
 *
 * This is the starter kit info endpoint. It returns the version of the starter kit and the registration data.
 *
 * @param {GlobalEnv} params - Includes the env params
 * @returns {Promise<ActionResponse>} Returns starter kit version and registration data
 */
const main = async params => {
  const version = require('../../package.json').version;
  const registrations = require('../../scripts/onboarding/config/starter-kit-registrations.json');

  const logger = Core.Logger('starter-kit-info', {
    level: params.LOG_LEVEL || 'info',
  });

  try {
    logger.info('Calling the starter kit info action');
    logger.info(`Successful request: ${HTTP_OK}`);

    return actionSuccessResponse('Successfully retrieved starter kit info', {
      starter_kit_version: version,
      registrations,
    });
  } catch (error) {
    logger.error(error);
    return actionErrorResponse(HTTP_INTERNAL_ERROR, `Server error: ${error.message}`);
  }
};

module.exports = {
  main,
};
