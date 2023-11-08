module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'tailwind.config.js', 'postcss.config.js'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'import'],
  rules: {
    'no-explicit-any': 0,
    '@typescript-eslint/no-explicit-any': 0,
    'import/order': ['warn', {
      pathGroups: [{ pattern: '@/**', group: 'external', position: 'after' }],
      groups: ['builtin', 'external', 'internal', 'type', 'object', 'parent', 'sibling', 'index'],
      'newlines-between': 'never',
    }],
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
}
