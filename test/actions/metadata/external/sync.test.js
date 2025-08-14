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
  syncAllMetadata: jest.fn(),
}));

const { Core } = require('@adobe/aio-sdk');
const stateLib = require('@adobe/aio-lib-state');
const { configureAcoClient, syncAllMetadata } = require('../../../../api');
const action = require('../../../../actions/metadata/external/sync/index.js');

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
  syncAllMetadata.mockReset();
});

const fakeParams = {
  LOG_LEVEL: 'info',
  SFCC_LOCALES_TO_SYNC: 'en_US,fr_FR',
};

describe('metadata-external-sync', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function);
  });

  test('should set logger to use LOG_LEVEL param', async () => {
    configureAcoClient.mockReturnValue({ aco: 'config' });
    syncAllMetadata.mockResolvedValue();

    await action.main({
      ...fakeParams,
      LOG_LEVEL: 'debug',
    });

    expect(Core.Logger).toHaveBeenCalledWith('sync-metadata', { level: 'debug' });
  });

  test('should successfully sync metadata and return success response', async () => {
    configureAcoClient.mockReturnValue({ aco: 'options' });
    syncAllMetadata.mockResolvedValue();

    const response = await action.main(fakeParams);

    expect(configureAcoClient).toHaveBeenCalledWith(fakeParams);
    expect(syncAllMetadata).toHaveBeenCalledWith({ aco: 'options' }, ['en_US', 'fr_FR'], mockLoggerInstance);

    expect(mockState.put).toHaveBeenCalledWith('lastMetadataSyncRun', expect.any(String), { ttl: 31536000 });

    expect(response).toEqual({
      statusCode: 200,
      body: {
        success: true,
        message: 'Product metadata synced successfully',
        data: undefined,
      },
    });
  });

  test('should return 500 when sync fails with generic error', async () => {
    configureAcoClient.mockReturnValue({ aco: 'options' });
    syncAllMetadata.mockRejectedValue(new Error('Metadata sync failed'));

    const response = await action.main(fakeParams);

    expect(response).toEqual({
      statusCode: 500,
      body: {
        success: false,
        error: 'Metadata sync failed',
      },
    });
    expect(mockLoggerInstance.error).toHaveBeenCalledWith('Error syncing metadata to ACO: Error: Metadata sync failed');
  });

  test('should handle StarterKitActionError with custom status', async () => {
    configureAcoClient.mockReturnValue({ aco: 'options' });

    // Import the actual StarterKitActionError class
    const { StarterKitActionError } = require('../../../../actions/responses');
    const customError = new StarterKitActionError('Metadata validation failed', 422, 'Unprocessable Entity');
    syncAllMetadata.mockRejectedValue(customError);

    const response = await action.main(fakeParams);

    expect(response).toEqual({
      statusCode: 422,
      body: {
        success: false,
        error: 'Metadata validation failed',
      },
    });
  });

  test('should initialize state lib and log debug messages', async () => {
    configureAcoClient.mockReturnValue({ aco: 'options' });
    syncAllMetadata.mockResolvedValue();

    await action.main(fakeParams);

    expect(stateLib.init).toHaveBeenCalled();
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('Starting metadata sync for locales: en_US,fr_FR');
    expect(mockLoggerInstance.debug).toHaveBeenCalledWith('Initializing AIO state lib');
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('Metadata sync completed successfully');
  });
});
