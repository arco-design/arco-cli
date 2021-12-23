import fs from 'fs-extra';
import { PATH_CLI_GLOBAL_INFO } from './constant';

export interface CliGlobalInfo {
  'x-arco-token'?: string;
  userInfo?: {
    accountType: 'github' | 'sso';
    username: string;
    name: string;
    email: string;
    avatarUrl: string;
  };
  host?: {
    npm: string;
    unpkg: string;
    arco: string;
  };
  env?: 'private' | 'public';
  locale?: 'zh-CN' | 'en-US' | 'system';
}

export default function getGlobalInfo(): CliGlobalInfo {
  if (fs.existsSync(PATH_CLI_GLOBAL_INFO)) {
    return fs.readJsonSync(PATH_CLI_GLOBAL_INFO);
  }

  return {};
}
