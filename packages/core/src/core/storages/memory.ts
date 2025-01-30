import type { Storage, Repository } from "@daydreamsai/storage";

export class MemoryStorage implements Storage {
    private repositories: Record<string, MemoryCollection> = {};

    public getRepository(kind: string): Repository {
        if (!this.repositories[kind]) {
            this.repositories[kind] = new MemoryCollection();
        }
        return this.repositories[kind];
    }
}

export class MemoryCollection {
    private data: Record<string, any> = {};

    public async insert<T>(data: T): Promise<string> {
        const id = Math.random().toString(36).substr(2, 9);
        this.data[id] = data;
        return id;
    }

    public async update(id: string, data: Record<string, any>): Promise<void> {
        this.data[id] = { ...this.data[id], ...data };
    }

    public async find<T>(query: Record<string, any>): Promise<T[]> {
        return Object.values(this.data).filter((item) => {
            for (const key in query) {
                if (query[key] !== item[key]) {
                    return false;
                }
            }
            return true;
        }) as T[];
    }

    public async delete(id: string): Promise<void> {
        delete this.data[id];
    }

    public async deleteAll(): Promise<void> {
        this.data = {};
    }
}
