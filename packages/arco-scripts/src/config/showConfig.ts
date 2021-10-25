import path from 'path';
import { print } from '@arco-design/arco-dev-utils';

type ConfigType =
  | 'babel'
  | 'style'
  | 'webpack.component'
  | 'webpack.site'
  | 'webpack.icon'
  | 'jest'
  | 'docgen';

/**
 * Print current config for arco-scripts
 */
export default (type: ConfigType) => {
  let configPath = '';

  switch (type) {
    case 'babel':
      configPath = path.resolve(__dirname, './babel.config');
      break;
    case 'style':
      configPath = path.resolve(__dirname, './style.config');
      break;
    case 'webpack.component':
      configPath = path.resolve(__dirname, './webpack/component');
      break;
    case 'webpack.site':
      configPath = path.resolve(__dirname, './webpack/site');
      break;
    case 'webpack.icon':
      configPath = path.resolve(__dirname, './webpack/icon');
      break;
    case 'jest':
      configPath = path.resolve(__dirname, './jest/config');
      break;
    case 'docgen':
      configPath = path.resolve(__dirname, './docgen.config');
      break;
    default:
      print.error(
        'Invalid parameter: configType. It should be one of [babel|style|webpack.component|webpack.site|webpack.icon|jest|docgen]'
      );
      return;
  }

  print(require(configPath));
  print('\n');
  print.success(`For more details, view [${configPath}]`);
};
