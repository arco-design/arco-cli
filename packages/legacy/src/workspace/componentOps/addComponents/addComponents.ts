import path from 'path';
import globby from 'globby';
import { ComponentNotFoundInPathError } from '../../component/exceptions';
import { IgnoredDirectoryError } from './exceptions';
import { pathNormalizeToLinux } from '../../../utils/path';

export type ComponentMapFile = {
  name: string;
  relativePath: string;
  test: boolean;
};

export async function getFilesByDir(
  dir: string,
  workspacePath: string,
  gitIgnore: any
): Promise<ComponentMapFile[]> {
  const matches = await globby(dir, {
    cwd: workspacePath,
    onlyFiles: true,
  });
  if (!matches.length) throw new ComponentNotFoundInPathError(dir);
  const filteredMatches = gitIgnore.filter(matches);
  if (!filteredMatches.length) throw new IgnoredDirectoryError(dir);
  return filteredMatches.map((match: string) => {
    const normalizedPath = pathNormalizeToLinux(match);
    // the path is relative to workspace. remove the rootDir.
    const relativePath = normalizedPath.replace(`${dir}/`, '');
    return { relativePath, test: false, name: path.basename(match) };
  });
}
