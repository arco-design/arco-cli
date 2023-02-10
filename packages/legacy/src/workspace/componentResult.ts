import chalk from 'chalk';

export type Serializable = {
  toString(): string;
};

export type TaskMetadata = { [key: string]: Serializable };

export type ComponentResult = {
  /**
   * component id
   */
  id: string;

  /**
   * metadata generated during task
   */
  metadata?: TaskMetadata;

  /**
   * returning errors from tasks will cause a pipeline failure and logs all returned errors.
   */
  errors?: Array<Error | string>;

  /**
   * warnings generated throughout the build task.
   */
  warnings?: string[];

  /**
   * timestamp in milliseconds when the task started
   */
  startTime?: number;

  /**
   * timestamp in milliseconds when the task ended
   */
  endTime?: number;
};

/**
 * Format component errors to human-readable
 */
export function formatComponentResultError(componentResults: ComponentResult[]): string {
  const componentErrors: string[] = [];
  let totalErrors = 0;
  let totalFailed = 0;

  componentResults.forEach((result) => {
    const { id, errors } = result;
    if (!errors.length) return;

    totalErrors += errors.length;
    totalFailed += 1;
    const title = chalk.bold(`Failed component ${totalFailed}: "${id}"\n`);
    componentErrors.push(`${title}${errors.join('\n')}`);
  });

  if (!componentErrors.length) return null;

  const title = `\nThe following errors were found\n`;
  const errorsStr = componentErrors.join('\n\n');
  const totalSucceed = componentResults.length - totalFailed;
  const summery = `\n\n\n✖ Total ${componentResults.length} components. ${totalSucceed} succeed. ${totalFailed} failed. Total errors: ${totalErrors}`;

  return title + errorsStr + summery;
}
