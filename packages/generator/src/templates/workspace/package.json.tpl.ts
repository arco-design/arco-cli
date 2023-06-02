import { TemplateFunction } from '../../types';

const templateFn: TemplateFunction = function ({ name = '', version = '0.1.0', description = '' }) {
  const packageJson = {
    name,
    version,
    description,
    scripts: {
      prepare: 'husky install',
      start: 'arco start',
      build: 'arco build',
      test: 'arco test',
      sync: 'arco sync',
      eslint: "eslint 'src/**/*.{js,jsx,ts,tsx}' --fix --cache --quiet",
      stylelint: "stylelint 'src/**/*.{css,less,scss}' --fix --cache",
      format: "prettier 'src/**/*.{js,jsx,ts,tsx}' --config .prettierrc --write",
    },
    peerDependencies: {
      react: '>=16',
      'react-dom': '>=16',
    },
    dependencies: {},
    devDependencies: {
      '@arco-cli/arco': '^2.0.0-alpha.29',
      '@arco-plugins/webpack-react': '~1',
      '@babel/runtime': '^7.22.3',
      '@testing-library/dom': '^8.19.1',
      '@testing-library/jest-dom': '^5.16.5',
      '@testing-library/react': '^12.1.5',
      '@types/jest': '~29',
      '@types/react': '~17',
      '@types/react-dom': '~17',
      '@typescript-eslint/eslint-plugin': '^5.42.0',
      '@typescript-eslint/parser': '^5.42.0',
      eslint: '^7.15.0',
      'eslint-config-airbnb': '^19.0.4',
      'eslint-config-prettier': '^8.5.0',
      'eslint-plugin-babel': '^5.3.1',
      'eslint-plugin-import': '^2.22.1',
      'eslint-plugin-jsx-a11y': '^6.6.1',
      'eslint-plugin-prettier': '^4.2.1',
      'eslint-plugin-react': '^7.31.10',
      'eslint-plugin-react-hooks': '^4.6.0',
      husky: '^8.0.3',
      jsdom: '^16.4.0',
      'jsdom-global': '^3.0.2',
      'lint-staged': '^13.1.1',
      'postcss-less': '^6.0.0',
      prettier: '^2.7.1',
      stylelint: '^14.14.0',
      'stylelint-config-css-modules': '^4.2.0',
      'stylelint-config-standard': '^33.0.0',
    },
    license: 'MIT',
  };

  return {
    filename: 'package.json',
    contents: JSON.stringify(packageJson, null, 2),
  };
};

export default templateFn;
