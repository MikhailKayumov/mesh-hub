import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import-x';
import eslintConfigPrettier from 'eslint-plugin-prettier/recommended';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import { config, configs } from 'typescript-eslint';

export default config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [
      js.configs.recommended,
      ...configs.recommended,
      eslintConfigPrettier,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
    ],
    files: ['**/*.{ts,tsx,js,jsx,cjs}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      '@typescript-eslint/no-explicit-any': 1,
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
);
