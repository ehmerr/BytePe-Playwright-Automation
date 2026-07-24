import js from '@eslint/js';
import globals from 'globals';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'node_modules/',
      'test-results/',
      'playwright-report/',
      'blob-report/',
      'playwright/.cache/',
    ],
  },

  js.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      eqeqeq: ['error', 'smart'],
    },
  },

  {
    // Page objects and components wrap Playwright locators, so the plugin's
    // test-file rules apply to them as well as to the specs.
    files: ['tests/**/*.js', 'pages/**/*.js', 'components/**/*.js', 'fixtures/**/*.js'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // The suite deliberately skips wholesale when BASE_URL or STORAGE_STATE is
      // unset - that is the documented guard, not a forgotten skip.
      'playwright/no-skipped-test': 'off',
      // Tests never assert on raw locators; the assertion lives in the page
      // object's verify* method or in the shared openReview precondition. The
      // rule matches the bare method name by exact string - it supports no
      // wildcards - so every assert-bearing helper has to be listed. A new
      // verify* method missing from this list surfaces as a warning, not a
      // build failure, so a stale entry here is cheap to notice and fix.
      'playwright/expect-expect': [
        'warn',
        {
          assertFunctionNames: [
            'expect',
            'openReview',
            'verifyBytePeSecureIncluded',
            'verifyCardFormVisible',
            'verifyCardlessEmiVisibility',
            'verifyDefaultCCEMI',
            'verifyInterest',
            'verifyLoaded',
            'verifyOpened',
            'verifyOrderSummaryVisible',
            'verifyProductReadOnly',
            'verifySavings',
            'verifySelected',
            'verifySubscriptionSelected',
            'verifyTotal',
            'verifyVisible',
          ],
        },
      ],
    },
  },

  {
    // Logger's entire job is writing to the console.
    files: ['utils/Logger.js'],
    rules: { 'no-console': 'off' },
  },

  prettier,
];
