import { v7 as randomUUIDv7 } from "uuid";
import type { Debugger } from "./types";

/**
 * Options for configuring a task.
 */
export type TaskOptions = {
  limit?: number;
  retry?: number;
  debug?: Debugger;
  priority?: number;
  callId?: string;
};

/**
 * Context provided to a task.
 */
export type TaskContext = {
  callId: string;
  debug: Debugger;
};

/**
 * A task function that takes parameters and options and returns a promise.
 */
export type Task<in Params, out Result> = (
  params: Params,
  options?: TaskOptions
) => Promise<Result>;

type InferTaskParams<T extends Task<any, any>> =
  T extends Task<infer Params, any> ? Params : unknown;
type InferTaskResult<T extends Task<any, any>> =
  T extends Task<any, infer Result> ? Result : unknown;

/**
 * Represents a task that is queued for execution.
 */
interface QueuedTask {
  id: string;
  execute: () => Promise<any>;
  priority: number;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

/**
 * Manages the execution of tasks with concurrency control.
 */
export class TaskRunner {
  private queue: QueuedTask[] = [];
  private running: Set<string> = new Set();
  private concurrency: number;
  private processing: boolean = false;

  /**
   * Creates a new TaskRunner instance.
   * @param concurrency - The maximum number of tasks to run concurrently.
   */
  constructor(concurrency: number = 1) {
    this.concurrency = concurrency;
  }

  /**
   * Sets the concurrency level for the task runner.
   * @param concurrency - The new concurrency level.
   */
  setConcurrency(concurrency: number) {
    this.concurrency = concurrency;
    this.processQueue();
  }

  /**
   * Processes the task queue, running tasks up to the concurrency limit.
   */
  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.queue.length > 0 && this.running.size < this.concurrency) {
        // Sort entire queue by priority
        this.queue.sort((a, b) => b.priority - a.priority);

        const task = this.queue.shift();
        if (!task) break;

        this.running.add(task.id);

        // Execute task without awaiting to allow concurrent execution
        task
          .execute()
          .then((result) => {
            task.resolve(result);
          })
          .catch((error) => {
            task.reject(error);
          })
          .finally(() => {
            this.running.delete(task.id);
            // Try to process more tasks after one completes
            this.processQueue();
          });
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Enqueues a task for execution.
   * @param taskFn - The function to execute as a task.
   * @param priority - The priority of the task.
   * @returns A promise that resolves when the task is completed.
   */
  enqueue<T>(taskFn: () => Promise<T>, priority: number = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      const queuedTask: QueuedTask = {
        id: randomUUIDv7(),
        execute: taskFn,
        priority,
        resolve,
        reject,
      };

      this.queue.push(queuedTask);
      // Use setTimeout to ensure proper task ordering
      setTimeout(() => this.processQueue(), 0);
    });
  }

  /**
   * Gets the number of active tasks.
   */
  get activeTasksCount(): number {
    return this.running.size;
  }

  /**
   * Gets the number of tasks in the queue.
   */
  get queuedTasksCount(): number {
    return this.queue.length;
  }

  /**
   * Enqueues a task function for execution.
   * @param taskFn - The task function to execute
   * @param params - Parameters to pass to the task
   * @param options - Task options including priority
   * @returns A promise that resolves when the task is completed
   */
  enqueueTask<TTask extends Task<any, any>>(
    taskFn: TTask,
    params: InferTaskParams<TTask>,
    options: TaskOptions = {}
  ): Promise<InferTaskResult<TTask>> {
    return this.enqueue(() => taskFn(params, options), options.priority ?? 0);
  }
}

/**
 * Creates a task function that can be executed or enqueued.
 * @param key - A unique key for the task.
 * @param fn - The function to execute as the task.
 * @param defaultOptions - Default options for the task.
 * @returns A task function that can be executed directly or enqueued.
 */
export function task<Params, Result>(
  key: string,
  fn: (params: Params, ctx: TaskContext) => Promise<Result>,
  defaultOptions?: Omit<TaskOptions, "callId">
): (params: Params, options?: TaskOptions) => Promise<Result> {
  async function execute(params: Params, options?: TaskOptions) {
    const callId = options?.callId ?? randomUUIDv7();

    const mergedOptions = {
      ...defaultOptions,
      ...options,
    };

    delete mergedOptions.callId;

    try {
      const res = await Promise.resolve(
        fn(params, {
          callId,
          debug: mergedOptions?.debug ?? (() => {}),
        })
      );
      return res;
    } catch (error) {
      throw error;
    }
  }

  return execute;
}
