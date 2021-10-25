import path from 'path';
import { print } from '@arco-design/arco-dev-utils';

const PATH_MAIN_CONFIG = '.config/main.js';

export type MainConfig = {
  /** Config for build */
  build: {
    /** Math the path of document and demos */
    globs: {
      doc: string;
      component: {
        base: string;
        demo: string;
        doc?: string;
        style?: string;
      };
      hook?: {
        beforeAll?: string;
        beforeEach?: string;
      };
    };
    /** Whether to import material style file */
    withMaterialStyle?: boolean;
  };
  /** Config for site render */
  site: {
    /** Languages allowed to switch */
    languages: string[];
    /** Lark group id for on call */
    larkGroupID: string;
    /** Whether switching themes is allowed */
    allowThemeToggle: boolean;
  };
};

function getMainConfig(): MainConfig {
  try {
    const config = require(path.resolve(process.cwd(), PATH_MAIN_CONFIG));
    return config;
  } catch (err) {
    print.error('[arco-doc-site]', 'Failed to get site config');
    console.error(err);
  }
}

export default getMainConfig;
