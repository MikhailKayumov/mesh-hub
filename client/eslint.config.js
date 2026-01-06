import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import { flatConfigs } from 'eslint-plugin-import-x';
import eslintConfigPrettier from 'eslint-plugin-prettier/recommended';
import { configs as rheslint } from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import { configs as tseslint } from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        module: 'readonly',
        require: 'readonly',
      },
    },
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    extends: [
      js.configs.recommended,
      tseslint.recommended,
      rheslint.flat.recommended,
      reactRefresh.configs.vite,
      eslintConfigPrettier,
      flatConfigs.recommended,
      flatConfigs.typescript,
    ],
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-unused-vars': [
        2,
        {
          caughtErrors: 'none',
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-unused-expressions': [2, { allowShortCircuit: true, allowTernary: true }],
      'react-refresh/only-export-components': [1, { allowConstantExport: true }],
      'react-hooks/exhaustive-deps': 0,
      'import-x/order': [
        'warn',
        {
          pathGroups: [{ pattern: '@/**', group: 'external', position: 'after' }],
          groups: ['builtin', 'external', 'internal', 'type', 'object', 'parent', 'sibling', 'index'],
          'newlines-between': 'never',
          alphabetize: {
            order: 'asc',
            orderImportKind: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
]);
