import { ProxyConfigArrayItem } from 'webpack-dev-server';
import { AspectDefinition } from '@arco-cli/aspect-loader';

export type ProxyEntry = ProxyConfigArrayItem & {
  context: string[];
};

export interface UIRoot {
  /**
   * unique name of the ui.
   */
  name: string;

  /**
   * path of the ui root.
   */
  path: string;

  /**
   * name of the UI root config file.
   */
  configFile: string;

  /**
   * option for build
   */
  buildOptions?: {
    launchBrowserOnStart?: boolean;
  };

  /**
   * resolve aspects in the UI root
   */
  resolveAspects(runtimeName: string): Promise<AspectDefinition[]>;

  /**
   * resolve components from a given pattern.
   */
  resolvePattern?(pattern: string): Promise<string[]>;
}
