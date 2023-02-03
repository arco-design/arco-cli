import type { Component } from '@arco-cli/aspect/dist/component';
import { ExecutionContext } from '@arco-cli/aspect/dist/envs';
import { Workspace } from '@arco-cli/aspect/dist/workspace';
import { ComponentResult } from '@arco-cli/legacy/dist/workspace/componentResult';

import { TaskResultsList } from './taskResultsList';
import { TaskResults } from './buildPipe';

export type TaskLocation = 'start' | 'end';

/**
 * delimiter between task.aspectId and task.name
 */
export const TaskIdDelimiter = ':';

/**
 * A folder to write artifacts generated during a build task
 * This folder is used in the core envs and excluded by default from the package tar file
 */
export const ARTIFACTS_DIR = 'artifacts';

export interface BuildTaskResult {
  /**
   * build results for each of the components in the build context.
   */
  componentsResults: ComponentResult[];
}

export interface BuildContext extends ExecutionContext {
  /**
   * Workspace path for build
   */
  workspace: Workspace;

  /**
   * all components about to be built/tagged.
   */
  components: Component[];

  /**
   * data generated by tasks that were running before this task
   */
  previousTasksResults: TaskResults[];
}

export interface TaskDescriptor {
  aspectId: string;
  name?: string;
  description?: string;
}

export interface BuildTask {
  /**
   * aspect id serialized of the creator of the task.
   */
  aspectId: string;

  /**
   * name of the task. function as an identifier among other tasks of the same aspectId.
   * spaces and special characters are not allowed. as a convention, use UpperCamelCase style.
   * (e.g. TypescriptCompiler).
   */
  name: string;

  /**
   * description of what the task does.
   * if available, the logger will log it show it in the status-line.
   */
  description?: string;

  /**
   * where to put the task, before the env pipeline or after
   */
  location?: TaskLocation;

  /**
   * execute a task in a build context
   */
  execute(context: BuildContext): Promise<BuildTaskResult>;

  /**
   * run before the build pipeline has started. this is useful when some preparation are needed to
   * be done on all envs before the build starts.
   */
  preBuild?(context: BuildContext): Promise<void>;

  /**
   * run after the build pipeline completed for all envs. useful for doing some cleanup on the
   * capsules before the deployment starts.
   */
  postBuild?(context: BuildContext, tasksResults: TaskResultsList): Promise<void>;

  /**
   * needed if you want the task to be running only after the dependencies were completed
   * for *all* envs.
   * normally this is not needed because the build-pipeline runs the tasks in the same order
   * they're located in the `getBuildPipe()` array and according to the task.location.
   * the case where this is useful is when a task not only needs to be after another task, but also
   * after all environments were running that task.
   * a dependency is task.aspectId. if an aspect has multiple tasks, to be more specific, use
   * "aspectId:name", e.g. "arco.aspect/compiler:TypescriptCompiler".
   */
  dependencies?: string[];
}

export class BuildTaskHelper {
  static serializeId({ aspectId, name }: { aspectId: string; name: string }): string {
    return aspectId + TaskIdDelimiter + name;
  }

  static deserializeId(id: string): { aspectId: string; name: string } {
    const split = id.split(TaskIdDelimiter);
    if (split.length === 0) throw new Error(`deserializeId, ${id} is empty`);
    if (split.length === 1) throw new Error(`deserializeId, ${id} has only aspect-id without name`);
    if (split.length === 2) return { aspectId: split[0], name: split[1] };
    throw new Error(`deserializeId, id ${id} has more than one ${TaskIdDelimiter}`);
  }

  /**
   * don't throw an error when the id includes only the aspect-id without the task name.
   * useful for task dependencies, when it's allowed to specify the aspect-id only.
   */
  static deserializeIdAllowEmptyName(id: string): { aspectId: string; name?: string } {
    return id.includes(TaskIdDelimiter)
      ? BuildTaskHelper.deserializeId(id)
      : { aspectId: id, name: undefined };
  }
}
