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

const getScopes = (realmId, instanceId) =>
  `SALESFORCE_COMMERCE_API:${realmId}_${instanceId} sfcc.products sfcc.products.rw c_aco`;

/**
 * Configures the Salesforce API options from environment parameters.
 *
 * @param {GlobalEnv} params - The environment parameters.
 * @returns {SalesforceApiOptions} The Salesforce API options.
 */
const configureSalesforceApiOptions = params => {
  /** @type {SalesforceApiOptions} */
  return {
    authUrl: String(params.SFCC_AUTH_URL),
    apiBaseUrl: String(params.SFCC_API_BASE_URL),
    clientId: String(params.SFCC_CLIENT_ID),
    clientSecret: String(params.SFCC_CLIENT_SECRET),
    realmId: String(params.SFCC_REALM_ID),
    instanceId: String(params.SFCC_INSTANCE_ID),
  };
};

/**
 * Retrieves a Salesforce OAuth2 access token using the client credentials flow.
 *
 * @param {SalesforceApiOptions} options - Configuration options for the API client.
 * @returns {Promise<SalesforceOAuthTokenResponse>} The Salesforce OAuth2 token response.
 */
const getSalesforceAdminAccessToken = async ({ authUrl, realmId, instanceId, clientId, clientSecret }) => {
  const ky = (await import('ky')).default;
  return await ky
    .post(authUrl, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      searchParams: {
        grant_type: 'client_credentials',
        scope: getScopes(realmId, instanceId),
      },
    })
    .json();
};

/**
 * Constructs a simple HTTP client to call the Salesforce API.
 *
 * @param {SalesforceApiOptions} apiOptions - Configuration options for the API client.
 * @returns {Promise<import('ky').KyInstance>} The Salesforce HTTP client.
 */
const createSalesforceAdminHttpClient = async apiOptions => {
  const ky = (await import('ky')).default;

  /** @type {SalesforceOAuthTokenResponse} */
  const { access_token } = await getSalesforceAdminAccessToken(apiOptions);
  const salesforceKy = ky.extend({
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
    retry: {
      limit: 3,
      methods: ['get', 'post'],
    },
    hooks: {
      afterResponse: [
        // Retry with a fresh token on a 401 error
        async (request, options, response) => {
          if (response.status === 401) {
            const { access_token } = await getSalesforceAdminAccessToken(apiOptions);
            request.headers.set('Authorization', `Bearer ${access_token}`);
            return ky(request);
          }
          return response;
        },
      ],
    },
  });

  return salesforceKy.extend({
    prefixUrl: `${apiOptions.apiBaseUrl}`,
  });
};

/**
 * Checks if the Salesforce API is reachable by making a request to a SCAPI endpoint.
 *
 * @param {import('ky').KyInstance} client - The Salesforce HTTP client.
 * @param {string} organizationId - The Salesforce organization ID.
 * @param {string} siteId - The Salesforce site ID.
 * @returns {Promise<import('ky').KyResponse>} The response from the Salesforce API.
 */
const checkSalesforceConnectivity = async (client, organizationId, siteId) => {
  return await getSalesforcePriceBooks(client, organizationId, siteId, 1, 0);
};

/**
 * Get price books from Salesforce via our custom endpoint.
 *
 * @param {import('ky').KyInstance} client - The Salesforce HTTP client.
 * @param {string} organizationId - The Salesforce organization ID.
 * @param {string} siteId - The Salesforce site ID.
 * @param {number} limit - The response page size. Max 200.
 * @param {number} offset - The response page offset for pagination.
 * @returns {Promise<import('ky').KyResponse>} The response from the Salesforce API.
 */
const getSalesforcePriceBooks = async (client, organizationId, siteId, limit, offset) => {
  return await client.get(`custom/aco/v1/organizations/${organizationId}/pricebooks`, {
    searchParams: {
      siteId,
      c_limit: limit,
      c_offset: offset,
    },
  });
};

/**
 * Get price book by ID from Salesforce via our custom endpoint.
 *
 * @param {import('ky').KyInstance} client - The Salesforce HTTP client.
 * @param {string} organizationId - The Salesforce organization ID.
 * @param {string} siteId - The Salesforce site ID.
 * @param {string} priceBookId - The Salesforce price book ID.
 * @returns {Promise<import('ky').KyResponse>} The response from the Salesforce API.
 */
const getSalesforcePriceBookById = async (client, organizationId, siteId, priceBookId) => {
  return await client.get(`custom/aco/v1/organizations/${organizationId}/pricebooks/${priceBookId}`, {
    searchParams: {
      siteId,
    },
  });
};

/**
 * Get product by list of IDs from Salesforce via our custom endpoint.
 *
 * @param {import('ky').KyInstance} client - The Salesforce HTTP client.
 * @param {string} organizationId - The Salesforce organization ID.
 * @param {string} siteId - The Salesforce site ID.
 * @param {string} locale - The locale. Ex en-US
 * @param {string[]} skus - The Salesforce product IDs.
 * @returns {Promise<import('ky').KyResponse>} The response from the Salesforce API.
 */
const getSalesforceProductByIds = async (client, organizationId, siteId, locale, skus) => {
  return await client.post(`custom/aco/v1/organizations/${organizationId}/products`, {
    searchParams: {
      siteId,
      locale,
    },
    body: JSON.stringify({
      ids: skus,
    }),
  });
};

/**
 * Get ACO tracked changes from Salesforce via our custom endpoint.
 *
 * @param {import('ky').KyInstance} client - The Salesforce HTTP client.
 * @param {string} organizationId - The Salesforce organization ID.
 * @param {string} siteId - The Salesforce site ID.
 * @param {number} limit - The response page size. Max 1000.
 * @param {number} offset - The response page offset for pagination.
 * @param {string} since - The timestamp to pull changes from. ISO 8601 format.
 * @returns {Promise<import('ky').KyResponse>} The response from the Salesforce API.
 */
const getSalesforceTrackedChanges = async (client, organizationId, siteId, limit, offset, since) => {
  return await client.get(`custom/aco/v1/organizations/${organizationId}/changes`, {
    searchParams: {
      siteId,
      c_limit: limit,
      c_offset: offset,
      c_since: since,
    },
  });
};

/**
 * Searches for products in Salesforce.
 *
 * @param {import('ky').KyInstance} client - The Salesforce HTTP client.
 * @param {string} organizationId - The Salesforce organization ID.
 * @param {string} siteId - The Salesforce site ID.
 * @param {number} limit - The response page size. Max 200.
 * @param {number} offset - The response page offset for pagination.
 * @param {string} searchPhrase - The search phrase to look for in product names.
 * @param {string[]} expand - The expand parameter to pass to the Salesforce API.
 * @returns {Promise<import('ky').KyResponse>} The response from the Salesforce API.
 */
const searchSalesforceProducts = async (client, organizationId, siteId, limit, offset, searchPhrase, expand) => {
  return await client.post(`product/products/v1/organizations/${organizationId}/product-search`, {
    searchParams: { siteId },
    body: JSON.stringify({
      limit,
      query: {
        textQuery: {
          fields: ['name'],
          searchPhrase,
        },
      },
      expand,
      offset,
    }),
  });
};

module.exports = {
  configureSalesforceApiOptions,
  checkSalesforceConnectivity,
  createSalesforceAdminHttpClient,
  getSalesforcePriceBooks,
  getSalesforcePriceBookById,
  getSalesforceProductByIds,
  getSalesforceTrackedChanges,
  searchSalesforceProducts,
};
