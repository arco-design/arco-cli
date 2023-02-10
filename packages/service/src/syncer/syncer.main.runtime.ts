import { CLIAspect, CLIMain, MainRuntime } from '@arco-cli/core/dist/cli';
import { LoggerAspect, LoggerMain, Logger } from '@arco-cli/core/dist/logger';
import { WorkspaceAspect, Workspace } from '@arco-cli/aspect/dist/workspace';
import { DocsAspect, DocsMain } from '@arco-cli/aspect/dist/docs';
import { Component } from '@arco-cli/aspect/dist/component';
import request from '@arco-cli/legacy/dist/cli/request';
import { ComponentResult } from '@arco-cli/legacy/dist/workspace/componentResult';

import { SyncerAspect } from './syncer.aspect';
import { SyncCmd } from './sync.cmd';
import { SyncParams } from './type/syncParams';

export class SyncerMain {
  static runtime = MainRuntime;

  static dependencies = [LoggerAspect, CLIAspect, WorkspaceAspect, DocsAspect];

  static provider([loggerMain, cli, workspace, docs]: [LoggerMain, CLIMain, Workspace, DocsMain]) {
    const logger = loggerMain.createLogger(SyncerAspect.id);
    const syncer = new SyncerMain(logger, docs);
    cli.register(new SyncCmd(logger, syncer, workspace));
    return syncer;
  }

  constructor(private logger: Logger, private docs: DocsMain) {}

  async sync(components: Component[]): Promise<ComponentResult[]> {
    const results: ComponentResult[] = [];
    await Promise.all(
      components.map(async (component) => {
        const syncResult: ComponentResult = {
          id: component.id,
          errors: [],
        };
        const doc = this.docs.getDoc(component);
        const meta: SyncParams = {
          name: component.id,
          title: doc.title || component.name,
          description: doc.description,
          category: doc.labels,
          repository: doc.repository,
          // TODO group and author
          group: 0,
          author: '',
          package: {
            name: component.packageName,
            version: component.version,
            peerDependencies: Object.keys(component.peerDependencies),
          },
          outline: doc.outline as any,
          _generation: 2,
        };

        let error = null;
        const longProcessLogger = this.logger.createLongProcessLogger(
          `sync ${component.id} to material market`
        );

        try {
          const { ok, msg } = await request.post('material/create', { meta });
          if (!ok) {
            error = msg;
          }
        } catch (err) {
          error = err.toString();
        }

        longProcessLogger.end();

        if (error) {
          syncResult.errors.push(error);
          this.logger.consoleFailure();
        } else {
          this.logger.consoleSuccess();
        }

        results.push(syncResult);
      })
    );

    return results;
  }
}

SyncerAspect.addRuntime(SyncerMain);
