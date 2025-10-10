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
      values: attribute.values.map(v => v.toString()),
    });
  });
  return acoAttributes;
};

/**
 * Builds a variant reference ID.
 *
 * @param {string} masterSku - The master SKU
 * @param {string} variantCode - The variant code
 * @param {string | number} variantValue - The variant value
 * @returns {string} The variant reference ID
 */
function buildVariantReferenceId(masterSku, variantCode, variantValue) {
  return `${masterSku}-${variantCode}-${variantValue.toString()}`;
}

/**
 * Transforms variationAttributes and masterSku to configurations format
 *
 * @param {string} masterSku - The master SKU
 * @param {Array} variationAttributes - The variation attributes array
 * @returns {Array} Array of configuration objects
 */
function transformVariantAttributes(masterSku, variationAttributes) {
  if (!Array.isArray(variationAttributes)) return [];
  return variationAttributes.map(attr => ({
    attributeCode: attr.id,
    label: attr.name,
    type: 'CONFIGURABLE',
    values: Array.isArray(attr.values)
      ? attr.values.map(v => ({
          variantReferenceId: buildVariantReferenceId(masterSku, attr.id, v.value),
          label: v.name,
        }))
      : [],
  }));
}

/**
 * Transforms variationValues to ACO attribute format
 *
 * @param {string} masterSku - The master SKU
 * @param {object} variationValues - The variation values object
 * @returns {Array} Array of ACO attribute objects
 */
function transformVariantValues(masterSku, variationValues) {
  if (!variationValues || typeof variationValues !== 'object') return [];
  return Object.entries(variationValues).map(([key, value]) => ({
    code: key,
    values: [value.toString()],
    variantReferenceId: buildVariantReferenceId(masterSku, key, value),
  }));
}

/**
 * Builds the bundles array for an ACO parent bundle product.
 *
 * @param {{ id: string; name: string; quantity: number }[]} bundledProducts - Array of bundled product objects
 * @returns {object[]} Array of bundle group objects for ACO
 */
function buildAcoBundles(bundledProducts) {
  if (!Array.isArray(bundledProducts) || bundledProducts.length === 0) return [];
  return bundledProducts.map(bp => ({
    group: bp.name,
    required: true,
    multiSelect: false,
    defaultItemSkus: [bp.id],
    items: [
      {
        sku: bp.id,
        qty: bp.quantity,
        userDefinedQty: false,
      },
    ],
  }));
}

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
  };

  //add configurations
  if (product.type === 'MASTER') {
    acoProduct.configurations = transformVariantAttributes(product.id, product.variationAttributes);
  }

  if (product.type === 'VARIANT') {
    const masterSku = product.master.id;
    acoProduct.links = [
      {
        type: 'variant_of',
        sku: masterSku,
      },
    ];
    //attributes
    acoProduct.attributes.push(...transformVariantValues(masterSku, product.variationValues));
  }

  // Handle parent bundle product (type BUNDLE) using correct bundles array structure
  if (product.type === 'BUNDLE' && Array.isArray(product.bundledProducts) && product.bundledProducts.length > 0) {
    acoProduct.bundles = buildAcoBundles(product.bundledProducts);
  }

  // Handle bundled products (child) for BUNDLED type
  if (product.type === 'BUNDLED' && Array.isArray(product.bundles) && product.bundles.length > 0) {
    acoProduct.links = product.bundles.map(bundleSku => ({
      type: 'in_bundle',
      sku: bundleSku,
    }));
  }

  // @ts-ignore
  return acoProduct;
};

module.exports = {
  transformProduct,
};
