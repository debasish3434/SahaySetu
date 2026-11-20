module.exports = {
  root: true,
  ignorePatterns: ['dist/', 'android/'],
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: { react: { version: '18.3' } },
  plugins: ['react', 'react-hooks'],
  rules: {
    // Warn on unused vars but allow underscore-prefixed args (common in callbacks)
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // react-hook-form commonly needs deps suppressed; keep the rule as warning
    'react-hooks/exhaustive-deps': 'warn',
    // Not needed with new JSX transform
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
};
