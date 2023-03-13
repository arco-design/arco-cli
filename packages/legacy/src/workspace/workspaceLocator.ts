import fs from 'fs-extra';
import { join } from 'path';
import { FILE_WORKSPACE_JSONC, FILE_WORKSPACE_JS } from '../constants';
import { buildPropagationPaths } from '../utils/path';

export type WorkspaceInfo = {
  path: string;
  hasWorkspaceConfig: boolean;
  fileName: string;
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

    let fileName = '';
  
    const hasWorkspaceConfig = await Promise.all([
      fs.pathExists(jsFilePath),
      fs.pathExists(jsonFilePath),
    ]).then(([hasJsConfig, hasJsonConfig]) => {
      if (hasJsConfig) {
        fileName = FILE_WORKSPACE_JS;
        return true;
      }
      if (hasJsonConfig) {
        fileName = FILE_WORKSPACE_JSONC;
        return true;
      }
      return false;
    });

    if (hasWorkspaceConfig) {
      return {
        path,
        hasWorkspaceConfig,
        fileName,
      };
    }
  }

  return null;
}
