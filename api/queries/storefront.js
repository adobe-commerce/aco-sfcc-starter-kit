const { gql } = require('@urql/core');

/** The fields we retrieve from a ProductViewPrice. */
const productViewPriceFieldsFragment = gql`
  fragment ProductViewPriceFields on ProductViewPrice {
    roles
    regular {
      amount {
        currency
        value
      }
    }
    final {
      amount {
        currency
        value
      }
    }
  }
`;

/** The fields we retrieve from a ProductViewPriceRange. */
const productViewPriceRangeFieldsFragment = gql`
  fragment ProductViewPriceRangeFields on ProductViewPriceRange {
    minimum {
      ...ProductViewPriceFields
    }
    maximum {
      ...ProductViewPriceFields
    }
  }
`;

/** The fields we retrieve from a ProductViewImage. */
const productViewImageFieldsFragment = gql`
  fragment ProductViewImageFields on ProductViewImage {
    url
    label
    roles
  }
`;

/** The fields we retrieve from a ProductViewAttribute. */
const productViewAttributeFieldsFragment = gql`
  fragment ProductViewAttributeFields on ProductViewAttribute {
    name
    label
    value
    roles
  }
`;

/** The fields we retrieve from a ProductViewOptionValue. */
const productViewOptionValueFieldsFragment = gql`
  fragment ProductViewOptionValueFields on ProductViewOptionValue {
    id
    title
    inStock
    ... on ProductViewOptionValueSwatch {
      type
      value
      title
    }
    ... on ProductViewOptionValueConfiguration {
      title
    }
    ... on ProductViewOptionValueProduct {
      product {
        sku
        name
      }
    }
  }
`;

/** The fields we retrieve from a ProductViewOption. */
const productViewOptionFieldsFragment = gql`
  fragment ProductViewOptionFields on ProductViewOption {
    id
    title
    multi
    required
    values {
      ...ProductViewOptionValueFields
    }
  }
`;

/** The base fields we retrieve from any Product. */
const productViewBaseFieldsFragment = gql`
  fragment ProductViewBaseFields on ProductView {
    __typename
    id
    externalId
    sku
    name
    description
    shortDescription
    url
    urlKey
    inStock
    metaTitle
    metaKeyword
    metaDescription
    addToCartAllowed
  }
`;

/** Query to get product details from a SKU. */
const GET_PRODUCT_DETAILS = gql`
  query GetProductDetailsFromSku($sku: String!) {
    products(skus: [$sku]) {
      ...ProductViewBaseFields
      images(roles: []) {
        ...ProductViewImageFields
      }
      attributes(roles: []) {
        ...ProductViewAttributeFields
      }
      ... on SimpleProductView {
        price {
          ...ProductViewPriceFields
        }
      }
      ... on ComplexProductView {
        options {
          ...ProductViewOptionFields
        }
        priceRange {
          ...ProductViewPriceRangeFields
        }
      }
    }
  }

  ${productViewBaseFieldsFragment}
  ${productViewImageFieldsFragment}
  ${productViewAttributeFieldsFragment}
  ${productViewPriceFieldsFragment}
  ${productViewPriceRangeFieldsFragment}
  ${productViewOptionFieldsFragment}
  ${productViewOptionValueFieldsFragment}
`;

module.exports = {
  GET_PRODUCT_DETAILS,
};
