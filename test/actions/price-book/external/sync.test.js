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

jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn(),
  },
}));

jest.mock('@adobe/aio-lib-state', () => ({
  init: jest.fn(),
}));

jest.mock('../../../../actions/telemetry', () => ({
  defineMain: jest.fn(fn => fn),
  defineActionErrorResponse: jest.fn(fn => fn),
  defineActionSuccessResponse: jest.fn(fn => fn),
}));

jest.mock('../../../../api', () => ({
  configureAcoClient: jest.fn(),
  configureSalesforceApiOptions: jest.fn(),
  syncAllPriceBooks: jest.fn(),
}));

const { Core } = require('@adobe/aio-sdk');
const stateLib = require('@adobe/aio-lib-state');
const { configureAcoClient, configureSalesforceApiOptions, syncAllPriceBooks } = require('../../../../api');
const action = require('../../../../actions/price-book/external/sync/index.js');

const mockLoggerInstance = { info: jest.fn(), debug: jest.fn(), error: jest.fn() };
Core.Logger.mockReturnValue(mockLoggerInstance);

const mockState = {
  put: jest.fn(),
};
stateLib.init.mockResolvedValue(mockState);

beforeEach(() => {
  Core.Logger.mockClear();
  mockLoggerInstance.info.mockReset();
  mockLoggerInstance.debug.mockReset();
  mockLoggerInstance.error.mockReset();
  stateLib.init.mockClear();
  mockState.put.mockReset();
  configureAcoClient.mockReset();
  configureSalesforceApiOptions.mockReset();
  syncAllPriceBooks.mockReset();
});

const fakeParams = {
  LOG_LEVEL: 'info',
  SFCC_SITE_ID: 'test-site',
  SFCC_ORGANIZATION_ID: 'test-org',
};

describe('price-book-external-sync', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function);
  });

  test('should set logger to use LOG_LEVEL param', async () => {
    configureSalesforceApiOptions.mockReturnValue({ some: 'sf-config' });
    configureAcoClient.mockReturnValue({ aco: 'config' });
    syncAllPriceBooks.mockResolvedValue();

    await action.main({
      ...fakeParams,
      LOG_LEVEL: 'debug',
    });

    expect(Core.Logger).toHaveBeenCalledWith('sync-price-books', { level: 'debug' });
  });

  test('should successfully sync price books and return success response', async () => {
    configureSalesforceApiOptions.mockReturnValue({ sf: 'options' });
    configureAcoClient.mockReturnValue({ aco: 'options' });
    syncAllPriceBooks.mockResolvedValue();

    const response = await action.main(fakeParams);

    expect(configureSalesforceApiOptions).toHaveBeenCalledWith(fakeParams);
    expect(configureAcoClient).toHaveBeenCalledWith(fakeParams);
    expect(syncAllPriceBooks).toHaveBeenCalledWith(
      { sf: 'options' },
      { aco: 'options' },
      'test-org',
      'test-site',
      mockLoggerInstance,
    );

    expect(mockState.put).toHaveBeenCalledWith('lastPriceBookSyncRun', expect.any(String), { ttl: 31536000 });

    expect(response).toEqual({
      statusCode: 200,
      body: {
        success: true,
        message: 'Price book sync completed successfully',
        data: undefined,
      },
    });
  });

  test('should return 500 when sync fails with generic error', async () => {
    configureSalesforceApiOptions.mockReturnValue({ sf: 'options' });
    configureAcoClient.mockReturnValue({ aco: 'options' });
    syncAllPriceBooks.mockRejectedValue(new Error('API connection failed'));

    const response = await action.main(fakeParams);

    expect(response).toEqual({
      statusCode: 500,
      body: {
        success: false,
        error: 'API connection failed',
      },
    });
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Error syncing price books to ACO: Error: API connection failed',
    );
  });

  test('should handle StarterKitActionError with custom status', async () => {
    configureSalesforceApiOptions.mockReturnValue({ sf: 'options' });
    configureAcoClient.mockReturnValue({ aco: 'options' });

    // Import the actual StarterKitActionError class
    const { StarterKitActionError } = require('../../../../actions/responses');
    const customError = new StarterKitActionError('Price book validation failed', 422, 'Unprocessable Entity');
    syncAllPriceBooks.mockRejectedValue(customError);

    const response = await action.main(fakeParams);

    expect(response).toEqual({
      statusCode: 422,
      body: {
        success: false,
        error: 'Price book validation failed',
      },
    });
  });

  test('should initialize state lib and log debug messages', async () => {
    configureSalesforceApiOptions.mockReturnValue({ sf: 'options' });
    configureAcoClient.mockReturnValue({ aco: 'options' });
    syncAllPriceBooks.mockResolvedValue();

    await action.main(fakeParams);

    expect(stateLib.init).toHaveBeenCalled();
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('Starting price book sync for siteId: test-site');
    expect(mockLoggerInstance.debug).toHaveBeenCalledWith('Initializing AIO state lib');
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('Syncing all price books for siteId: test-site');
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('Price book sync completed successfully');
  });
});
