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

/**
 * Transforms Salesforce product prices to ACO price format.
 *
 * @param {SalesforceProduct[]} products - The Salesforce products with prices.
 * @returns {import('@adobe-commerce/aco-ts-sdk').FeedPrices[]} Array of ACO price objects.
 */
const transformPrices = products => {
  return products.flatMap(product =>
    product.prices.map(price => ({
      sku: product.id,
      priceBookId: price.priceBookId,
      regular: price.price,
      // TODO: Add discounts
    })),
  );
};

module.exports = {
  transformPrices,
};
