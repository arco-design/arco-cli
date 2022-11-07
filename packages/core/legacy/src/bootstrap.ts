import fs from 'fs-extra';
import { Analytics } from './analytics/analytics';
import { handleUnhandledRejection } from './cli/handleErrors';
import { CLI_VERSION, DIR_GLOBAL_CONFIG, DIR_GLOBAL_LOGS } from './constants';
import { printWarning } from './logger';

// suppress fs experimental warnings from memfs
process.env.MEMFS_DONT_WARN = 'true';

// set max listeners to a more appropriate numbers
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('events').EventEmitter.defaultMaxListeners = 100;

process.on('unhandledRejection', async (err) => handleUnhandledRejection(err));

export async function bootstrap() {
  printVersionIfAsked();
  warnIfRunningAsRoot();
  verifyNodeVersionCompatibility();
  await ensureDirectories();
  await Analytics.promptAnalyticsIfNeeded();
}

async function ensureDirectories() {
  await fs.ensureDir(DIR_GLOBAL_CONFIG);
  await fs.ensureDir(DIR_GLOBAL_LOGS);
}

function verifyNodeVersionCompatibility() {
  // const nodeVersion = process.versions.node.split('-')[0];
  // TODO check node version
}

function warnIfRunningAsRoot() {
  const isRoot = process.getuid && process.getuid() === 0;
  if (isRoot) {
    printWarning('Running cli as root might cause permission issues later');
  }
}

function printVersionIfAsked() {
  if (['-V', '-v', '--version'].includes(process.argv[2])) {
    console.log(CLI_VERSION);
    process.exit();
  }
}
