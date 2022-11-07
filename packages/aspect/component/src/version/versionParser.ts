import semver from 'semver';
import { InvalidVersionError } from '../exceptions';
import { Version, LATEST_VERSION } from './version';

export const LATEST_TESTED_MARK = '*';

function isLatest(versionStr: string): boolean {
  return versionStr === LATEST_VERSION;
}

function isLatestTested(versionStr: string) {
  if (!versionStr.includes(LATEST_TESTED_MARK)) return false;
  const splited = versionStr.split(LATEST_TESTED_MARK);
  if (splited.length !== 2) return false;
  const [, numberStr] = splited;
  const version = isRegular(numberStr);
  if (!version) return false;
  return true;
}

function isRegular(versionStr: string) {
  return semver.valid(versionStr);
}

function returnRegular(versionStr: string): Version {
  return new Version(versionStr, false);
}

function returnLatestTestedVersion(versionStr: string): Version {
  const [, numberStr] = versionStr.split(LATEST_TESTED_MARK);
  return new Version(numberStr, true);
}

function returnLatest(): Version {
  return new Version(null, true);
}

function convertToSemVer(versionStr: number) {
  return returnRegular(`0.0.${versionStr}`);
}

export function versionParser(versionStr: string | number | null | undefined): Version {
  const isVersionStr = typeof versionStr === 'string';
  if (!versionStr) return returnLatest();
  if (isVersionStr && isLatest(versionStr)) return returnLatest();
  if (isVersionStr && isLatestTested(versionStr)) return returnLatestTestedVersion(versionStr);
  if (isVersionStr && isRegular(versionStr)) return returnRegular(versionStr);
  if (!isVersionStr && Number.isInteger(versionStr)) return convertToSemVer(versionStr);
  throw new InvalidVersionError(versionStr.toString());
}
