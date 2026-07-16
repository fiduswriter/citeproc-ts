import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.cslTestFixtures/**',
      'citeproc.*',
      'test-runner/lib/templateJS.js',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      tseslint.configs.base,
    ],
    rules: {
      'no-var': 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      'no-var': 'error',
    },
  },
);
