import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskRunner, task } from "./task";

describe("TaskRunner", () => {
  let runner: TaskRunner;

  beforeEach(() => {
    runner = new TaskRunner(2); // Create runner with concurrency of 2
  });

  it("should execute tasks in order with proper concurrency", async () => {
    const executionOrder: number[] = [];

    // Queue all tasks at once with same priority
    // First two tasks should start executing immediately due to concurrency of 2
    const tasks = await Promise.all([
      // Long task - should finish last
      runner.enqueue(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
        executionOrder.push(0);
      }, 1),
      // Short task - should finish first
      runner.enqueue(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        executionOrder.push(1);
      }, 1),
      // Medium task - should finish second
      runner.enqueue(async () => {
        await new Promise((resolve) => setTimeout(resolve, 75));
        executionOrder.push(2);
      }, 1),
    ]);

    await Promise.all(tasks);
    // Should complete in order of duration: 50ms, 75ms, 100ms
    expect(executionOrder).toEqual([1, 2, 0]);
  });

  it("should respect priority ordering", async () => {
    const executionOrder: number[] = [];
    const complete = new Promise((resolve) => {
      let count = 0;
      const checkComplete = () => {
        count++;
        if (count === 3) resolve(undefined);
      };

      // Queue tasks with different priorities
      runner.enqueue(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        executionOrder.push(0);
        checkComplete();
      }, 2); // medium priority

      runner.enqueue(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        executionOrder.push(1);
        checkComplete();
      }, 3); // highest priority

      runner.enqueue(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        executionOrder.push(2);
        checkComplete();
      }, 1); // lowest priority
    });

    await complete;
    expect(executionOrder).toEqual([1, 0, 2]);
  });

  it("should handle errors properly", async () => {
    const errorTask = runner.enqueue(async () => {
      throw new Error("Task failed");
    });

    await expect(errorTask).rejects.toThrow("Task failed");
  });

  it("should maintain concurrency limit", async () => {
    const running = new Set<number>();
    const maxConcurrent = { value: 0 };
    let completed = 0;

    // Create an array of promises that we'll use to track task completion
    const taskPromises = Array.from({ length: 5 }, (_, i) => {
      return runner.enqueue(async () => {
        running.add(i);
        maxConcurrent.value = Math.max(maxConcurrent.value, running.size);
        await new Promise((resolve) => setTimeout(resolve, 20));
        running.delete(i);
        completed++;
      });
    });

    await Promise.all(taskPromises);

    expect(maxConcurrent.value).toBe(2); // Should never exceed concurrency limit
    expect(completed).toBe(5); // All tasks should complete
  });

  it("should process queue in priority order", async () => {
    const order: number[] = [];
    const complete = new Promise<void>((resolve) => {
      let count = 0;
      const checkComplete = () => {
        count++;
        if (count === 4) resolve();
      };

      // Queue all tasks at once with different priorities
      // No delays to ensure pure priority ordering
      runner.enqueue(async () => {
        order.push(0);
        checkComplete();
      }, 1); // low priority

      runner.enqueue(async () => {
        order.push(1);
        checkComplete();
      }, 3); // highest priority

      runner.enqueue(async () => {
        order.push(2);
        checkComplete();
      }, 2); // medium priority

      runner.enqueue(async () => {
        order.push(3);
        checkComplete();
      }, 0); // lowest priority
    });

    await complete;
    // Should execute in order of priority: highest (3) to lowest (0)
    expect(order).toEqual([1, 2, 0, 3]);
  });
});

describe("task function", () => {
  let runner: TaskRunner;

  beforeEach(() => {
    runner = new TaskRunner(1);
  });

  it("should create a task with proper context", async () => {
    const mockFn = vi.fn();
    const testTask = task(
      "test-task",
      async (params: { value: number }, ctx) => {
        mockFn(params, ctx.callId);
        return params.value * 2;
      }
    );

    const result = await runner.enqueueTask(testTask, { value: 5 });

    expect(result).toBe(10);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn.mock.calls[0][0]).toEqual({ value: 5 });
    expect(typeof mockFn.mock.calls[0][1]).toBe("string"); // callId should be a string
  });

  it("should handle task options", async () => {
    const debugFn = vi.fn();
    const testTask = task(
      "test-task",
      async (params: { value: number }, ctx) => {
        ctx.debug("test-task", ["test"], params);
        return params.value;
      },
      { debug: debugFn }
    );

    await runner.enqueueTask(testTask, { value: 5 }, { priority: 2 });

    expect(debugFn).toHaveBeenCalledWith("test-task", ["test"], { value: 5 });
  });

  it("should merge default options with call options", async () => {
    const defaultDebug = vi.fn();
    const callDebug = vi.fn();

    const testTask = task(
      "test-task",
      async (params: { value: number }, ctx) => {
        ctx.debug("test-task", ["debug"], params);
        return params.value;
      },
      { debug: defaultDebug }
    );

    await runner.enqueueTask(testTask, { value: 5 }, { debug: callDebug });

    expect(defaultDebug).not.toHaveBeenCalled();
    expect(callDebug).toHaveBeenCalledWith("test-task", ["debug"], {
      value: 5,
    });
  });

  it("should handle errors in tasks", async () => {
    const testTask = task("test-task", async () => {
      throw new Error("Task error");
    });

    await expect(runner.enqueueTask(testTask, {})).rejects.toThrow(
      "Task error"
    );
  });

  it("should allow direct execution without runner", async () => {
    const testTask = task("test-task", async (params: { value: number }) => {
      return params.value * 2;
    });

    const result = await testTask({ value: 5 });
    expect(result).toBe(10);
  });

  it("should work with both direct and enqueued execution", async () => {
    const executionOrder: number[] = [];
    const testTask = task("test-task", async (params: { value: number }) => {
      await new Promise((resolve) => setTimeout(resolve, params.value));
      executionOrder.push(params.value);
      return params.value;
    });

    // Direct execution
    const direct = testTask({ value: 50 });

    // Enqueued execution
    const enqueued = runner.enqueueTask(testTask, { value: 25 });

    await Promise.all([direct, enqueued]);
    expect(executionOrder).toEqual([25, 50]); // Enqueued task should finish first due to shorter timeout
  });
});
