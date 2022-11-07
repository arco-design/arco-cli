import { ExecutionContext } from '@arco-cli/envs';

export type BrowserRuntime = {
  entry: (context: ExecutionContext) => Promise<string[]>;
};
