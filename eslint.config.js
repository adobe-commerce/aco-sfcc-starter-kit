const nodePlugin = require('eslint-plugin-n');
const jsdoc = require('eslint-plugin-jsdoc');
const react = require('eslint-plugin-react');

const pluginJs = require('@eslint/js');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/generated/**', '**/.ignore/**'],
  },

  pluginJs.configs.recommended,
  jsdoc.configs['flat/recommended'],
  nodePlugin.configs['flat/recommended'],

  {
    files: ['web-src/**/*.js'],
    plugins: {
      react,
    },

    languageOptions: {
      sourceType: 'module',
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
      },

      globals: {
        window: true,
        document: true,
        navigator: true,
      },
    },

    rules: {
      // Global types seem to be resolved by the IDE but not by ESLint.
      'jsdoc/no-undefined-types': 'off',
    },
  },

  {
    files: ['**/*.js'],
    ignores: ['web-src/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      parserOptions: {
        ecmaVersion: 'latest',
      },

      globals: {
        node: true,
      },
    },

    rules: {
      'n/exports-style': ['error', 'module.exports'],
      'jsdoc/require-jsdoc': 'off',

      // Global types seem to be resolved by the IDE but not by ESLint.
      'jsdoc/no-undefined-types': 'off',
      'jsdoc/newline-after-description': 'off',
    },
  },

  eslintPluginPrettierRecommended,
];
