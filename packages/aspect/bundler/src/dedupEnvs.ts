import type { ExecutionContext } from '@arco-cli/envs';

type GroupIdContextMap = Record<string, ExecutionContext[]>;

/**
 * de-duping dev servers by the amount of type the dev server configuration was overridden by envs.
 * This will split the dev server to groups of dev server that share the same webpack config
 */
export function dedupEnvs(contexts: ExecutionContext[]) {
  const groupedEnvs: GroupIdContextMap = {};

  contexts.forEach((context) => {
    const envId = context.env?.getDevEnvId();
    if (!envId) return;
    if (!(envId in groupedEnvs)) groupedEnvs[envId] = [];
    groupedEnvs[envId].push(context);
  });

  return groupedEnvs;
}
