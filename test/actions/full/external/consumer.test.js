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
const action = require('../../../../actions/full/external/consumer/index.js');

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

describe('full-sync-external-consumer', () => {
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
      type: 'sfcc.full.sync',
      data: { siteId: 'test-site' },
    });

    expect(Core.Logger).toHaveBeenCalledWith('full-sync-external-consumer', { level: 'debug' });
  });

  test('should handle sfcc.full.sync event type and invoke sync action', async () => {
    const mockOpenwhiskInstance = {
      invokeAction: jest.fn().mockResolvedValue('activation-full-123'),
    };
    Openwhisk.mockReturnValue(mockOpenwhiskInstance);

    const testData = { siteId: 'test-site-full' };
    const response = await action.main({
      ...fakeParams,
      type: 'sfcc.full.sync',
      data: testData,
    });

    expect(mockOpenwhiskInstance.invokeAction).toHaveBeenCalledWith('full-backoffice/sync', testData);
    expect(response).toEqual({
      statusCode: 200,
      body: {
        type: 'sfcc.full.sync',
        response: { activationId: 'activation-full-123' },
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
      type: 'sfcc.full.sync',
      data: { siteId: 'test-site' },
    });

    expect(response).toEqual({
      error: {
        statusCode: 500,
        body: { error: 'Error invoking action: sfcc.full.sync' },
      },
    });
    expect(mockLoggerInstance.error).toHaveBeenCalledWith('Error invoking action: sfcc.full.sync');
  });

  test('should return 500 and log error when openwhisk client throws error', async () => {
    const fakeError = new Error('Openwhisk connection failed');
    Openwhisk.mockImplementation(() => {
      throw fakeError;
    });

    const response = await action.main({
      ...fakeParams,
      type: 'sfcc.full.sync',
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
