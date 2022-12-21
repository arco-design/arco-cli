import { join } from 'path';
import globby from 'globby';
import { flatten } from 'lodash';
import { Component, ComponentMap } from '@arco-cli/component';
import { ArtifactDefinition } from './artifactDefinition';
import type { BuildContext, BuildTask } from '../buildTask';
import { FsArtifact } from './fsArtifact';

export class ArtifactFactory {
  private toComponentMap(context: BuildContext, artifactMap: [string, FsArtifact][]) {
    return ComponentMap.as<FsArtifact[]>(context.components, (component) => {
      const id = component.id;
      return artifactMap.filter(([targetId]) => targetId === id).map(([, artifact]) => artifact);
    });
  }

  private resolvePaths(root: string, def: ArtifactDefinition): string[] {
    const patternsFlattened = flatten(def.globPatterns);
    const paths = globby.sync(patternsFlattened, { cwd: root });
    return paths;
  }

  private getRootDir(rootDir: string, def: ArtifactDefinition) {
    if (!def.rootDir) return rootDir;
    return join(rootDir, def.rootDir);
  }

  createFromComponent(
    component: Component,
    def: ArtifactDefinition,
    task: BuildTask
  ): FsArtifact | undefined {
    const contextPath = component.packageDir;
    const rootDir = this.getRootDir(contextPath, def);
    const paths = this.resolvePaths(rootDir, def);
    if (!paths || !paths.length) {
      return undefined;
    }
    return new FsArtifact(def, new ArtifactFiles(paths), task, rootDir);
  }

  /**
   * generate artifacts from a build context according to the spec defined in the artifact definitions.
   */
  generate(
    context: BuildContext,
    defs: ArtifactDefinition[],
    task: BuildTask
  ): ComponentMap<FsArtifact[]> {
    const tupleArr: [string, FsArtifact][] = [];

    defs.forEach((def) => {
      return context.components.forEach((component) => {
        const artifact = this.createFromComponent(component, def, task);
        if (artifact) {
          tupleArr.push([component.id, artifact]);
        }
      });
    });

    return this.toComponentMap(context, tupleArr);
  }
}
