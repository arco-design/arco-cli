import semver from 'semver';
import { InvalidVersionError } from '../exceptions';

export const LATEST_VERSION = 'latest';

export const VERSION_DELIMITER = '@';

export class Version {
  latest: boolean;

  versionNum: string | null | undefined;

  constructor(versionNum: string | null | undefined, latest: boolean) {
    this.versionNum = versionNum;
    this.latest = latest;
  }

  toString() {
    if (!this.versionNum && this.latest) return 'latest';
    if (this.versionNum && this.latest) return `*${this.versionNum}`;
    if (this.versionNum && !this.latest) return this.versionNum.toString();
    throw new InvalidVersionError(this.versionNum);
  }

  isLaterThan(otherVersion: Version): boolean {
    if (!this.versionNum || this.versionNum === LATEST_VERSION) {
      return true;
    }
    if (!otherVersion.versionNum || otherVersion.versionNum === LATEST_VERSION) {
      return false;
    }
    return semver.gt(this.versionNum, otherVersion.versionNum);
  }
}
