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
const { HTTP_INTERNAL_ERROR } = require('../../../constants');
const { actionSuccessResponse, actionErrorResponse } = require('../../../responses');
const { defineMain } = require('../../../telemetry');
const {
  configureSalesforceApiOptions,
  createSalesforceAdminHttpClient,
  checkSalesforceConnectivity,
} = require('../../../../api/salesforce');

/**
 * Ensures that the Salesforce API is reachable.
 *
 * @param {GlobalEnv} params - The environment parameters.
 * @returns {Promise<ActionResponse>} The response of the action.
 */
const main = async params => {
  const logger = Core.Logger('connectivity-salesforce', {
    level: params.LOG_LEVEL || 'debug',
  });

  try {
    const config = configureSalesforceApiOptions(params);
    const client = await createSalesforceAdminHttpClient(config);
    const res = await checkSalesforceConnectivity(client, params.SFCC_ORGANIZATION_ID, params.SFCC_SITE_ID);
    if (res.ok) {
      return actionSuccessResponse('Successful Salesforce connectivity test');
    }
    return actionErrorResponse(HTTP_INTERNAL_ERROR, 'Failed Salesforce connectivity test');
  } catch (error) {
    logger.error(`Failed Salesforce connectivity test ${error.message}`);
    return actionErrorResponse(HTTP_INTERNAL_ERROR, error.message);
  }
};

module.exports.main = defineMain(main);
