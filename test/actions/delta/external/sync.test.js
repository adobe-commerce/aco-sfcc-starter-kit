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
  syncAllChanges: jest.fn(),
  configureSalesforceApiOptions: jest.fn(),
  configureAcoClient: jest.fn(),
}));

const { Core } = require('@adobe/aio-sdk');
const stateLib = require('@adobe/aio-lib-state');
const { syncAllChanges, configureSalesforceApiOptions, configureAcoClient } = require('../../../../api');
const action = require('../../../../actions/delta/external/sync/index.js');

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
  syncAllChanges.mockReset();
  configureSalesforceApiOptions.mockReset();
  configureAcoClient.mockReset();
});

const fakeParams = {
  LOG_LEVEL: 'info',
  SFCC_SITE_ID: 'test-site',
  SFCC_ORGANIZATION_ID: 'test-org',
  SFCC_LOCALES_TO_SYNC: 'en_US,fr_FR',
  data: {},
};

describe('delta-external-sync', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function);
  });

  test('should set logger to use LOG_LEVEL param', async () => {
    mockState.get.mockResolvedValue({ value: 'false' });
    configureSalesforceApiOptions.mockReturnValue({ sf: 'config' });
    configureAcoClient.mockReturnValue({ aco: 'config' });
    syncAllChanges.mockResolvedValue();

    await action.main({
      ...fakeParams,
      LOG_LEVEL: 'debug',
    });

    expect(Core.Logger).toHaveBeenCalledWith('sync-delta-site', { level: 'debug' });
  });

  test('should skip sync when full sync is in progress', async () => {
    mockState.get.mockResolvedValueOnce({ value: 'true' }); // full sync in progress

    const response = await action.main(fakeParams);

    expect(response).toEqual({
      statusCode: 200,
      body: {
        success: true,
        message: 'Full sync is in progress, skipping delta sync',
        data: undefined,
      },
    });
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('Full sync is in progress, skipping delta sync');
  });

  test('should skip sync when another delta sync is in progress', async () => {
    mockState.get
      .mockResolvedValueOnce({ value: 'false' }) // full sync not in progress
      .mockResolvedValueOnce({ value: 'true' }); // delta sync in progress

    const response = await action.main(fakeParams);

    expect(response).toEqual({
      statusCode: 200,
      body: {
        success: true,
        message: 'Another delta sync is in progress, skipping this one',
        data: undefined,
      },
    });
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('Another delta sync is in progress, skipping this one');
  });

  test('should successfully perform delta sync with default since date', async () => {
    mockState.get
      .mockResolvedValueOnce({ value: 'false' }) // full sync not in progress
      .mockResolvedValueOnce({ value: 'false' }) // delta sync not in progress
      .mockResolvedValueOnce(null); // no last sync timestamp

    configureSalesforceApiOptions.mockReturnValue({ sf: 'options' });
    configureAcoClient.mockReturnValue({ aco: 'options' });
    syncAllChanges.mockResolvedValue();

    const response = await action.main(fakeParams);

    expect(configureSalesforceApiOptions).toHaveBeenCalledWith(fakeParams);
    expect(configureAcoClient).toHaveBeenCalledWith(fakeParams);
    expect(syncAllChanges).toHaveBeenCalledWith(
      { sf: 'options' },
      { aco: 'options' },
      'test-org',
      'test-site',
      ['en_US', 'fr_FR'],
      expect.any(String), // since date
      mockLoggerInstance,
    );

    expect(mockState.put).toHaveBeenCalledWith('deltaSyncInProgress', 'true', { ttl: 31536000 });
    expect(mockState.put).toHaveBeenCalledWith('lastDeltaSyncRun', expect.any(String), { ttl: 31536000 });
    expect(mockState.put).toHaveBeenCalledWith('deltaSyncInProgress', 'false', { ttl: 31536000 });

    expect(response).toEqual({
      statusCode: 200,
      body: {
        success: true,
        message: 'Delta sync completed successfully',
        data: undefined,
      },
    });
  });

  test('should use last sync timestamp when available', async () => {
    const lastSyncTime = '2024-01-15T10:30:00Z';
    mockState.get
      .mockResolvedValueOnce({ value: 'false' }) // full sync not in progress
      .mockResolvedValueOnce({ value: 'false' }) // delta sync not in progress
      .mockResolvedValueOnce({ value: lastSyncTime }); // last sync timestamp

    configureSalesforceApiOptions.mockReturnValue({ sf: 'options' });
    configureAcoClient.mockReturnValue({ aco: 'options' });
    syncAllChanges.mockResolvedValue();

    await action.main(fakeParams);

    expect(syncAllChanges).toHaveBeenCalledWith(
      { sf: 'options' },
      { aco: 'options' },
      'test-org',
      'test-site',
      ['en_US', 'fr_FR'],
      lastSyncTime,
      mockLoggerInstance,
    );
    expect(mockLoggerInstance.info).toHaveBeenCalledWith(`Syncing delta changes since last sync: ${lastSyncTime}`);
  });

  test('should use override since date when provided', async () => {
    const overrideSince = '2024-01-01T00:00:00Z';
    mockState.get
      .mockResolvedValueOnce({ value: 'false' }) // full sync not in progress
      .mockResolvedValueOnce({ value: 'false' }); // delta sync not in progress

    configureSalesforceApiOptions.mockReturnValue({ sf: 'options' });
    configureAcoClient.mockReturnValue({ aco: 'options' });
    syncAllChanges.mockResolvedValue();

    await action.main({
      ...fakeParams,
      data: { overrideSince },
    });

    expect(syncAllChanges).toHaveBeenCalledWith(
      { sf: 'options' },
      { aco: 'options' },
      'test-org',
      'test-site',
      ['en_US', 'fr_FR'],
      overrideSince,
      mockLoggerInstance,
    );
    expect(mockLoggerInstance.info).toHaveBeenCalledWith(`Using override since date for delta sync: ${overrideSince}`);
  });

  test('should return 500 when sync fails with generic error', async () => {
    mockState.get
      .mockResolvedValueOnce({ value: 'false' }) // full sync not in progress
      .mockResolvedValueOnce({ value: 'false' }) // delta sync not in progress
      .mockResolvedValueOnce(null); // no last sync timestamp

    configureSalesforceApiOptions.mockReturnValue({ sf: 'options' });
    configureAcoClient.mockReturnValue({ aco: 'options' });
    syncAllChanges.mockRejectedValue(new Error('Delta sync failed'));

    const response = await action.main(fakeParams);

    expect(response).toEqual({
      statusCode: 500,
      body: {
        success: false,
        error: 'Delta sync failed',
      },
    });
    expect(mockLoggerInstance.error).toHaveBeenCalledWith('Error executing delta sync: Error: Delta sync failed');
    expect(mockState.put).toHaveBeenCalledWith('deltaSyncInProgress', 'false', { ttl: 31536000 });
  });

  test('should handle StarterKitActionError with custom status', async () => {
    mockState.get
      .mockResolvedValueOnce({ value: 'false' }) // full sync not in progress
      .mockResolvedValueOnce({ value: 'false' }) // delta sync not in progress
      .mockResolvedValueOnce(null); // no last sync timestamp

    configureSalesforceApiOptions.mockReturnValue({ sf: 'options' });
    configureAcoClient.mockReturnValue({ aco: 'options' });

    const { StarterKitActionError } = require('../../../../actions/responses');
    const customError = new StarterKitActionError('Delta sync validation failed', 422, 'Unprocessable Entity');
    syncAllChanges.mockRejectedValue(customError);

    const response = await action.main(fakeParams);

    expect(response).toEqual({
      statusCode: 422,
      body: {
        success: false,
        error: 'Delta sync validation failed',
      },
    });
    expect(mockState.put).toHaveBeenCalledWith('deltaSyncInProgress', 'false', { ttl: 31536000 });
  });
});
