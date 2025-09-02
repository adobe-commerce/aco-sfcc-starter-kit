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
  FeedMetadataVisibleInEnum,
  FeedMetadataDataTypeEnum,
  FeedMetadataSearchTypesEnum,
} = require('@adobe-commerce/aco-ts-sdk');

const getDefaultMetadata = locale => [
  {
    code: 'sku',
    source: {
      locale,
    },
    label: 'sku',
    dataType: FeedMetadataDataTypeEnum.Text,
    visibleIn: [
      FeedMetadataVisibleInEnum.ProductDetail,
      FeedMetadataVisibleInEnum.ProductListing,
      FeedMetadataVisibleInEnum.SearchResults,
      FeedMetadataVisibleInEnum.ProductCompare,
    ],
    filterable: false,
    sortable: false,
    searchable: true,
    searchWeight: 1,
    searchTypes: [
      FeedMetadataSearchTypesEnum.Autocomplete,
      FeedMetadataSearchTypesEnum.Contains,
      FeedMetadataSearchTypesEnum.StartsWith,
    ],
  },
  {
    code: 'name',
    source: {
      locale,
    },
    label: 'Name',
    dataType: FeedMetadataDataTypeEnum.Text,
    visibleIn: [
      FeedMetadataVisibleInEnum.ProductDetail,
      FeedMetadataVisibleInEnum.ProductListing,
      FeedMetadataVisibleInEnum.SearchResults,
      FeedMetadataVisibleInEnum.ProductCompare,
    ],
    filterable: false,
    sortable: true,
    searchable: true,
    searchWeight: 1,
    searchTypes: [
      FeedMetadataSearchTypesEnum.Autocomplete,
      FeedMetadataSearchTypesEnum.Contains,
      FeedMetadataSearchTypesEnum.StartsWith,
    ],
  },
  {
    code: 'shortDescription',
    source: {
      locale,
    },
    label: 'Short Description',
    dataType: FeedMetadataDataTypeEnum.Text,
    visibleIn: [FeedMetadataVisibleInEnum.ProductDetail],
    filterable: false,
    sortable: true,
    searchable: true,
    searchWeight: 1,
    searchTypes: [
      FeedMetadataSearchTypesEnum.Autocomplete,
      FeedMetadataSearchTypesEnum.Contains,
      FeedMetadataSearchTypesEnum.StartsWith,
    ],
  },
  {
    code: 'longDescription',
    source: {
      locale,
    },
    label: 'Long Description',
    dataType: FeedMetadataDataTypeEnum.Text,
    visibleIn: [FeedMetadataVisibleInEnum.ProductDetail],
    filterable: false,
    sortable: true,
    searchable: true,
    searchWeight: 1,
    searchTypes: [
      FeedMetadataSearchTypesEnum.Autocomplete,
      FeedMetadataSearchTypesEnum.Contains,
      FeedMetadataSearchTypesEnum.StartsWith,
    ],
  },
  {
    code: 'brand',
    source: {
      locale,
    },
    label: 'Brand',
    dataType: FeedMetadataDataTypeEnum.Text,
    visibleIn: [
      FeedMetadataVisibleInEnum.ProductDetail,
      FeedMetadataVisibleInEnum.ProductListing,
      FeedMetadataVisibleInEnum.SearchResults,
      FeedMetadataVisibleInEnum.ProductCompare,
    ],
    filterable: true,
    sortable: true,
    searchable: true,
    searchWeight: 2,
    searchTypes: [
      FeedMetadataSearchTypesEnum.Autocomplete,
      FeedMetadataSearchTypesEnum.Contains,
      FeedMetadataSearchTypesEnum.StartsWith,
    ],
  },
  {
    code: 'manufacturerName',
    source: {
      locale,
    },
    label: 'Manufacturer Name',
    dataType: FeedMetadataDataTypeEnum.Text,
    visibleIn: [
      FeedMetadataVisibleInEnum.ProductDetail,
      FeedMetadataVisibleInEnum.ProductListing,
      FeedMetadataVisibleInEnum.SearchResults,
      FeedMetadataVisibleInEnum.ProductCompare,
    ],
    filterable: true,
    sortable: true,
    searchable: true,
    searchWeight: 1,
    searchTypes: [
      FeedMetadataSearchTypesEnum.Autocomplete,
      FeedMetadataSearchTypesEnum.Contains,
      FeedMetadataSearchTypesEnum.StartsWith,
    ],
  },
  {
    code: 'manufacturerSku',
    source: {
      locale,
    },
    label: 'Manufacturer SKU',
    dataType: FeedMetadataDataTypeEnum.Text,
    visibleIn: [
      FeedMetadataVisibleInEnum.ProductDetail,
      FeedMetadataVisibleInEnum.ProductListing,
      FeedMetadataVisibleInEnum.SearchResults,
      FeedMetadataVisibleInEnum.ProductCompare,
    ],
    filterable: true,
    sortable: true,
    searchable: true,
    searchWeight: 1,
    searchTypes: [
      FeedMetadataSearchTypesEnum.Autocomplete,
      FeedMetadataSearchTypesEnum.Contains,
      FeedMetadataSearchTypesEnum.StartsWith,
    ],
  },
  {
    code: 'inStock',
    source: {
      locale,
    },
    label: 'In Stock',
    dataType: FeedMetadataDataTypeEnum.Boolean,
    visibleIn: [
      FeedMetadataVisibleInEnum.ProductDetail,
      FeedMetadataVisibleInEnum.ProductListing,
      FeedMetadataVisibleInEnum.SearchResults,
      FeedMetadataVisibleInEnum.ProductCompare,
    ],
    filterable: true,
    sortable: true,
    searchable: false,
    searchWeight: 1,
    searchTypes: [],
  },
  {
    code: 'part_category',
    source: {
      locale,
    },
    label: 'Part Category',
    dataType: FeedMetadataDataTypeEnum.Text,
    visibleIn: [
      FeedMetadataVisibleInEnum.ProductDetail,
      FeedMetadataVisibleInEnum.ProductListing,
      FeedMetadataVisibleInEnum.SearchResults,
      FeedMetadataVisibleInEnum.ProductCompare,
    ],
    filterable: true,
    sortable: true,
    searchable: true,
    searchWeight: 1,
    searchTypes: [
      FeedMetadataSearchTypesEnum.Autocomplete,
      FeedMetadataSearchTypesEnum.Contains,
      FeedMetadataSearchTypesEnum.StartsWith,
    ],
  },
  {
    code: 'model',
    source: {
      locale,
    },
    label: 'Model',
    dataType: FeedMetadataDataTypeEnum.Text,
    visibleIn: [
      FeedMetadataVisibleInEnum.ProductDetail,
      FeedMetadataVisibleInEnum.ProductListing,
      FeedMetadataVisibleInEnum.SearchResults,
      FeedMetadataVisibleInEnum.ProductCompare,
    ],
    filterable: true,
    sortable: true,
    searchable: true,
    searchWeight: 1,
    searchTypes: [
      FeedMetadataSearchTypesEnum.Autocomplete,
      FeedMetadataSearchTypesEnum.Contains,
      FeedMetadataSearchTypesEnum.StartsWith,
    ],
  },
  {
    code: 'model_year',
    source: {
      locale,
    },
    label: 'Model Year',
    dataType: FeedMetadataDataTypeEnum.Text,
    visibleIn: [
      FeedMetadataVisibleInEnum.ProductDetail,
      FeedMetadataVisibleInEnum.ProductListing,
      FeedMetadataVisibleInEnum.SearchResults,
      FeedMetadataVisibleInEnum.ProductCompare,
    ],
    filterable: true,
    sortable: true,
    searchable: true,
    searchWeight: 1,
    searchTypes: [
      FeedMetadataSearchTypesEnum.Autocomplete,
      FeedMetadataSearchTypesEnum.Contains,
      FeedMetadataSearchTypesEnum.StartsWith,
    ],
  },
  {
    code: 'country',
    source: {
      locale,
    },
    label: 'Country',
    dataType: FeedMetadataDataTypeEnum.Text,
    visibleIn: [
      FeedMetadataVisibleInEnum.ProductDetail,
      FeedMetadataVisibleInEnum.ProductListing,
      FeedMetadataVisibleInEnum.SearchResults,
      FeedMetadataVisibleInEnum.ProductCompare,
    ],
    filterable: true,
    sortable: true,
    searchable: true,
    searchWeight: 1,
    searchTypes: [
      FeedMetadataSearchTypesEnum.Autocomplete,
      FeedMetadataSearchTypesEnum.Contains,
      FeedMetadataSearchTypesEnum.StartsWith,
    ],
  },
];

module.exports = {
  getDefaultMetadata,
};
