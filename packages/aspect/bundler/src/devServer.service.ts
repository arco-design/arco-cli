import { sep } from 'path';
import { flatten } from 'lodash';
import { EnvService, ExecutionContext, EnvDefinition } from '@arco-cli/envs';
import { BrowserRuntimeSlot } from './bundler.main.runtime';
import { ComponentServer } from './componentServer';
import { dedupEnvs } from './dedupEnvs';
import { DevServer } from './devServer';
import { DevServerContext } from './devServerContext';
import { getEntry } from './getEntry';

export type DevServerDescriptor = {
  /**
   * id of the dev server (e.g. jest/mocha)
   */
  id: string;

  /**
   * display name of the dev server (e.g. Jest / Mocha)
   */
  displayName: string;

  /**
   * string containing the config for display.
   */
  config: string;

  version?: string;
};

export class DevServerService implements EnvService<ComponentServer, DevServerDescriptor> {
  name = 'dev server';

  constructor(
    /**
     * browser runtime slot
     */
    private runtimeSlot: BrowserRuntimeSlot
  ) {}

  private getComponentsFromContexts(contexts: ExecutionContext[]) {
    return flatten(
      contexts.map((context) => {
        return context.components;
      })
    );
  }

  /**
   * builds the execution context for the dev server.
   */
  private async buildContext(
    context: ExecutionContext,
    additionalContexts: ExecutionContext[] = []
  ): Promise<DevServerContext> {
    context.relatedContexts = additionalContexts.map((ctx) => ctx.envDefinition.id);
    context.components = context.components.concat(
      this.getComponentsFromContexts(additionalContexts)
    );

    return Object.assign(context, {
      entry: await getEntry(context, this.runtimeSlot),
      // don't start with a leading "/" because it generates errors on Windows
      rootPath: `preview/${context.envRuntime.id}`,
      publicPath: `${sep}public`,
    });
  }

  async getDescriptor(
    environment: EnvDefinition,
    context?: ExecutionContext[]
  ): Promise<DevServerDescriptor | undefined> {
    if (!environment.env.getDevServer || !context) return undefined;
    const mergedContext = await this.buildContext(context[0], []);
    const devServer: DevServer = environment.env.getDevServer(mergedContext);

    return {
      id: devServer.id || '',
      displayName: devServer.displayName || '',
      config: devServer.displayConfig ? devServer.displayConfig() : '',
      version: devServer.version ? devServer.version() : '?',
    };
  }

  async runOnce(contexts: ExecutionContext[]): Promise<ComponentServer[]> {
    const groupedEnvs = await dedupEnvs(contexts);

    const servers = await Promise.all(
      Object.entries(groupedEnvs).map(async ([id, contextList]) => {
        const mainContext =
          contextList.find((context) => context.envDefinition.id === id) || contextList[0];
        const additionalContexts = contextList.filter((context) => context.envDefinition.id !== id);

        const devServerContext = await this.buildContext(mainContext, additionalContexts);
        const devServer: DevServer = await devServerContext.envRuntime.env.getDevServer(
          devServerContext
        );

        return new ComponentServer(devServerContext, [3300, 3400], devServer);
      })
    );

    return servers;
  }
}
