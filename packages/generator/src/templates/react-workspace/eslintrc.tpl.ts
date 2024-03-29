import { TemplateFunction } from '../../types';

const TemplateFn: TemplateFunction = function () {
  const config = {
    extends: ['plugin:@typescript-eslint/recommended', 'airbnb', 'plugin:prettier/recommended'],
    env: {
      browser: true,
      commonjs: true,
      es6: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
        experimentalObjectRestSpread: true,
      },
    },
    globals: {
      describe: 'readonly',
      it: 'readonly',
      expect: 'readonly',
      jest: 'readonly',
      $: 'readonly',
      afterEach: 'readonly',
      beforeEach: 'readonly',
    },
    rules: {
      'class-methods-use-this': 0,
      'func-names': 0,
      'global-require': 0,
      'guard-for-in': 0,
      'import/no-dynamic-require': 0,
      'import/no-mutable-exports': 0,
      'import/no-unresolved': 0,
      'import/extensions': 0,
      'import/prefer-default-export': 0,
      'jsx-a11y/click-events-have-key-events': 0,
      'jsx-a11y/no-static-element-interactions': 0,
      'jsx-a11y/no-noninteractive-element-interactions': 0,
      'linebreak-style': [2, 'unix'],
      'max-classes-per-file': 0,
      'no-case-declarations': 0,
      'no-continue': 0,
      'no-empty': 0,
      'no-empty-function': 0,
      'no-nested-ternary': 0,
      'no-plusplus': 0,
      'no-param-reassign': 0,
      'no-prototype-builtins': 0,
      'no-restricted-syntax': 0,
      'no-shadow': 0,
      'no-underscore-dangle': 0,
      'no-useless-constructor': 0,
      'no-useless-escape': 0,
      'no-use-before-define': 0,
      'no-unused-vars': [2, { vars: 'all', args: 'none' }],
      'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
      'one-var': 0,
      'prefer-promise-reject-errors': 0,
      'prefer-regex-literals': 0,
      'prefer-destructuring': 0,
      'prettier/prettier': [
        2,
        {
          trailingComma: 'es5',
          printWidth: 100,
        },
      ],
      radix: 0,
      'react/button-has-type': 0,
      'react/destructuring-assignment': 0,
      'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx', 'ts', 'tsx'] }],
      'react/jsx-one-expression-per-line': 0,
      'react/jsx-props-no-spreading': 0,
      'react/no-array-index-key': 0,
      'react/no-children-prop': 0,
      'react/no-multi-comp': 0,
      'react/prefer-stateless-function': 0,
      'react/require-default-props': 0,
      'react/sort-comp': 0,
      strict: 0,
      '@typescript-eslint/ban-ts-comment': 0,
      '@typescript-eslint/explicit-function-return-type': 0,
      '@typescript-eslint/explicit-module-boundary-types': 0,
      '@typescript-eslint/no-empty-function': 0,
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: false,
          classes: false,
        },
      ],
    },
  };
  return {
    filename: '.eslintrc.json',
    contents: JSON.stringify(config, null, 2),
  };
};

export default TemplateFn;
