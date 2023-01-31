import { ExecutionContext } from '@aspect/envs';

export type BrowserRuntime = {
  entry: (context: ExecutionContext) => Promise<string[]>;
};
