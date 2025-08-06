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

const { validateJsonSchema } = require('../../../../utils/validation');
const { useTelemetry } = require('../../../telemetry');

const schema = require('./schema.json');

/**
 * Validates the input data received in the runtime action.
 *
 * @param {ProductActions.UpsertEnv} params - The environment parameters.
 * @returns {Promise<ActionStepResult<void>>} The result of the validation.
 */
async function validateData(params) {
  return validateJsonSchema(params.data, schema);
}

module.exports = {
  validateData: useTelemetry(validateData),
};
