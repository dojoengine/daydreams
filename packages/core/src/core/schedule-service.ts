import { Orchestrator } from "./orchestrator";
import { HandlerRole, type VectorDB } from "./types";
import type { Logger } from "./logger";
import type { ConversationManager } from "./conversation-manager";
import type { OrchestratorDb } from "./memory";

export interface IOrchestratorContext {
    logger: Logger;
    orchestratorDb: OrchestratorDb;
    conversationManager: ConversationManager;
    vectorDb: VectorDB;
}

export class SchedulerService {
    private intervalId?: ReturnType<typeof setInterval>;

    constructor(
        private context: IOrchestratorContext,
        private orchestrator: Orchestrator,
        private pollMs: number = 10_000
    ) {}

    public start() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        this.intervalId = setInterval(() => this.pollTasks(), this.pollMs);
        this.context.logger.info(
            "SchedulerService.start",
            `Scheduler started polling with pollMs: ${this.pollMs}`
        );
    }

    private async pollTasks() {
        try {
            const tasks = await this.context.orchestratorDb.findDueTasks();
            for (const task of tasks) {
                await this.context.orchestratorDb.markRunning(task._id);

                const handler = this.orchestrator.getHandler(task.handlerName);
                if (!handler) {
                    this.context.logger.warn("No handler found", "warn", {
                        name: task.handlerName,
                    });
                    continue;
                }

                // parse out data
                const data = JSON.parse(task.taskData.task_data);

                switch (handler.role) {
                    case HandlerRole.INPUT:
                        await this.orchestrator.dispatchToInput(
                            task.handlerName,

                            data
                        );
                        break;
                    case HandlerRole.ACTION:
                        await this.orchestrator.dispatchToAction(
                            task.handlerName,

                            data
                        );
                        break;
                    case HandlerRole.OUTPUT:
                        await this.orchestrator.dispatchToOutput(
                            task.handlerName,
                            data
                        );
                        break;
                }

                // handle recurring or complete
                if (task.intervalMs) {
                    await this.context.orchestratorDb.updateNextRun(
                        task._id,
                        new Date(Date.now() + task.intervalMs)
                    );
                } else {
                    await this.context.orchestratorDb.markCompleted(task._id);
                }
            }
        } catch (err) {
            this.context.logger.error("pollTasks error", "error", {
                data: err,
            });
        }
    }

    public async scheduleTaskInDb(
        userId: string,
        handlerName: string,
        data: Record<string, unknown> = {},
        intervalMs?: number
    ): Promise<string> {
        const now = Date.now();
        const nextRunAt = new Date(now + (intervalMs ?? 0));

        this.context.logger.info(
            "SchedulerService.scheduleTaskInDb",
            `Scheduling task ${handlerName}`,
            {
                nextRunAt,
                intervalMs,
            }
        );

        return await this.context.orchestratorDb.createTask(
            userId,
            handlerName,
            {
                request: handlerName,
                task_data: JSON.stringify(data),
            },
            nextRunAt,
            intervalMs
        );
    }

    public stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
}
