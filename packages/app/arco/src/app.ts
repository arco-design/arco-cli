/* eslint-disable import/first */
process.on('uncaughtException', (error) => {
  console.error('uncaughtException', error);
  process.exit(1);
});

import { bootstrap } from '@arco-cli/legacy/dist/bootstrap';
import { handleErrorAndExit } from '@arco-cli/legacy/dist/cli/handleErrors';
import { runCLI } from './loadCli';

(async function initApp() {
  try {
    await bootstrap();
    await runCLI();
  } catch (err: any) {
    const originalError = err.originalError || err;
    await handleErrorAndExit(originalError, process.argv[2]);
  }
})();
