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

const { context, propagation, trace } = require('@opentelemetry/api');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');

const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { UndiciInstrumentation } = require('@opentelemetry/instrumentation-undici');

let telemetryInitialized = false;

/**
 * Initializes OpenTelemetry for tracing.
 *
 * @param {string} url - The URL for the OTLP trace exporter.
 */
function initializeOpenTelemetry(url) {
  if (!telemetryInitialized) {
    const actionName = process.env.__OW_ACTION_NAME.toString();
    const namespace = process.env.__OW_NAMESPACE.toString();
    const runtimeAction = actionName.replaceAll(`/${namespace}/`, '');

    const provider = new NodeTracerProvider({
      resource: new Resource({
        [ATTR_SERVICE_NAME]: runtimeAction,
      }),
      spanProcessors: [
        new BatchSpanProcessor(
          new OTLPTraceExporter({
            url: `${url}/v1/traces`, // OTLP HTTP endpoint 4318 // ngrok http 4318
            // url: '2.tcp.eu.ngrok.io:11477', // OTLP GRPC endpoint 4317 // ngrok tcp 4317
          }),
        ),
      ],
    });

    provider.register();
    registerInstrumentations({
      instrumentations: [
        new UndiciInstrumentation({
          requestHook: (span, request) => {
            trace.setSpan(context.active(), span);
            span.updateName(request.path);
            span.addEvent('Fetching URL', {
              undiciRequest: stringify(request),
            });
          },
          responseHook: (span, response) => {
            trace.setSpan(context.active(), span);
            span.addEvent('Response', {
              undiciResponse: stringify(response.response),
              undiciRequest: stringify(response.request),
            });
          },
        }),
      ],
    });

    telemetryInitialized = true;
  }
}

/**
 * Enables telemetry for the given function.
 *
 * @template {AnyFunction} TFunc
 * @param {TFunc} func - The function to add telemetry to.
 * @returns {AnyFunctionWrapper<TFunc>} - The function with automatic telemetry
 */
function useTelemetry(func) {
  return async function (...args) {
    if (!telemetryInitialized) {
      return await func(...args);
    }

    const actionName = process.env.__OW_ACTION_NAME;
    const tracer = trace.getTracer(actionName);
    const span = tracer.startSpan(func.name);

    return context.with(trace.setSpan(context.active(), span), async () => {
      try {
        span.addEvent(`${func.name}: Incoming Data`, {
          args: stringify(args),
        });
        const result = await func(...args);

        if (result && 'success' in result && !result.success) {
          span.addEvent(`${func.name}: Failed`);
          span.setStatus({ code: 2, message: 'Did not return success=true' });

          return result;
        }

        span.addEvent(`${func.name}: Success`, {
          result: stringify(result),
        });

        return result;
      } catch (err) {
        span.addEvent(`${func.name}: Failed`, { message: err.message });
        span.setStatus({ code: 2, message: err.message });

        throw err;
      } finally {
        span.end();
      }
    });
  };
}

/**
 * Wraps the main function to add telemetry to it.
 *
 * @template {GlobalEnv} TEnv
 * @param {MainFunction<TEnv>} callback - The main function to wrap.
 * @returns {MainFunctionWrapper<TEnv>} - The wrapped main function.
 */
function defineMain(callback) {
  return async function (params) {
    const enableTelemetry = (params?.TELEMETRY_ENABLE ?? 'false') === 'true';

    if (!enableTelemetry) {
      return await callback(params);
    }

    const telemetryNgrokUrl = params.NGROK_URL;
    initializeOpenTelemetry(telemetryNgrokUrl);

    const tracer = trace.getTracer(process.env.__OW_ACTION_NAME);
    const extractedContext = propagation.extract(context.active(), params.data);

    return tracer.startActiveSpan('main', { attributes: { function: 'main' } }, extractedContext, async rootSpan => {
      try {
        rootSpan.addEvent(`Main: Incoming Data`, {
          args: stringify(params),
        });

        const result = await callback(params);

        // TODO: Check status code
        rootSpan.addEvent(`Main: Success`, {
          result: stringify(result),
        });

        return result;
      } catch (err) {
        rootSpan.addEvent(`Main: Failed`, { message: err.message });
        rootSpan.setStatus({ code: 2, message: err.message });

        throw err;
      } finally {
        rootSpan.end();
      }
    });
  };
}

/**
 * Adds a telemetry event to the active span.
 *
 * @param {string} name - The name of the event.
 * @param {any} [attributes] - The attributes of the event.
 */
function addTelemetryEvent(name, attributes) {
  if (telemetryInitialized) {
    const activeSpan = trace.getSpan(context.active());
    activeSpan.addEvent(name, attributes ?? {});
  }
}

function instrumentConsumer(consumerCallback) {
  return async function (params) {
    const enableTelemetry = (params?.TELEMETRY_ENABLE ?? 'false') === 'true';

    if (!enableTelemetry) {
      return await consumerCallback(params);
    }

    const telemetryNgrokUrl = params.NGROK_URL;
    initializeOpenTelemetry(telemetryNgrokUrl);

    const tracer = trace.getTracer(process.env.__OW_ACTION_NAME);
    const span = tracer.startSpan('consumer');

    return context.with(trace.setSpan(context.active(), span), async () => {
      span.addEvent('Consumer: Incoming Data', {
        args: stringify(params),
      });
      span.setAttributes({
        activationId: process.env.__OW_ACTIVATION_ID, // OpenWhisk-specific metadata
        event_code: params.type,
        event_id: params.event_id,
        source: params.source,

        'params.logLevel': params.LOG_LEVEL || 'info',
      });

      try {
        const result = await consumerCallback(params);
        span.addEvent('Consumer: Success', { result: stringify(result) });

        return result;
      } catch (err) {
        span.addEvent('Consumer: Failed', { message: err.message });
        span.setStatus({ code: 2, message: err.message });

        throw err;
      } finally {
        span.end();
      }
    });
  };
}

/**
 * Enables telemetry for the given error action response function.
 *
 * @template {(...args: any[]) => any} TFunc
 * @param {TFunc} callback - The function to add telemetry to
 * @returns {(...args: Parameters<TFunc>) => Promise<Awaited<ReturnType<TFunc>>>} - The function with automatic
 *   telemetry
 */
function defineActionErrorResponse(callback) {
  return function (...args) {
    if (!telemetryInitialized) {
      return callback(...args);
    }

    const activeSpan = trace.getSpan(context.active());
    activeSpan.addEvent('Response: Failed', { args });
    activeSpan.setStatus({ code: 2 }); // Error code

    return callback(...args);
  };
}

/**
 * Enables telemetry for the given success action response function.
 *
 * @template {(...args: any[]) => any} TFunc
 * @param {TFunc} callback - The function to add telemetry to
 * @returns {(...args: Parameters<TFunc>) => Promise<Awaited<ReturnType<TFunc>>>} - The function with automatic
 *   telemetry
 */
function defineActionSuccessResponse(callback) {
  return function (...args) {
    if (!telemetryInitialized) {
      return callback(...args);
    }

    const activeSpan = trace.getSpan(context.active());
    activeSpan.addEvent('Response: Success', { args });
    activeSpan.setStatus({ code: 0 });

    return callback(...args);
  };
}

/**
 * Stringifies the input object to avoid circular references.
 *
 * @param {any} input - The input object to stringify.
 * @returns {string} The stringified input object.
 */
function stringify(input) {
  function getCircularReplacer() {
    const ancestors = [];
    return function (key, value) {
      if (typeof value !== 'object' || value === null) {
        return value;
      }
      // `this` is the object that value is contained in,
      // i.e., its direct parent.
      while (ancestors.length > 0 && ancestors.at(-1) !== this) {
        ancestors.pop();
      }
      if (ancestors.includes(value)) {
        return '[Circular]';
      }
      ancestors.push(value);
      return value;
    };
  }

  return JSON.stringify(input, getCircularReplacer());
}

module.exports = {
  defineMain,
  useTelemetry,
  addTelemetryEvent,
  instrumentConsumer,
  defineActionErrorResponse,
  defineActionSuccessResponse,
};
