import fs from 'fs-extra';
import { join } from 'path';
import { FILE_WORKSPACE_JSONC } from '../constants';
import { buildPropagationPaths } from '../utils/path';

export type WorkspaceInfo = {
  path: string;
  hasWorkspaceConfig: boolean;
};

/**
 * propagate from the given directory up to the root to find the consumer
 */
export function getWorkspaceInfo(absPath: string): WorkspaceInfo | null {
  const searchPaths = buildPropagationPaths(absPath);
  searchPaths.unshift(absPath);

  for (let i = 0; i < searchPaths.length; i += 1) {
    const path = searchPaths[i];
    const configFilePath = join(path, FILE_WORKSPACE_JSONC);
    const hasWorkspaceConfig = fs.existsSync(configFilePath);
    if (hasWorkspaceConfig) {
      return {
        path,
        hasWorkspaceConfig,
      };
    }
  }

  return null;
}
