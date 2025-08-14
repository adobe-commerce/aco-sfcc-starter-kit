jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn(),
  },
}));

jest.mock('../../../../actions/openwhisk');
jest.mock('../../../../actions/telemetry', () => ({
  instrumentConsumer: jest.fn(fn => fn),
  defineActionErrorResponse: jest.fn(fn => fn),
  defineActionSuccessResponse: jest.fn(fn => fn),
}));

const { Core } = require('@adobe/aio-sdk');
const mockLoggerInstance = { info: jest.fn(), debug: jest.fn(), error: jest.fn() };
Core.Logger.mockReturnValue(mockLoggerInstance);

const Openwhisk = require('../../../../actions/openwhisk');
const action = require('../../../../actions/delta/external/consumer/index.js');

beforeEach(() => {
  Core.Logger.mockClear();
  mockLoggerInstance.info.mockReset();
  mockLoggerInstance.debug.mockReset();
  mockLoggerInstance.error.mockReset();
  Openwhisk.mockClear();
});

const fakeParams = {
  API_HOST: 'fake-host',
  API_AUTH: 'fake-auth',
  LOG_LEVEL: 'info',
};

describe('delta-sync-external-consumer', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function);
  });

  test('should set logger to use LOG_LEVEL param', async () => {
    const mockOpenwhiskInstance = {
      invokeAction: jest.fn().mockResolvedValue('fake-activation-id'),
    };
    Openwhisk.mockReturnValue(mockOpenwhiskInstance);

    await action.main({
      ...fakeParams,
      LOG_LEVEL: 'debug',
      type: 'sfcc.delta.sync',
      data: { siteId: 'test-site' },
    });

    expect(Core.Logger).toHaveBeenCalledWith('delta-sync-external-consumer', { level: 'debug' });
  });

  test('should handle sfcc.delta.sync event type and invoke sync action', async () => {
    const mockOpenwhiskInstance = {
      invokeAction: jest.fn().mockResolvedValue('activation-delta-456'),
    };
    Openwhisk.mockReturnValue(mockOpenwhiskInstance);

    const testData = { siteId: 'test-site-delta', overrideSince: '2024-01-01T00:00:00Z' };
    const response = await action.main({
      ...fakeParams,
      type: 'sfcc.delta.sync',
      data: testData,
    });

    expect(mockOpenwhiskInstance.invokeAction).toHaveBeenCalledWith('delta-backoffice/sync', testData);
    expect(response).toEqual({
      statusCode: 200,
      body: {
        type: 'sfcc.delta.sync',
        response: { activationId: 'activation-delta-456' },
      },
    });
  });

  test('should return 400 for missing required parameters', async () => {
    const response = await action.main({
      ...fakeParams,
      // missing type and data
    });

    expect(response).toEqual({
      error: {
        statusCode: 400,
        body: { error: "Invalid request parameters: missing parameter(s) 'type,data'" },
      },
    });
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      "Invalid request parameters: missing parameter(s) 'type,data'",
    );
  });

  test('should return 400 for unsupported event type', async () => {
    const response = await action.main({
      ...fakeParams,
      type: 'unsupported.event.type',
      data: { some: 'data' },
    });

    expect(response).toEqual({
      error: {
        statusCode: 400,
        body: { error: 'This case type is not supported: unsupported.event.type' },
      },
    });
    expect(mockLoggerInstance.error).toHaveBeenCalledWith('Event type not found: unsupported.event.type');
  });

  test('should return 500 when action invocation fails', async () => {
    const mockOpenwhiskInstance = {
      invokeAction: jest.fn().mockResolvedValue(null),
    };
    Openwhisk.mockReturnValue(mockOpenwhiskInstance);

    const response = await action.main({
      ...fakeParams,
      type: 'sfcc.delta.sync',
      data: { siteId: 'test-site' },
    });

    expect(response).toEqual({
      error: {
        statusCode: 500,
        body: { error: 'Error invoking action: sfcc.delta.sync' },
      },
    });
    expect(mockLoggerInstance.error).toHaveBeenCalledWith('Error invoking action: sfcc.delta.sync');
  });

  test('should return 500 and log error when openwhisk client throws error', async () => {
    const fakeError = new Error('Openwhisk connection failed');
    Openwhisk.mockImplementation(() => {
      throw fakeError;
    });

    const response = await action.main({
      ...fakeParams,
      type: 'sfcc.delta.sync',
      data: { siteId: 'test-site' },
    });

    expect(response).toEqual({
      error: {
        statusCode: 500,
        body: { error: 'Openwhisk connection failed' },
      },
    });
    expect(mockLoggerInstance.error).toHaveBeenCalledWith('Server error: Openwhisk connection failed');
  });
});
