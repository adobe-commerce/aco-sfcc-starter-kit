/** The options used to configure the creation of a SFCC SCAPI client. */
declare interface SalesforceApiOptions {
  authUrl: string;
  apiBaseUrl: string;
  clientId: string;
  clientSecret: string;
  realmId: string;
  instanceId: string;
}

/** The response received when retrieving an OAuth Access Token from the SFCC API. */
declare interface SalesforceOAuthTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
}

declare interface SalesforceSiteCatalogResponse {
  id: string;
  displayName: string;
  description: string;
  creationDate: string;
  lastModified: string;
}

declare interface SalesforceProductsResponse {
  count: number;
  data: SalesforceProduct[];
}

declare interface SalesforceProduct {
  id: string;
  locale: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  pageTitle: string;
  pageDescription: string;
  pageKeywords: string;
  brand: string;
  manufacturerSku: string;
  manufacturerName: string;
  online: boolean;
  onlineFlag: boolean;
  searchable: boolean;
  searchableFlag: boolean;
  inStock: boolean;
  categories: SalesforceCategory[];
  prices: SalesforceProductPrice[];
  images: SalesforceProductImage[];
  customAttributes: SalesforceProductCustomAttributes[];
  type:
    | 'SIMPLE'
    | 'MASTER'
    | 'VARIANT'
    | 'VARIATION_GROUP'
    | 'BUNDLE'
    | 'BUNDLED'
    | 'PRODUCT_SET'
    | 'PRODUCT_SET_PRODUCT';
  variationAttributes: SalesforceProductVariationAttribute[];
  variants?: SalesforceProductVariant[];
  variationValues?: SalesforceProductVariationValues;
  master?: SalesforceProductMaster;
  bundles?: string[]; // Array of bundled product IDs for BUNDLE type
  bundledProducts?: BundledProduct[]; // Array of bundled products with details for a parent bundle product
  creationDate: string;
  lastModified: string;
}

declare interface SalesforceProductPrice {
  priceBookId: string;
  price: number;
}

declare interface SalesforceProductImage {
  viewType: 'thumbnail' | 'small' | 'medium' | 'large';
  title: string;
  alt: string;
  url: string;
  absUrl: string;
}

declare interface SalesforceProductCustomAttributes {
  id: string;
  values: string[];
}

declare interface SalesforcePriceBookResponse {
  total: number;
  limit: number;
  offset: number;
  data: SalesforcePriceBook[];
}

declare interface SalesforcePriceBook {
  id: string;
  displayName: string;
  description: string;
  currencyCode: string;
  online: boolean;
  onlineFlag: boolean;
  onlineFrom: string;
  onlineTo: string;
  parentPriceBook: SalesforceParentPriceBook;
  creationDate: string;
  lastModified: string;
}

declare interface SalesforceParentPriceBook {
  id: string;
  displayName: string;
}

declare interface SalesforceProductSearchResponse {
  limit: number;
  offset: number;
  total: number;
  hits: SalesforceProductSearch[];
}

declare interface SalesforceProductSearch {
  id: string;
}

declare interface SalesforceTrackedChangesResponse {
  total: number;
  limit: number;
  offset: number;
  pageSize: number;
  data: SalesforceTrackedChanges[];
}

declare interface SalesforceTrackedChanges {
  id: string;
  siteId: string;
  entityId: string;
  priceBookId: string;
  type: 'product' | 'priceBook' | 'price';
  isDeleted: boolean;
  lastModified: string;
}

declare interface SalesforceProductVariationAttribute {
  id: string;
  attributeId: string;
  name: string;
  values: SalesforceProductVariationAttributeValue[];
}

declare interface SalesforceProductVariationAttributeValue {
  description: string;
  name: string;
  value: string;
}

declare interface SalesforceProductVariant {
  productId: string;
  variationValues: SalesforceProductVariationValues;
}

declare interface SalesforceProductVariationValues {
  [key: string]: unknown;
}

declare interface SalesforceProductMaster {
  id: string;
}

declare interface BundledProduct {
  id: string;
  name: string;
  quantity: number;
}

declare interface SalesforceCategory {
  id: string;
  name: SalesforceLocalizedName;
  parentCategoryId: string;
  catalogId: string;
  paths: SalesforceCategoryPath[];
}

declare interface SalesforceLocalizedName {
  default: string;
  [locale: string]: string;
}

declare interface SalesforceCategoryPath {
  id: string;
  name: SalesforceLocalizedName;
}

declare interface SalesforceCategoryResponse {
  limit: number;
  offset: number;
  total: number;
  data: SalesforceCategory[];
}
