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

const { HTTP_OK } = require('./constants');
const { defineActionErrorResponse, defineActionSuccessResponse } = require('./telemetry');

/** Custom error class for Starter Kit action errors with status and statusText */
class StarterKitActionError extends Error {
  constructor(message, status, statusText) {
    super(message);
    this.name = 'StarterKitActionError';
    this.status = status;
    this.statusText = statusText;
  }
}

/**
 * Returns a success response object, this method should be called on the handlers actions
 *
 * @param {string} message A descriptive message of the result
 * @param {object} [data] The (optional) data to be returned
 * @returns {SuccessActionResponse} The response object, ready to be returned from the action main's function.
 */
function actionSuccessResponse(message, data) {
  return {
    statusCode: HTTP_OK,
    body: {
      success: true,
      message,
      data,
    },
  };
}

/**
 * Returns an error response object, this method should be called on the handlers actions
 *
 * @param {number} statusCode The status code.
 * @param {string} error A descriptive message of the result
 * @returns {FailureActionResponse} The response object, ready to be returned from the action main's function.
 */
function actionErrorResponse(statusCode, error) {
  return {
    statusCode,
    body: {
      success: false,
      error,
    },
  };
}

/**
 * Returns an error response object, this method should be called on the consumers and public webhooks
 *
 * @param {number} statusCode The error status code. e.g. 400
 * @param {string} message The error message. e.g. 'missing xyz parameter'
 * @returns {object} The error object, ready to be returned from the action main's function.
 */
function errorResponse(statusCode, message) {
  return {
    error: {
      statusCode,
      body: {
        error: message,
      },
    },
  };
}

/**
 * Returns a success response object, this method should be called on the consumers
 *
 * @param {string} type The event type received by consumer e.g.
 *   'adobe.commerce.observer.catalog_product_save_commit_after'
 * @param {object} response The response object returned from the event handler e.g. '{ success: true, message: 'Product
 *   created successfully'}'
 * @returns {object} The response object, ready to be returned from the action main's function.
 */
function successResponse(type, response) {
  return {
    statusCode: HTTP_OK,
    body: {
      type,
      response,
    },
  };
}

/**
 * Returns response error adapted to ingestion webhooks module
 *
 * @param {string} message The error message. e.g. 'missing xyz parameter'
 * @returns {object} The response object, ready to be returned from the action main's function.
 */
function webhookErrorResponse(message) {
  return {
    statusCode: HTTP_OK,
    body: {
      op: 'exception',
      message,
    },
  };
}

/**
 * Returns a success response object, this method should be called on the sync webhooks
 *
 * @returns {object} The response object, ready to be returned from the action main's function.
 */
function webhookSuccessResponse() {
  return {
    statusCode: HTTP_OK,
    body: {
      op: 'success',
    },
  };
}

/**
 * Creates an action step response based on the result of a GraphQL client query.
 *
 * @template {any} TData - The type of the data returned by the GraphQL client.
 * @param {GraphqlResult<TData>} graphqlClientResult - The result of the GraphQL client.
 * @returns {ActionStepResult<TData>} The action response.
 */
function graphqlQueryResult(graphqlClientResult) {
  if (graphqlClientResult.data) {
    return {
      success: true,
      data: graphqlClientResult.data,
    };
  }

  return {
    success: false,
    statusCode: graphqlClientResult.error?.response.statusCode ?? 500,
    error: graphqlClientResult.error?.message ?? 'An error occurred while fetching the data',
  };
}

/**
 * Creates an action step response based on the result of a HTTP call.
 *
 * @template TData - The type of the data returned by the HTTP call.
 * @param {HttpCallResponse<TData>} response - The response of the HTTP call.
 * @returns {ActionStepResult<TData>} The action response.
 */
function httpCallResponse(response) {
  if (response.success) {
    return {
      success: true,
      data: response.data,
    };
  }

  return {
    success: false,
    statusCode: response.statusCode,
    error: response.error.message,
  };
}

module.exports = {
  successResponse,
  errorResponse,
  actionErrorResponse: defineActionErrorResponse(actionErrorResponse),
  actionSuccessResponse: defineActionSuccessResponse(actionSuccessResponse),
  webhookErrorResponse,
  webhookSuccessResponse,
  graphqlQueryResult,
  httpCallResponse,
  StarterKitActionError,
};
