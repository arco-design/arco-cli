import os from 'os';
import path from 'path';
import cliSpinners from 'cli-spinners';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageFile = require('../package.json');

const userHome = os.homedir();

export const ENV_GLOBAL_CACHE_DIR = 'ARCO_GLOBAL_CACHE_DIR';

function getDirectory(): string {
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, 'Arco');
  }
  return path.join(userHome, '.arco');
}

function getCacheDirectory(): string {
  const fromEnvVar = process.env[ENV_GLOBAL_CACHE_DIR];
  if (fromEnvVar && typeof fromEnvVar === 'string') {
    return fromEnvVar;
  }
  if (process.platform === 'darwin' || process.platform === 'linux') {
    return path.join(userHome, 'Library', 'Caches', 'Arco');
  }
  return getDirectory();
}

export const ENV_VARIABLE_CONFIG_PREFIX = 'ARCO_CONFIG_';

/**
 * Dir or file path
 */
export const DIR_CACHE_ROOT = getCacheDirectory();

export const DIR_GLOBAL_CONFIG = path.join(DIR_CACHE_ROOT, 'config');

export const DIR_GLOBAL_LOGS = path.join(DIR_CACHE_ROOT, 'logs');

export const FILE_GLOBAL_CONFIG = 'config.json';

export const FILE_WORKSPACE_JSONC = 'arco.workspace.jsonc';

export const PATH_DEBUG_LOGS = path.join(DIR_CACHE_ROOT, 'debug.log');

/**
 * Global config keys
 */
export const CFG_LOG_JSON_FORMAT = 'log_json_format';

export const CFG_LOG_LEVEL = 'log_level';

export const CFG_NO_WARNINGS = 'no_warnings';

export const CFG_USER_EMAIL_KEY = 'user.email';

export const CFG_USER_TOKEN_KEY = 'user.token';

export const CFG_USER_NAME_KEY = 'user.name';

export const CFG_ANALYTICS_DOMAIN_KEY = 'analytics_domain';

export const CFG_ANALYTICS_ANONYMOUS_KEY = 'anonymous_reporting';

export const CFG_REPOSITORY_REPORTING_KEY = 'repository_reporting';

export const CFG_ANALYTICS_REPORTING_KEY = 'analytics_reporting';

export const CFG_ANALYTICS_ERROR_REPORTS_KEY = 'error_reporting';

export const CFG_ANALYTICS_ENVIRONMENT_KEY = 'arco_environment';

export const CFG_ANALYTICS_USERID_KEY = 'analytics_id';

/**
 * Domain info
 */
export const BASE_WEB_DOMAIN = 'arco.design';

export const BASE_DOCS_DOMAIN = `${BASE_WEB_DOMAIN}/material`;

/**
 * Default values
 */
export const DEFAULT_ENV = 'arco.env/react';

export const DEFAULT_ANALYTICS_DOMAIN = `TODO: date analytics`;

export const DEFAULT_DIST_DIRNAME = 'dist';

export const DEFAULT_TEST_CASE_DIRNAME = '__test__';

export const DEFAULT_COMPONENT_DOCS_DIRNAME = '__docs__';

export const DEFAULT_LANGUAGE = 'javascript';

/**
 * Others
 */
export const IS_WINDOWS = os.platform() === 'win32';

export const SPINNER_TYPE = IS_WINDOWS ? cliSpinners.dots : cliSpinners.dots12;

export const GIT_IGNORE = '.gitignore';

export const PACKAGE_JSON = 'package.json';

export const IGNORE_LIST = [
  '**/.gitignore',
  '**/node_modules/**',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/LICENSE',
  '*/tsconfig.json',
];

export const CLI_VERSION = packageFile.version;

export const CLI_DESCRIPTION = '';

export const CLI_USAGE = '[--version] [--help] <command> [<args>]';

export const CLI_COMPONENT_PATTERN_HELP = `component name, package name, or component pattern. use component pattern to select multiple components.
use comma to separate patterns and "!" to exclude. e.g. "ui/**, !ui/button"
wrap the pattern with quotes`;
