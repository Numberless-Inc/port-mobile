import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactNativePlugin from 'eslint-plugin-react-native';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        module: true,
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-native': reactNativePlugin,
      import: importPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {}, // This loads <rootdir>/tsconfig.json
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',

      // React specific rules
      'react/prop-types': 'off', // We're using TypeScript for type checking
      'react/display-name': 'off',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Native specific rules
      'react-native/no-unused-styles': 'warn',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',
      'react-native/sort-styles': 'off', // This is sometimes too opinionated

      // Some of our own flavors
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-namespace': 'off',
      'no-async-promise-executor': 'off', // We'd never fuck this up, would we?

      // Sort imports within a declaration (addressing the 'all' before 'single' syntax issue)
      'sort-imports': [
        'error',
        {
          ignoreCase: false,
          ignoreDeclarationSort: true, // Let import/order handle declaration sorting
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        },
      ],

      // Import specific rules
      'import/order': [
        'error', // Changed from 'warn' to 'error'
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          pathGroups: [
            {
              pattern: '{react,react-dom,react-native}',
              group: 'external',
              position: 'before',
            },
            {pattern: '@components/**', group: 'internal', position: 'before'},
            {pattern: '@configs/**', group: 'internal', position: 'before'},
            {pattern: '@navigation/**', group: 'internal', position: 'before'},
            {pattern: '@screens/**', group: 'internal', position: 'before'},
            {pattern: '@store/**', group: 'internal', position: 'before'},
            {pattern: '@utils/**', group: 'internal', position: 'before'},
            {pattern: '@assets/**', group: 'internal', position: 'before'},
            {pattern: '@specs/**', group: 'internal', position: 'before'},
          ],
          pathGroupsExcludedImportTypes: ['react', 'react-dom', 'react-native'],
          warnOnUnassignedImports: true,
        },
      ],
      'import/no-duplicates': 'error',

      // General ESLint rules
      'no-console': ['warn', {allow: ['warn', 'error']}],
      'prettier/prettier': 'warn',
      'arrow-body-style': ['warn', 'as-needed'],
      'prefer-arrow-callback': 'warn',
    },
  },
  prettierConfig,
  {
    ignores: ['node_modules/', 'ios/', 'android/', '*.config.js', '*.setup.js', "shared/"],
  },
);
