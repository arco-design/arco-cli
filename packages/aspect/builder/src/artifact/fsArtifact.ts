import type { ArtifactDefinition } from './artifactDefinition';
import { Artifact } from './artifact';
import { TaskDescriptor } from '../buildTask';

export class FsArtifact extends Artifact {
  constructor(
    /**
     * definition of the artifact.
     */
    readonly def: ArtifactDefinition,

    readonly files: ArtifactFiles,

    readonly task: TaskDescriptor,

    readonly rootDir: string
  ) {
    super(def, files, task);
  }
}
