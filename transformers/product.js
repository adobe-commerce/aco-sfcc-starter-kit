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

const {
  FeedProductStatusEnum,
  FeedProductVisibleInEnum,
  ProductImageRolesEnum,
} = require('@adobe-commerce/aco-ts-sdk');

/**
 * Maps Salesforce image view type to ACO image role
 *
 * @param {string} viewType - Salesforce image view type
 * @returns {ProductImageRolesEnum} ACO image role
 */
const mapImageRole = viewType => {
  switch (viewType.toLowerCase()) {
    case 'large':
    case 'medium':
      return ProductImageRolesEnum.Base;
    case 'small':
      return ProductImageRolesEnum.Small;
    case 'thumbnail':
      return ProductImageRolesEnum.Thumbnail;
    case 'swatch':
      return ProductImageRolesEnum.Swatch;
    default:
      return ProductImageRolesEnum.Base;
  }
};

/**
 * Transforms product images to ACO image format
 *
 * @param {SalesforceProductImage[]} images - The Salesforce product images
 * @returns {Array} Array of ACO image objects
 */
const transformImages = images => {
  const acoImages = [];
  images.forEach(image => {
    acoImages.push({
      url: image.absUrl,
      label: image.title,
      roles: [mapImageRole(image.viewType)],
    });
  });
  return acoImages;
};

/**
 * Transforms custom attributes to ACO attribute format
 *
 * @param {SalesforceProductCustomAttributes[]} attributes - The Salesforce product custom attributes
 * @returns {Array} Array of ACO attribute objects
 */
const transformCustomAttributes = attributes => {
  const acoAttributes = [];
  attributes.forEach(attribute => {
    acoAttributes.push({
      code: attribute.id,
      values: attribute.values,
    });
  });
  return acoAttributes;
};

/**
 * Transforms a Salesforce product to an ACO product.
 *
 * @param {SalesforceProduct} product - The Salesforce product.
 * @returns {import('@adobe-commerce/aco-ts-sdk').FeedProduct} The ACO product.
 */
const transformProduct = product => {
  const acoProduct = {
    sku: product.id,
    source: {
      locale: product.locale,
    },
    name: product.name,
    slug: product.name.toLowerCase().replace(/\s+/g, '-'),
    description: product.longDescription,
    shortDescription: product.shortDescription,
    status: product.online ? FeedProductStatusEnum.Enabled : FeedProductStatusEnum.Disabled,
    visibleIn: [FeedProductVisibleInEnum.Catalog, ...(product.searchable ? [FeedProductVisibleInEnum.Search] : [])],
    metaTags: {
      title: product.pageTitle,
      description: product.pageDescription,
      keywords: product.pageKeywords ? product.pageKeywords.split(',').map(keyword => keyword.trim()) : [],
    },
    attributes: [
      {
        code: 'brand',
        values: [product.brand],
      },
      {
        code: 'manufacturerName',
        values: [product.manufacturerName],
      },
      {
        code: 'manufacturerSku',
        values: [product.manufacturerSku],
      },
      {
        code: 'inStock',
        values: [product.inStock.toString()],
      },
      ...transformCustomAttributes(product.customAttributes),
    ],
    images: transformImages(product.images),
    // TODO: Add links
    // TODO: Add configurable product support
    // TODO: Add bundle product support
  };

  // @ts-ignore
  return acoProduct;
};

module.exports = {
  transformProduct,
};
