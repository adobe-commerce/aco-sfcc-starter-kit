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

const { executeStorefrontQuery } = require('../../../../api/storefront');
const { GET_PRODUCT_DETAILS } = require('../../../../api/queries/storefront');
const { actionErrorResponse, actionSuccessResponse } = require('../../../responses');
const { defineMain } = require('../../../telemetry');
const { validateData } = require('./validator');

/**
 * This web action allow external back-office application publish event to IO event using custom authentication
 * mechanism.
 *
 * @param {SpaStorefrontActions.Env} params - Method params includes environment and request data
 * @returns {Promise<ActionResponse>} The response of the action.
 */
const main = async params => {
  const validation = await validateData(params);

  if (!validation.success) {
    return actionErrorResponse(validation.statusCode, validation.error);
  }

  const { sku, locale, pricebookId } = params.data;
  const { queryResult, ...meta } = await executeStorefrontQuery({
    env: params,
    requestOptions: {
      headers: {
        'AC-Source-Locale': locale,
        'AC-Price-Book-Id': pricebookId,
      },
    },

    query: GET_PRODUCT_DETAILS,
    variables: { sku },
  });

  if (queryResult.data) {
    return actionSuccessResponse('Product details fetched successfully', {
      // We only fetch one product, so we can directly return the first in the array
      details: queryResult.data.products[0],
      meta,
    });
  }

  return actionErrorResponse(
    queryResult.error?.response.statusCode ?? 500,
    queryResult.error?.message ?? 'An error occurred while fetching the product details',
  );
};

module.exports = {
  main: defineMain(main),
};
