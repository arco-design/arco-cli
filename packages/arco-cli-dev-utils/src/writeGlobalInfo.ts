import fs from 'fs-extra';
import { PATH_CLI_GLOBAL_INFO } from './constant';
import { CliGlobalInfo } from './getGlobalInfo';

export default function writeGlobalInfo(info: CliGlobalInfo) {
  let originalInfo = {};
  try {
    originalInfo = fs.readJsonSync(PATH_CLI_GLOBAL_INFO);
  } catch (err) {}
  fs.writeJsonSync(PATH_CLI_GLOBAL_INFO, { ...originalInfo, ...info }, { spaces: 2 });
}
