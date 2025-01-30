import { MongoClient, Db, Collection } from "mongodb";

import type { Repository, Storage } from "@daydreamsai/storage";

export class MongoDb implements Storage {
    private client: MongoClient;
    private db: Db;
    private repositories: Record<string, MongoCollection> = {};

    constructor(uri: string, dbName: string) {
        this.client = new MongoClient(uri);
        this.db = this.client.db(dbName);
    }

    public async connect(): Promise<void> {
        if (!this.client.listenerCount("connect")) {
            await this.client.connect();
        }
    }

    public close(): Promise<void> {
        return this.client.close();
    }

    public async migrate(): Promise<void> {
        // this.collections[SCHEDULED_TASKS] = this.db.collection(SCHEDULED_TASKS);
        // this.collections[ORCHESTRATORS] = this.db.collection(ORCHESTRATORS);
        // await Promise.all([
        //     this.collections[SCHEDULED_TASKS].createIndex({ nextRunAt: 1 }),
        //     this.collections[SCHEDULED_TASKS].createIndex({ status: 1 }),
        //     this.collections[ORCHESTRATORS].createIndex({ userId: 1 }),
        // ]);
    }

    public getRepository(kind: string): Repository {
        if (!this.repositories[kind]) {
            this.repositories[kind] = new MongoCollection(this.db, kind);
        }
        return this.repositories[kind];
    }
}

export class MongoCollection implements Repository {
    private collection: Collection<any>;

    constructor(mongodb: Db, kind: string) {
        this.collection = mongodb.collection(kind);
    }

    public async insert<T>(data: T): Promise<string> {
        const result = await this.collection.insertOne(data);
        return result.insertedId.toString();
    }

    public async update(id: string, data: Record<string, any>): Promise<void> {
        await this.collection.updateOne({ _id: id }, { $set: data });
    }

    public async find<T>(query: Record<string, any>): Promise<T[]> {
        return this.collection.find(query).toArray();
    }

    public async delete(id: string): Promise<void> {
        await this.collection.deleteOne({ _id: id });
    }

    public async deleteAll(): Promise<void> {
        await this.collection.deleteMany({});
    }
}
