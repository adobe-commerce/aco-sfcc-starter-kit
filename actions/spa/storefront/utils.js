/*
  Copyright 2022 Adobe. All rights reserved.
  This file is licensed to you under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License. You may obtain a copy
  of the License at http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software distributed under
  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
  OF ANY KIND, either express or implied. See the License for the specific language
  governing permissions and limitations under the License.
*/
const { default: fetchToCurl } = require("fetch-to-curl");
const {
  getStorefrontGraphqlClient,
} = require("../../../utils/graphql/storefront-client");

/**
 * Executes a GraphQL query with common client setup
 * @param {object} params - Parameters for the query execution
 * @param {GlobalEnv} params.env - The environment parameters
 * @param {RequestInit} params.requestOptions - Options for the GraphQL client request
 * @param {object} params.query - The GraphQL query to execute
 * @param {Record<string, unknown>} params.variables - Variables for the GraphQL query
 * @returns {Promise<object>} The GraphQL query result
 */
async function executeStorefrontQuery({
  env,
  requestOptions,
  query,
  variables,
}) {
  const storefrontGraphqlSettings = {
    baseUrl: env.OPTIMIZER_STOREFRONT_API_URL,
    apiKey: env.OPTIMIZER_STOREFRONT_API_KEY,
    environmentId: env.OPTIMIZER_ENVIRONMENT_ID,
  };

  let curlRequest = "";
  let graphqlRequest = "";
  const client = await getStorefrontGraphqlClient(storefrontGraphqlSettings, {
    hooks: {
      afterResponse: [
        async (request, options) => {
          curlRequest = fetchToCurl(request.url, options);
          graphqlRequest = await request.json();
        },
      ],
    },
    ...requestOptions,
  });

  return {
    queryResult: await client.query(query, variables).toPromise(),
    curlRequest,
    graphqlRequest,
  };
}

module.exports = {
  executeStorefrontQuery,
};
