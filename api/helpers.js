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

// eslint-disable-next-line no-unused-vars
const { Core } = require('@adobe/aio-sdk');
const { StarterKitActionError } = require('../actions/responses');
const { getSalesforceSiteCatalogId } = require('./salesforce');

/**
 * Retrieves the catalog ID for a given site from Salesforce.
 *
 * @param {import('ky').KyInstance} salesforceClient - The Salesforce HTTP API client.
 * @param {string} salesforceOrgId - The Salesforce organization ID.
 * @param {string} siteId - The Salesforce site ID.
 * @param {ReturnType<typeof Core.Logger>} logger - The logger instance.
 * @returns {Promise<string>} The catalog ID.
 */
const getSiteCatalogId = async (salesforceClient, salesforceOrgId, siteId, logger) => {
  logger.debug(`Retrieving catalog id for site ${siteId} from Salesforce`);
  const res = await getSalesforceSiteCatalogId(salesforceClient, salesforceOrgId, siteId);
  if (!res.ok) {
    if (res.status === 404) {
      logger.error(`No catalog id is assigned to SFCC siteId: ${siteId}`);
    } else {
      logger.error(`Failed to retrieve catalog id from Salesforce: ${res.status} ${res.statusText}`);
    }
    throw new StarterKitActionError('Failed to retrieve catalog id from Salesforce', res.status, res.statusText);
  }
  /** @type {SalesforceSiteCatalogResponse} */
  const data = await res.json();
  const catalogId = data.id;
  logger.debug(`Using catalog id ${catalogId} for site ${siteId}`);
  return catalogId;
};

module.exports = {
  getSiteCatalogId,
};
