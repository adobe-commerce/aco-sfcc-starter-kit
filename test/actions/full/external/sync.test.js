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
  createSalesforceAdminHttpClient: jest.fn(),
  getSiteCatalogId: jest.fn(),
  syncAllMetadata: jest.fn(),
  syncAllPriceBooks: jest.fn(),
  syncAllCategories: jest.fn(),
  syncAllProducts: jest.fn(),
}));

const { Core } = require('@adobe/aio-sdk');
const stateLib = require('@adobe/aio-lib-state');
const {
  configureAcoClient,
  configureSalesforceApiOptions,
  createSalesforceAdminHttpClient,
  getSiteCatalogId,
  syncAllMetadata,
  syncAllPriceBooks,
  syncAllCategories,
  syncAllProducts,
} = require('../../../../api');
const action = require('../../../../actions/full/external/sync/index.js');

const mockLoggerInstance = { info: jest.fn(), debug: jest.fn(), error: jest.fn() };
Core.Logger.mockReturnValue(mockLoggerInstance);

const mockState = {
  put: jest.fn(),
  get: jest.fn(),
};
stateLib.init.mockResolvedValue(mockState);

beforeEach(() => {
  Core.Logger.mockClear();
  mockLoggerInstance.info.mockReset();
  mockLoggerInstance.debug.mockReset();
  mockLoggerInstance.error.mockReset();
  stateLib.init.mockClear();
  mockState.put.mockReset();
  mockState.get.mockReset();
  configureAcoClient.mockReset();
  configureSalesforceApiOptions.mockReset();
  createSalesforceAdminHttpClient.mockReset();
  getSiteCatalogId.mockReset();
  syncAllMetadata.mockReset();
  syncAllPriceBooks.mockReset();
  syncAllCategories.mockReset();
  syncAllProducts.mockReset();
});

const fakeParams = {
  LOG_LEVEL: 'info',
  SFCC_SITE_ID: 'test-site',
  SFCC_ORGANIZATION_ID: 'test-org',
  SFCC_LOCALES_TO_SYNC: 'en_US,fr_FR',
};

describe('full-external-sync', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function);
  });

  test('should set logger to use LOG_LEVEL param', async () => {
    mockState.get.mockResolvedValue({ value: 'false' });
    configureSalesforceApiOptions.mockReturnValue({ sf: 'config' });
    configureAcoClient.mockReturnValue({ aco: 'config' });
    createSalesforceAdminHttpClient.mockResolvedValue({ sf: 'client' });
    getSiteCatalogId.mockResolvedValue('catalog-123');
    syncAllMetadata.mockResolvedValue();
    syncAllPriceBooks.mockResolvedValue();
    syncAllCategories.mockResolvedValue();
    syncAllProducts.mockResolvedValue();

    await action.main({
      ...fakeParams,
      LOG_LEVEL: 'debug',
    });

    expect(Core.Logger).toHaveBeenCalledWith('sync-full-site', { level: 'debug' });
  });

  test('should skip sync when full sync is already in progress', async () => {
    mockState.get.mockResolvedValue({ value: 'true' });

    const response = await action.main(fakeParams);

    expect(response).toEqual({
      statusCode: 200,
      body: {
        success: true,
        message: 'Full sync is in progress, skipping this one',
        data: undefined,
      },
    });
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('Full sync is in progress, skipping this one');
  });

  test('should successfully perform full sync', async () => {
    mockState.get.mockResolvedValue({ value: 'false' });
    configureSalesforceApiOptions.mockReturnValue({ sf: 'options' });
    configureAcoClient.mockReturnValue({ aco: 'options' });
    createSalesforceAdminHttpClient.mockResolvedValue({ sf: 'client' });
    getSiteCatalogId.mockResolvedValue('catalog-456');
    syncAllMetadata.mockResolvedValue();
    syncAllPriceBooks.mockResolvedValue();
    syncAllCategories.mockResolvedValue();
    syncAllProducts.mockResolvedValue();

    const response = await action.main(fakeParams);

    expect(configureSalesforceApiOptions).toHaveBeenCalledWith(fakeParams);
    expect(configureAcoClient).toHaveBeenCalledWith(fakeParams);
    expect(createSalesforceAdminHttpClient).toHaveBeenCalledWith({ sf: 'options' });
    expect(getSiteCatalogId).toHaveBeenCalledWith({ sf: 'client' }, 'test-org', 'test-site', expect.anything());

    expect(syncAllMetadata).toHaveBeenCalledWith({ aco: 'options' }, ['en_US', 'fr_FR'], mockLoggerInstance);
    expect(syncAllPriceBooks).toHaveBeenCalledWith(
      { sf: 'options' },
      { aco: 'options' },
      'test-org',
      'test-site',
      mockLoggerInstance,
    );
    expect(syncAllCategories).toHaveBeenCalledWith(
      { sf: 'options' },
      { aco: 'options' },
      'test-org',
      'test-site',
      ['en_US', 'fr_FR'],
      mockLoggerInstance,
    );

    // Should sync products for each locale
    expect(syncAllProducts).toHaveBeenCalledTimes(2);
    expect(syncAllProducts).toHaveBeenCalledWith(
      { sf: 'options' },
      { aco: 'options' },
      'test-org',
      'test-site',
      'catalog-456',
      'en_US',
      mockLoggerInstance,
    );
    expect(syncAllProducts).toHaveBeenCalledWith(
      { sf: 'options' },
      { aco: 'options' },
      'test-org',
      'test-site',
      'catalog-456',
      'fr_FR',
      mockLoggerInstance,
    );

    expect(mockState.put).toHaveBeenCalledWith('fullSyncInProgress', 'true', { ttl: 31536000 });
    expect(mockState.put).toHaveBeenCalledWith('lastFullSyncRun', expect.any(String), { ttl: 31536000 });
    expect(mockState.put).toHaveBeenCalledWith('fullSyncInProgress', 'false', { ttl: 31536000 });

    expect(response).toEqual({
      statusCode: 200,
      body: {
        success: true,
        message: 'Full site sync completed successfully',
        data: undefined,
      },
    });
  });

  test('should handle catalog id retrieval failure', async () => {
    mockState.get.mockResolvedValue({ value: 'false' });
    configureSalesforceApiOptions.mockReturnValue({ sf: 'options' });
    configureAcoClient.mockReturnValue({ aco: 'options' });
    createSalesforceAdminHttpClient.mockResolvedValue({ sf: 'client' });

    const { StarterKitActionError } = require('../../../../actions/responses');
    const catalogError = new StarterKitActionError('Failed to retrieve catalog id from Salesforce', 404, 'Not Found');
    getSiteCatalogId.mockRejectedValue(catalogError);

    const response = await action.main(fakeParams);

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Failed to retrieve catalog id from Salesforce');
    expect(mockState.put).toHaveBeenCalledWith('fullSyncInProgress', 'false', { ttl: 31536000 });
  });

  test('should return 500 when sync fails with generic error', async () => {
    mockState.get.mockResolvedValue({ value: 'false' });
    configureSalesforceApiOptions.mockReturnValue({ sf: 'options' });
    configureAcoClient.mockReturnValue({ aco: 'options' });
    createSalesforceAdminHttpClient.mockResolvedValue({ sf: 'client' });
    getSiteCatalogId.mockResolvedValue('catalog-789');
    syncAllMetadata.mockResolvedValue();
    syncAllPriceBooks.mockResolvedValue();
    syncAllCategories.mockRejectedValue(new Error('Category sync failed'));

    const response = await action.main(fakeParams);

    expect(response).toEqual({
      statusCode: 500,
      body: {
        success: false,
        error: 'Category sync failed',
      },
    });
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Error executing full site sync: Error: Category sync failed',
    );
    expect(mockState.put).toHaveBeenCalledWith('fullSyncInProgress', 'false', { ttl: 31536000 });
  });

  test('should handle StarterKitActionError with custom status', async () => {
    mockState.get.mockResolvedValue({ value: 'false' });
    configureSalesforceApiOptions.mockReturnValue({ sf: 'options' });
    configureAcoClient.mockReturnValue({ aco: 'options' });
    createSalesforceAdminHttpClient.mockResolvedValue({ sf: 'client' });
    getSiteCatalogId.mockResolvedValue('catalog-999');
    syncAllMetadata.mockResolvedValue();
    syncAllPriceBooks.mockResolvedValue();

    const { StarterKitActionError } = require('../../../../actions/responses');
    const customError = new StarterKitActionError('Category validation failed', 422, 'Unprocessable Entity');
    syncAllCategories.mockRejectedValue(customError);

    const response = await action.main(fakeParams);

    expect(response).toEqual({
      statusCode: 422,
      body: {
        success: false,
        error: 'Category validation failed',
      },
    });
    expect(mockState.put).toHaveBeenCalledWith('fullSyncInProgress', 'false', { ttl: 31536000 });
  });
});
