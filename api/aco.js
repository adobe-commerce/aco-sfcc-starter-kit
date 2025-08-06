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

const { createClient } = require('@adobe-commerce/aco-ts-sdk');

/**
 * Configures the ACO client from environment parameters.
 *
 * @param {GlobalEnv} params - The environment parameters.
 * @returns {AcoClientOptions} The ACO client options.
 */
const configureAcoClient = params => {
  /** @type {AcoClientOptions} */
  return {
    clientId: String(params.OAUTH_CLIENT_ID),
    clientSecret: String(params.OAUTH_CLIENT_SECRET),
    tenantId: String(params.ACO_TENANT_ID),
    region: String(params.ACO_REGION),
    environment: String(params.ACO_ENVIRONMENT_TYPE),
  };
};

/**
 * Creates an ACO client.
 *
 * @param {AcoClientOptions} options - The ACO client options.
 * @returns {import('@adobe-commerce/aco-ts-sdk').Client} The ACO client.
 */
const createAcoClient = options => {
  /** @type {import('@adobe-commerce/aco-ts-sdk').ClientConfig} */
  const config = {
    credentials: {
      clientId: options.clientId,
      clientSecret: options.clientSecret,
    },
    tenantId: options.tenantId,
    region: options.region,
    environment: options.environment,
  };

  return createClient(config);
};

module.exports = {
  configureAcoClient,
  createAcoClient,
};
