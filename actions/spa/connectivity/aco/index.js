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
const { createAcoClient, configureAcoClient } = require('../../../../api/aco');
const { HTTP_INTERNAL_ERROR } = require('../../../constants');
const { actionSuccessResponse, actionErrorResponse } = require('../../../responses');
const { defineMain } = require('../../../telemetry');

/**
 * Ensures that the ACO API is reachable.
 *
 * @param {GlobalEnv} params - The environment parameters.
 * @returns {Promise<ActionResponse>} The response of the action.
 */
const main = async params => {
  const logger = Core.Logger('connectivity-aco', {
    level: params.LOG_LEVEL || 'debug',
  });

  try {
    const config = configureAcoClient(params);
    const client = createAcoClient(config);
    // Hit the ACO product ingestion API with an empty array to test connectivity
    const res = await client.createProducts([]);
    if (res.ok) {
      return actionSuccessResponse('Successful ACO connectivity test');
    }
    // @ts-ignore
    return actionErrorResponse(HTTP_INTERNAL_ERROR, res.error.message);
  } catch (error) {
    logger.error(`Failed ACO connectivity test. Message: ${error.message}`, error);
    return actionErrorResponse(HTTP_INTERNAL_ERROR, error.message);
  }
};

module.exports.main = defineMain(main);
