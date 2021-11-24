import fs from 'fs-extra';
import path from 'path';
import { ModuleUMDInfo } from '@arco-design/arco-material-preview-utils/es/interface';

export default function tryGetUMDInfo(currentPath: string): ModuleUMDInfo {
  if (fs.pathExistsSync(currentPath)) {
    const packageJsonPath = path.resolve(currentPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const { name, umd = {} } = fs.readJsonSync(packageJsonPath);
      return { packageName: name, ...umd };
    }

    return tryGetUMDInfo(path.resolve(currentPath, '..'));
  }

  return null;
}
