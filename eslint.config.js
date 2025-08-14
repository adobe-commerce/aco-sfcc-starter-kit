const nodePlugin = require('eslint-plugin-n');
const jsdoc = require('eslint-plugin-jsdoc');
const react = require('eslint-plugin-react');

// eslint-disable-next-line n/no-extraneous-require
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
      'jsdoc/no-undefined-types': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/tag-lines': 'off',
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
      'jsdoc/no-undefined-types': 'off',
      'jsdoc/newline-after-description': 'off',
      'jsdoc/tag-lines': 'off',
      'jsdoc/require-returns-description': 'off',
    },
  },

  {
    files: ['test/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      parserOptions: {
        ecmaVersion: 'latest',
      },
      globals: {
        node: true,
        jest: true,
        describe: true,
        test: true,
        it: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
        beforeAll: true,
        afterAll: true,
      },
    },
    rules: {
      'n/exports-style': ['error', 'module.exports'],
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/no-undefined-types': 'off',
      'jsdoc/newline-after-description': 'off',
      'jsdoc/tag-lines': 'off',
      'jsdoc/require-returns-description': 'off',
    },
  },

  eslintPluginPrettierRecommended,
];
