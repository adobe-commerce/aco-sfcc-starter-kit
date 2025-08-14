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
  useTelemetry: jest.fn(fn => fn),
  defineActionErrorResponse: jest.fn(fn => fn),
  defineActionSuccessResponse: jest.fn(fn => fn),
}));

jest.mock('../../../../actions/product/external/sync/validator', () => ({
  validateData: jest.fn(),
}));

jest.mock('../../../../api', () => ({
  configureSalesforceApiOptions: jest.fn(),
  configureAcoClient: jest.fn(),
  createAcoClient: jest.fn(),
  createSalesforceAdminHttpClient: jest.fn(),
  syncProductsBatch: jest.fn(),
}));

const { Core } = require('@adobe/aio-sdk');
const stateLib = require('@adobe/aio-lib-state');
const { validateData } = require('../../../../actions/product/external/sync/validator');
const {
  configureSalesforceApiOptions,
  configureAcoClient,
  createAcoClient,
  createSalesforceAdminHttpClient,
  syncProductsBatch,
} = require('../../../../api');
const action = require('../../../../actions/product/external/sync/index.js');

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
  validateData.mockReset();
  configureSalesforceApiOptions.mockReset();
  configureAcoClient.mockReset();
  createAcoClient.mockReset();
  createSalesforceAdminHttpClient.mockReset();
  syncProductsBatch.mockReset();
});

const fakeParams = {
  LOG_LEVEL: 'info',
  SFCC_SITE_ID: 'test-site',
  SFCC_LOCALES_TO_SYNC: 'en_US,fr_FR',
  SFCC_ORGANIZATION_ID: 'test-org',
  data: {
    skus: ['SKU001', 'SKU002'],
  },
};

describe('product-external-sync', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function);
  });

  test('should set logger to use LOG_LEVEL param', async () => {
    validateData.mockResolvedValue({ success: true });
    configureSalesforceApiOptions.mockReturnValue({ some: 'config' });
    configureAcoClient.mockReturnValue({ aco: 'config' });
    createSalesforceAdminHttpClient.mockResolvedValue({ sf: 'client' });
    createAcoClient.mockReturnValue({ aco: 'client' });
    syncProductsBatch.mockResolvedValue();

    await action.main({
      ...fakeParams,
      LOG_LEVEL: 'debug',
    });

    expect(Core.Logger).toHaveBeenCalledWith('sync-products', { level: 'debug' });
  });

  test('should successfully sync products and return success response', async () => {
    validateData.mockResolvedValue({ success: true });
    configureSalesforceApiOptions.mockReturnValue({ some: 'config' });
    configureAcoClient.mockReturnValue({ aco: 'config' });
    createSalesforceAdminHttpClient.mockResolvedValue({ sf: 'client' });
    createAcoClient.mockReturnValue({ aco: 'client' });
    syncProductsBatch.mockResolvedValue();

    const response = await action.main(fakeParams);

    expect(validateData).toHaveBeenCalledWith(fakeParams);
    expect(configureSalesforceApiOptions).toHaveBeenCalledWith(fakeParams);
    expect(configureAcoClient).toHaveBeenCalledWith(fakeParams);
    expect(createSalesforceAdminHttpClient).toHaveBeenCalledWith({ some: 'config' });
    expect(createAcoClient).toHaveBeenCalledWith({ aco: 'config' });

    // Should sync for each locale
    expect(syncProductsBatch).toHaveBeenCalledTimes(2);
    expect(syncProductsBatch).toHaveBeenCalledWith(
      { aco: 'client' },
      { sf: 'client' },
      'test-org',
      mockLoggerInstance,
      'test-site',
      'en_US',
      ['SKU001', 'SKU002'],
    );
    expect(syncProductsBatch).toHaveBeenCalledWith(
      { aco: 'client' },
      { sf: 'client' },
      'test-org',
      mockLoggerInstance,
      'test-site',
      'fr_FR',
      ['SKU001', 'SKU002'],
    );

    expect(mockState.put).toHaveBeenCalledWith('lastSpecificProductsSyncRun', expect.any(String), { ttl: 31536000 });

    expect(response).toEqual({
      statusCode: 200,
      body: {
        success: true,
        message: 'Specific product sync completed successfully',
        data: undefined,
      },
    });
  });

  test('should return 400 for validation failure', async () => {
    validateData.mockResolvedValue({
      success: false,
      statusCode: 400,
      error: 'Invalid SKU format',
    });

    const response = await action.main(fakeParams);

    expect(response).toEqual({
      statusCode: 400,
      body: {
        success: false,
        error: 'Invalid SKU format',
      },
    });
    expect(mockLoggerInstance.error).toHaveBeenCalledWith('Validation failed with error: Invalid SKU format');
  });

  test('should return 400 when too many products to sync', async () => {
    validateData.mockResolvedValue({ success: true });

    const tooManySkus = Array.from({ length: 26 }, (_, i) => `SKU${i.toString().padStart(3, '0')}`);
    const response = await action.main({
      ...fakeParams,
      data: { skus: tooManySkus },
    });

    expect(response).toEqual({
      statusCode: 400,
      body: {
        success: false,
        error: 'Maximum number of products to sync is 25',
      },
    });
  });

  test('should return 500 when sync fails with generic error', async () => {
    validateData.mockResolvedValue({ success: true });
    configureSalesforceApiOptions.mockReturnValue({ some: 'config' });
    configureAcoClient.mockReturnValue({ aco: 'config' });
    createSalesforceAdminHttpClient.mockResolvedValue({ sf: 'client' });
    createAcoClient.mockReturnValue({ aco: 'client' });
    syncProductsBatch.mockRejectedValue(new Error('Network error'));

    const response = await action.main(fakeParams);

    expect(response).toEqual({
      statusCode: 500,
      body: {
        success: false,
        error: 'Network error',
      },
    });
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Error syncing specific products to ACO: Error: Network error',
    );
  });

  test('should handle StarterKitActionError with custom status', async () => {
    validateData.mockResolvedValue({ success: true });
    configureSalesforceApiOptions.mockReturnValue({ some: 'config' });
    configureAcoClient.mockReturnValue({ aco: 'config' });
    createSalesforceAdminHttpClient.mockResolvedValue({ sf: 'client' });
    createAcoClient.mockReturnValue({ aco: 'client' });

    // Import the actual StarterKitActionError class
    const { StarterKitActionError } = require('../../../../actions/responses');
    const customError = new StarterKitActionError('Invalid product data', 422, 'Unprocessable Entity');
    syncProductsBatch.mockRejectedValue(customError);

    const response = await action.main(fakeParams);

    expect(response).toEqual({
      statusCode: 422,
      body: {
        success: false,
        error: 'Invalid product data',
      },
    });
  });

  test('should initialize state lib and log debug messages', async () => {
    validateData.mockResolvedValue({ success: true });
    configureSalesforceApiOptions.mockReturnValue({ some: 'config' });
    configureAcoClient.mockReturnValue({ aco: 'config' });
    createSalesforceAdminHttpClient.mockResolvedValue({ sf: 'client' });
    createAcoClient.mockReturnValue({ aco: 'client' });
    syncProductsBatch.mockResolvedValue();

    await action.main(fakeParams);

    expect(stateLib.init).toHaveBeenCalled();
    expect(mockLoggerInstance.info).toHaveBeenCalledWith(
      'Starting product sync for siteId: test-site and SKUs: SKU001, SKU002',
    );
    expect(mockLoggerInstance.debug).toHaveBeenCalledWith('Initializing AIO state lib');
    expect(mockLoggerInstance.debug).toHaveBeenCalledWith('Validating data: {"skus":["SKU001","SKU002"]}');
    expect(mockLoggerInstance.debug).toHaveBeenCalledWith('Specific product sync completed successfully');
  });
});
