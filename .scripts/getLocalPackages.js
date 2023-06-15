/* eslint-disable */
const path = require('path');
const { exec } = require('child_process');

const DIR_PACKAGES = path.resolve(__dirname, '../packages');

/**
 * @returns {Promise<Array<{ name: string; location: string }>>}
 */
module.exports = function () {
  return new Promise((resolve, reject) => {
    exec('lerna list --json', (error, stdout, stderr) => {
      const errMsg = 'Failed to collect packages info via [lerna list]';

      if (error) {
        reject({
          error,
          msg: errMsg,
        });
      }

      try {
        const infoList = JSON.parse(stdout).filter(({ location }) =>
          location.startsWith(DIR_PACKAGES)
        );
        resolve(infoList);
      } catch (error) {
        reject({
          error,
          msg: stderr || errMsg,
        });
      }
    });
  });
};
