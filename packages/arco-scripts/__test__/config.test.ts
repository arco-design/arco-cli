import babelConfig from '../src/config/babel.config';
import docgenConifig from '../src/config/docgen.config';
import jestConfig from '../src/config/jest/config';
import styleConfig from '../src/config/style.config';
import webpackComponentConfig from '../src/config/webpack/component';
import * as webpackSiteConfig from '../src/config/webpack/site';
import webpackIconConfig from '../src/config/webpack/icon';

describe('Read user config', () => {
  it('Babel config', () => {
    expect(babelConfig).toMatchSnapshot();
  });

  it('Docgen config', () => {
    expect(docgenConifig).toMatchSnapshot();
  });

  it('Jest config', () => {
    expect(jestConfig).toMatchSnapshot();
  });

  it('Style config', () => {
    expect(styleConfig).toMatchSnapshot();
  });

  it('Webpack config', () => {
    expect(webpackComponentConfig).toMatchSnapshot();
    expect(webpackSiteConfig).toMatchSnapshot();
    expect(webpackIconConfig).toMatchSnapshot();
  });
});
