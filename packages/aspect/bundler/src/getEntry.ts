import { ExecutionContext } from '@arco-cli/envs';
import { BrowserRuntimeSlot } from './bundler.main.runtime';

/**
 * computes the bundler entry.
 */
export async function getEntry(
  context: ExecutionContext,
  runtimeSlot: BrowserRuntimeSlot
): Promise<string[]> {
  const slotEntries = await Promise.all(
    runtimeSlot.values().map(async (browserRuntime) => browserRuntime.entry(context))
  );

  const slotPaths = slotEntries.reduce((acc, current) => {
    acc = acc.concat(current);
    return acc;
  });

  return slotPaths;
}
