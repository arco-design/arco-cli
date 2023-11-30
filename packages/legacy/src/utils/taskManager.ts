type TaskType = () => Promise<any>;

export class TaskManager {
  parallelTaskCount = 1;

  runningTaskCount = 0;

  tasks: TaskType[] = [];

  triggerQueue: ((_?) => void)[] = [];

  triggerEnd = (_?) => {};

  constructor(params: { parallelTaskCount?: number; tasks?: TaskType[] }) {
    const { parallelTaskCount, tasks } = params;
    this.tasks = tasks;
    this.parallelTaskCount = parallelTaskCount;
  }

  runAll() {
    return new Promise((resolve) => {
      while (this.tasks.length) {
        this.next();
      }
      this.triggerEnd = resolve;
      this.runAll = () => null;
    });
  }

  private next() {
    const task = this.tasks.shift();
    if (task) {
      if (this.runningTaskCount < this.parallelTaskCount) {
        this.runningTaskCount++;
        task().finally(() => this.onTaskDone());
      } else {
        new Promise((resolve) => {
          this.triggerQueue.push(resolve);
        })
          .then(() => {
            return task();
          })
          .finally(() => this.onTaskDone());
      }
    }
  }

  private onTaskDone() {
    this.runningTaskCount--;
    const nextTrigger = this.triggerQueue.shift();

    if (nextTrigger) {
      this.runningTaskCount++;
      nextTrigger();
    }

    if (this.runningTaskCount === 0) {
      this.triggerEnd();
    }
  }
}
