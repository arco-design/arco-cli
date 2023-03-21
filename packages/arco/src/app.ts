/* eslint-disable import/first */
process.on('uncaughtException', (error) => {
  console.error('uncaughtException', error);
  process.exit(1);
});

import { bootstrap } from '@arco-cli/legacy/dist/bootstrap';
import { handleErrorAndExit } from '@arco-cli/legacy/dist/cli/handleErrors';
import { setCliVersion } from '@arco-cli/legacy/dist/utils';
import { runCLI } from './loadCli';
import packageJson from '../package.json';

(async function initApp() {
  try {
    setCliVersion(packageJson.version);
    await bootstrap();
    await runCLI();
  } catch (err: any) {
    const originalError = err.originalError || err;
    await handleErrorAndExit(originalError, process.argv[2]);
  }
})();
