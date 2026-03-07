type QueueTask = () => Promise<void>;

interface QueueItem {
    task: QueueTask;
    resolve: () => void;
    reject: (err: Error) => void;
}

class TaskQueue {
    private queue: QueueItem[] = [];
    private running: number = 0;
    private maxConcurrency: number;

    constructor(maxConcurrency: number = 3) {
        this.maxConcurrency = maxConcurrency;
    }

    async add(task: QueueTask): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.processNext();
        });
    }

    private async processNext(): Promise<void> {
        if (this.running >= this.maxConcurrency || this.queue.length === 0) {
            return;
        }

        const item = this.queue.shift()!;
        this.running++;

        try {
            await item.task();
            item.resolve();
        } catch (err) {
            item.reject(err instanceof Error ? err : new Error(String(err)));
        } finally {
            this.running--;
            this.processNext();
        }
    }

    get pendingCount(): number {
        return this.queue.length;
    }

    get runningCount(): number {
        return this.running;
    }
}

export const taskQueue = new TaskQueue(3);
export default TaskQueue;
