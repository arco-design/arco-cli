import type { TaskDescriptor } from '../buildTask';
import type { ArtifactDefinition } from './artifactDefinition';

export class Artifact {
  constructor(
    /**
     * definition of the artifact.
     */
    readonly def: ArtifactDefinition,

    readonly files: ArtifactFiles,
    /**
     * the declaring task.
     */
    readonly task: TaskDescriptor,
    /**
     * timestamp of the artifact creation.
     */
    readonly timestamp: number = Date.now()
  ) {}

  /**
   * name of the artifact.
   */
  get name(): string {
    return this.def.name;
  }

  /**
   * description of the artifact.
   */
  get description() {
    return this.def.description;
  }

  /**
   * aspect id (string) that generated the artifact
   */
  get generatedBy(): string {
    return this.def.generatedBy || this.task.aspectId;
  }

  isEmpty(): boolean {
    return this.files.isEmpty();
  }

  /**
   * archive all artifact files into a tar.
   */
  tar() {}

  toObject(): ArtifactObject {
    return {
      name: this.name,
      description: this.description,
      generatedBy: this.generatedBy,
      task: {
        id: this.task.aspectId,
        name: this.task.name,
      },
      files: this.files,
    };
  }

  static fromArtifactObject(object: ArtifactObject): Artifact {
    const artifactDef: ArtifactDefinition = {
      name: object.name,
      generatedBy: object.generatedBy,
      description: object.description,
    };

    const task: TaskDescriptor = {
      aspectId: object.task.id,
      name: object.task.name,
    };

    return new Artifact(artifactDef, object.files, task);
  }
}
