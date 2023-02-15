import chalk from 'chalk';
import { LegacyCommand } from '../../legacyCommand';
import { Group } from '../../commandGroups';
import { setSync, getSync, delSync } from '../../../globalConfig';
import { CFG_HOST_ARCO_KEY, DEFAULT_HOST_ARCO } from '../../../constants';
import { CommandOptions } from '../../command';

export class Host implements LegacyCommand {
  name = 'host [host-name]';

  description = 'set host of Arco';

  arguments = [
    {
      name: 'host-name',
      description: `switch host of Arco, depends on the version of material market you want to use (defaults to ${DEFAULT_HOST_ARCO})`,
    },
  ];

  options = [['', 'reset', `reset host of Arco to ${DEFAULT_HOST_ARCO}`]] as CommandOptions;

  group: Group = 'general';

  alias = '';

  skipWorkspace = true;

  async action([hostName]: [string], options: { reset: boolean }) {
    if (hostName) {
      setSync({ [CFG_HOST_ARCO_KEY]: hostName });
      return hostName;
    }

    if (options.reset) {
      delSync(CFG_HOST_ARCO_KEY);
    }

    return null;
  }

  report(newHostName: string): string {
    const currentHostName = newHostName || getSync(CFG_HOST_ARCO_KEY);
    const resetHostTip =
      currentHostName === DEFAULT_HOST_ARCO ? '' : `, reset it to default via 'arco host --reset'`;
    return chalk.green(`host of Arco has been set to ${currentHostName}${resetHostTip}`);
  }
}
