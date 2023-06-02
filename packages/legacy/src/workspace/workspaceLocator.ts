import fs from 'fs-extra';
import { join } from 'path';
import { FILE_WORKSPACE_JSONC, FILE_WORKSPACE_JS } from '../constants';
import { buildPropagationPaths } from '../utils/path';

export type WorkspaceInfo = {
  path: string;
  configFilename: string;
};

/**
 * propagate from the given directory up to the root to find the consumer
 */
export async function getWorkspaceInfo(absPath: string): Promise<WorkspaceInfo | null> {
  const searchPaths = buildPropagationPaths(absPath);
  searchPaths.unshift(absPath);

  for (let i = 0; i < searchPaths.length; i += 1) {
    const path = searchPaths[i];
    const jsFilePath = join(path, FILE_WORKSPACE_JS);
    const jsonFilePath = join(path, FILE_WORKSPACE_JSONC);

    const configFilename = fs.existsSync(jsFilePath)
      ? FILE_WORKSPACE_JS
      : fs.existsSync(jsonFilePath)
      ? FILE_WORKSPACE_JSONC
      : null;

    if (configFilename) {
      return {
        path,
        configFilename,
      };
    }
  }

  return null;
}
