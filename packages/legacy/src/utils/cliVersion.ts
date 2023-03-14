import { setSync, getSync } from '../globalConfig';
import { CFG_CLI_VERSION_KEY } from '../constants';

export function setCliVersion(version) {
  return setSync({ [CFG_CLI_VERSION_KEY]: version });
}

export function getCliVersion() {
  return getSync(CFG_CLI_VERSION_KEY);
}
