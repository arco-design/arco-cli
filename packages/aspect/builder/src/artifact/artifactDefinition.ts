export type ArtifactDefinition = {
  /**
   * name of the artifact.
   * e.g. a project might utilize two different artifacts for the same typescript compiler, one
   * that generates ES5 files and another for ES6, this prop helps to distinguish between the two.
   */
  name: string;

  /**
   * aspect id that created the artifact. sometimes it's not the same as the task.id.
   */
  generatedBy?: string;

  /**
   * description of the artifact.
   */
  description?: string;

  /**
   * glob patterns of files to include upon artifact creation. minimatch is used to match the patterns.
   * e.g. ['*.ts', '!foo.ts'] matches all ts files but ignores foo.ts.
   */
  globPatterns?: string[];

  /**
   * directories of files to include upon artifact creation. minimatch is used to match the patterns.
   * e.g. ['/tmp'] will include all files from tmp dir
   */
  directories?: string[];

  /**
   * define the root directory for reading the artifacts from the capsule file system.
   * the rootDir must be unique per artifacts, otherwise we risk overriding data between artifacts.
   */
  rootDir?: string;

  /**
   * adds a directory prefix for all artifact files.
   */
  dirPrefix?: string;

  /**
   * determine the context of the artifact.
   * default artifact context is `component`.
   * "env" is useful when the same file is generated for all components, for example, "preview"
   * task may create the same webpack file for all components of that env.
   */
  context?: 'component' | 'env';
};
