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

const { default: fetchToCurl } = require('fetch-to-curl');
const { Client, fetchExchange } = require('@urql/core');

/**
 * Builds a URQL client to interact with the Storefront GraphQL API.
 *
 * @param {string} url - The URL of the Storefront API.
 * @param {import('ky').Options} [requestOptions] - The request options for the fetch function.
 * @returns {Promise<Client>} - The Storefront GraphQL client.
 */
const getStorefrontGraphQLClient = async (url, requestOptions) => {
  const ky = (await import('ky')).default;
  const { headers, ...rest } = requestOptions ?? {};
  const graphQLClient = ky.extend({
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...rest,
  });

  const client = new Client({
    url,
    exchanges: [fetchExchange],
    fetch: async (url, options) => graphQLClient(url, options),
  });

  return client;
};

/**
 * Executes a GraphQL query with common client setup
 *
 * @param {object} params - Parameters for the query execution
 * @param {GlobalEnv} params.env - The environment parameters
 * @param {RequestInit} params.requestOptions - Options for the GraphQL client request
 * @param {object} params.query - The GraphQL query to execute
 * @param {Record<string, unknown>} params.variables - Variables for the GraphQL query
 * @returns {Promise<object>} The GraphQL query result
 */
const executeStorefrontQuery = async ({ env, requestOptions, query, variables }) => {
  const urlPrefix = `${env.ACO_REGION.toLowerCase()}${env.ACO_ENVIRONMENT_TYPE.toLowerCase() === 'production' ? '' : '-sandbox'}`;
  const storefrontApiUrl = `https://${urlPrefix}.api.commerce.adobe.com/${env.ACO_TENANT_ID}/graphql`;

  let curlRequest = '';
  let graphqlRequest = '';
  const client = await getStorefrontGraphQLClient(storefrontApiUrl, {
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

  try {
    const result = await client.query(query, variables).toPromise();

    if (result.error) {
      throw new Error(result.error.message || 'GraphQL query failed');
    }

    return {
      queryResult: result,
      curlRequest,
      graphqlRequest,
    };
  } catch (error) {
    console.error('GraphQL query error:', error);
    throw error;
  }
};

module.exports = {
  executeStorefrontQuery,
};
