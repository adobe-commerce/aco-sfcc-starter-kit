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
 * Transforms Salesforce price books to ACO price book format.
 *
 * @param {SalesforcePriceBook[]} priceBooks - The Salesforce price books.
 * @returns {import('@adobe-commerce/aco-ts-sdk').FeedPricebook[]} Array of ACO price book objects.
 */
const transformPriceBooks = priceBooks => {
  const acoPriceBooks = [];
  priceBooks.forEach(priceBook => {
    if (!priceBook.parentPriceBook) {
      acoPriceBooks.push({
        priceBookId: priceBook.id,
        name: priceBook.displayName,
        currency: priceBook.currencyCode,
      });
    } else {
      acoPriceBooks.push({
        priceBookId: priceBook.id,
        name: priceBook.displayName,
        parentId: priceBook.parentPriceBook.id,
      });
    }
  });
  return acoPriceBooks;
};

module.exports = {
  transformPriceBooks,
};
