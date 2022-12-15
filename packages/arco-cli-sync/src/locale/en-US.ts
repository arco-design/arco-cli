export default {
  TIP_CMD_EXEC_RESULT: 'The sync result of material metadata: ',
  TIP_META_GENERATE_ING: 'Try to automatically generate material metadata',
  TIP_META_GENERATE_DONE: 'Generate material metadata successfully',
  TIP_META_FETCH_SUCCESS: 'Update local material metadata successfully',
  TIP_META_SYNC_ING: 'Synchronizing material metadata...',
  TIP_META_SYNC_DONE: 'Synchronize material metadata successfully',

  ERROR_META_SYNC_FAILED: 'Synchronize material metadata failed',
  ERROR_NEED_PUBLISH_TO_NPM:
    'This project has not been published to NPM, please publish it to NPM first',
  ERROR_META_FETCH_FAILED:
    'Failed to update local material metadata, no remote material is available',
  ERROR_META_GENERATE_FAILED:
    'Failed to generate material metadata, please try to use [arco generate] to generate metadata',
  ERROR_META_SHOULD_FETCH_FIRST:
    'The local material metadata is fallen behind the remote, please execute [arco sync --fetch] to update it',
  ERROR_GET_PACKAGE_INFO_FAILED: 'Failed to get NPM package information',
  ERROR_NEED_PUPPETEER:
    'Automatic screenshots relies on puppeteer (https://www.npmjs.com/package/puppeteer), please try again after installing this package globally',
  ERROR_AUTO_SCREENSHOT_FAILED: 'Failed to generate material screenshot automatically',
  ERROR_NONE_PACKAGE_FOUNDED:
    'No material package was found in this directory, please execute this command in a valid material project',
};
