import { CLIAspect, CLIMain, MainRuntime } from '@arco-cli/core/dist/cli';
import { WorkspaceAspect, Workspace } from '@arco-cli/aspect/dist/workspace';

import { ListAspect } from './list.aspect';
import { ListCmd } from './list.cmd';

export class ListMain {
  static runtime = MainRuntime;

  static dependencies = [CLIAspect, WorkspaceAspect];

  static provider([cli, workspace]: [CLIMain, Workspace]) {
    console.log('test');

    const list = new ListMain(workspace);

    cli.register(new ListCmd(list));

    return list;
  }

  constructor(private workspace: Workspace) {}

  getWorkspaceComponents(componentPattern?: string) {
    return this.workspace.getManyByPattern(componentPattern);
  }
}

ListAspect.addRuntime(ListMain);
