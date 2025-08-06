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

const { Ajv } = require('ajv');

/**
 * Validates the given data against the provided JSON schema.
 *
 * @param {unknown} data - The data to be validated.
 * @param {any} schema - The JSON schema to validate against.
 * @returns {ActionStepResult<void>} An object containing the validation result.
 */
function validateJsonSchema(data, schema) {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    return {
      success: false,
      statusCode: 400,
      error: `Data provided does not validate with the schema: ${JSON.stringify(data)}`,
    };
  }
  return {
    success: true,
    data: undefined,
  };
}

module.exports = {
  validateJsonSchema,
};
