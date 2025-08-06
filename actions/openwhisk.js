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

const openwhisk = require('openwhisk');
const { context, trace, propagation } = require('@opentelemetry/api');
const { HTTP_OK } = require('./constants');
const { stringParameters } = require('./utils');

class Openwhisk {
  #openwhiskClient;

  constructor(host, apiKey) {
    this.#openwhiskClient = openwhisk({ apihost: host, api_key: apiKey });
  }

  async invokeAction(action, data) {
    const tracer = trace.getTracer(process.env.__OW_ACTION_NAME || 'unknown_action');
    const span = tracer.startSpan('invokeAction');
    const ctx = trace.setSpan(context.active(), span);

    return context.with(trace.setSpan(context.active(), span), async () => {
      try {
        propagation.inject(ctx, data);
        span.addEvent(`${action}: Send Data`, { args: stringParameters(data) });

        // if the action is async, the response result will just be { "activationId": "..." }
        const { activationId } = await this.#openwhiskClient.actions.invoke({
          name: action,
          blocking: false,
          params: {
            data,
          },
        });

        if (!activationId) {
          throw new Error('Could not invoke action: No activation ID returned');
        }

        span.addEvent(`${action}: Response Data`, {
          activationId,
          HTTP_OK,
        });

        return activationId;
      } catch (err) {
        span.addEvent(`${action}: Failed`, { message: err.message });
        span.setStatus({ code: 2, message: err.message });

        throw err;
      } finally {
        span.end();
      }
    });
  }
}

module.exports = Openwhisk;
