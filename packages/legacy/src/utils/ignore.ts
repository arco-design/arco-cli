import ignore from 'ignore';
import fs from 'fs-extra';
import findUp from 'find-up';
import parseGitignore from 'parse-gitignore';
import { GIT_IGNORE, IGNORE_LIST, PACKAGE_JSON } from '../constants';

function getIgnoreListForArco(consumerPath: string): string[] {
  const ignoreList = retrieveIgnoreList(consumerPath);
  ignoreList.push(PACKAGE_JSON);
  return ignoreList;
}

export function getGitIgnoreFile(dir: string) {
  const gitIgnoreFile = findUp.sync([GIT_IGNORE], { cwd: dir });
  return gitIgnoreFile ? parseGitignore(fs.readFileSync(gitIgnoreFile)) : [];
}

export function retrieveIgnoreList(cwd: string) {
  const ignoreList = getGitIgnoreFile(cwd).concat(IGNORE_LIST);
  return ignoreList;
}

export function getGitIgnoreForArco(consumerPath: string): any {
  const ignoreList = getIgnoreListForArco(consumerPath);
  return ignore().add(ignoreList);
}
