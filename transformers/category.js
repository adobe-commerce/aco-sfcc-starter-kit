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
 * Transforms Salesforce categories to ACO category format.
 *
 * @param {SalesforceCategory[]} categories - The Salesforce categories.
 * @param {string} locale - The locale to use for the category.
 * @returns {import('@adobe-commerce/aco-ts-sdk').FeedCategory[]} Array of ACO category objects.
 */
const transformCategories = (categories, locale) => {
  const acoCategories = [];
  categories.forEach(category => {
    // Skip the root category
    if (category.id === 'root') {
      return;
    }
    // Skip the first element in the paths array (catalog ID) and join the remaining path IDs with "/"
    const slug = category.paths
      .slice(1)
      .map(path => path.id.replace(/[^a-zA-Z0-9-]/g, ''))
      .join('/');

    const name = category.name?.[locale] || category.name?.default || category.id;

    acoCategories.push({
      slug,
      source: {
        locale,
      },
      name,
      families: [],
    });
  });
  return acoCategories;
};

module.exports = {
  transformCategories,
};
