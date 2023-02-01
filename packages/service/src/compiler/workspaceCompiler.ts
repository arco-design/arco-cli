import { join } from 'path';
import mapSeries from 'p-map-series';
import { PubsubMain } from '@arco-cli/core/dist/pubsub';
import { Workspace } from '@arco-cli/aspect/dist/workspace';
import { EnvsMain } from '@arco-cli/aspect/dist/envs';
import { WorkspaceNotFoundError } from '@arco-cli/aspect/dist/workspace/exceptions';
import { Component } from '@arco-cli/aspect/dist/component';
import { Logger } from '@arco-cli/core/dist/logger';
import { DEFAULT_DIST_DIRNAME } from '@arco-cli/legacy/dist/constants';
import {
  Dist,
  AbstractVinyl,
  DataToPersist,
  RemovePath,
} from '@arco-cli/legacy/dist/workspace/component/sources';

import { CompilationInitiator, CompileError, Compiler } from './types';
import { CompilerAspect } from './compiler.aspect';
import { CompilerErrorEvent, ComponentCompilationOnDoneEvent } from './events';

export type CompileOptions = {
  /**
   * compile only new and modified components
   */
  changed?: boolean;
  /**
   *  show more data, such as, dist paths
   */
  verbose?: boolean;
  /**
   * whether the dist root dir should be deleted before writing new dist.
   * defaults to true for `arco compile` and false everywhere else to avoid webpack "EINTR" error.
   */
  deleteDistDir?: boolean;
  /**
   * describes where the compilation is coming from
   */
  initiator: CompilationInitiator;
};

export type BuildResult = { component: string; buildResults: string[] | null | undefined };

export class ComponentCompiler {
  constructor(
    private pubsub: PubsubMain,
    private logger: Logger,
    private workspace: Workspace,
    private component: Component,
    private compilerId: string,
    private compilerInstance: Compiler,
    private dists: Dist[] = [],
    private compileErrors: CompileError[] = []
  ) {}

  private throwOnCompileErrors(noThrow = true) {
    if (this.compileErrors.length) {
      this.compileErrors.forEach((errorItem) => {
        this.logger.error(`compilation error at ${errorItem.path}`, errorItem.error);
      });
      const formatError = (errorItem) => `${errorItem.path}\n${errorItem.error}`;
      const err = new Error(`compilation failed. see the following errors from the compiler
${this.compileErrors.map(formatError).join('\n')}`);

      this.pubsub.pub(CompilerAspect.id, new CompilerErrorEvent(err));

      if (!noThrow) {
        throw err;
      }

      this.logger.console(err.message);
    }
  }

  private async distDirs(): Promise<string[]> {
    const distDirName = this.compilerInstance.getDistDir?.() || DEFAULT_DIST_DIRNAME;
    return [this.component.packageDir].map((dist) => join(dist, distDirName));
  }

  private async compileOneFile(
    file: AbstractVinyl,
    initiator: CompilationInitiator
  ): Promise<void> {
    let compileResults;

    const isFileSupported = this.compilerInstance.isFileSupported(file.path);
    if (isFileSupported) {
      try {
        const options = {
          componentDir: this.component.componentDir,
          filePath: file.relative,
          initiator,
        };
        compileResults = this.compilerInstance.transpileFile?.(file.contents.toString(), options);
      } catch (error: any) {
        this.compileErrors.push({ path: file.path, error });
        return;
      }
    }

    for (const base of await this.distDirs()) {
      if (isFileSupported && compileResults) {
        this.dists.push(
          ...compileResults.map(
            (result) =>
              new Dist({
                base,
                path: join(base, result.outputPath),
                contents: Buffer.from(result.outputText),
              })
          )
        );
      } else {
        // compiler doesn't support this file type. copy the file as is to the dist dir.
        this.dists.push(
          new Dist({ base, path: join(base, file.relative), contents: file.contents })
        );
      }
    }
  }

  async compile(noThrow: boolean, options: CompileOptions): Promise<BuildResult> {
    noThrow = typeof noThrow === 'boolean' ? noThrow : true;

    // delete dist dir before compile
    let dataToPersist: DataToPersist;
    const deleteDistDir = options.deleteDistDir ?? this.compilerInstance.deleteDistDir;
    if (deleteDistDir) {
      dataToPersist = new DataToPersist();
      for (const distDir of await this.distDirs()) {
        dataToPersist.removePath(new RemovePath(distDir));
      }
      dataToPersist.addBasePath(this.workspace.path);
      await dataToPersist.persistAllToFS();
    }

    // might be multi-compiler
    const compilers: Compiler[] = (this.compilerInstance as any).compilers || [
      this.compilerInstance,
    ];
    const canTranspileFile = compilers.find((c) => c.transpileFile);
    const canTranspileComponent = compilers.find((c) => c.transpileComponent);

    if (canTranspileFile) {
      await Promise.all(
        this.component.files.map((file) => this.compileOneFile(file, options.initiator))
      );
    }

    if (canTranspileComponent) {
      // TODO compile component
      // await this.compileAllFiles();
    }

    if (!canTranspileFile && !canTranspileComponent) {
      throw new Error(
        `compiler ${this.compilerId.toString()} doesn't implement either "transpileFile" or "transpileComponent" methods`
      );
    }

    this.throwOnCompileErrors(noThrow);

    // persist dist files
    dataToPersist = new DataToPersist();
    dataToPersist.addManyFiles(this.dists);
    dataToPersist.addBasePath(this.workspace.path);
    await dataToPersist.persistAllToFS();

    const buildResults = this.dists.map((distFile) => distFile.path);
    this.pubsub.pub(
      CompilerAspect.id,
      new ComponentCompilationOnDoneEvent(this.compileErrors, this.component, buildResults)
    );
    return { component: this.component.id, buildResults };
  }
}

export class WorkspaceCompiler {
  constructor(
    private pubsub: PubsubMain,
    private logger: Logger,
    private workspace: Workspace,
    private envs: EnvsMain
  ) {}

  async compileComponents(
    componentNames: string[], // when empty, it compiles new + modified (unless options.all is set),
    options: CompileOptions,
    noThrow?: boolean
  ): Promise<BuildResult[]> {
    if (!this.workspace) throw new WorkspaceNotFoundError();

    const componentCompilers: ComponentCompiler[] = [];
    const components: Component[] = componentNames.length
      ? await this.workspace.getMany(componentNames)
      : options?.changed
      ? await this.workspace.getNewAndModified()
      : await this.workspace.list();

    // we reduce the list size of components need to compile according to componentDir
    // no need to repeat the compile process multiple times if the components have the same root directory
    const uniqueComponents: Component[] = [];
    for (const component of components) {
      if (!uniqueComponents.find((com) => com.componentDir === component.componentDir)) {
        uniqueComponents.push(component);
      }
    }

    uniqueComponents.forEach((component) => {
      const environment = this.envs.getEnv(component).env;
      const compilerInstance = environment.getCompiler?.();
      if (compilerInstance) {
        const compilerName = compilerInstance.constructor.name || 'compiler';
        componentCompilers.push(
          new ComponentCompiler(
            this.pubsub,
            this.logger,
            this.workspace,
            component,
            compilerName,
            compilerInstance
          )
        );
      }
    });

    const resultOnWorkspace = await mapSeries(componentCompilers, (compiler) =>
      compiler.compile(noThrow, options)
    );

    return resultOnWorkspace;
  }
}
