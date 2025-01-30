export interface Repository {
    insert<T>(data: T): Promise<string>;
    update(id: string, data: Record<string, any>): Promise<void>;
    find<T>(query: Record<string, any>): Promise<T[]>;
    delete(id: string): Promise<void>;
    deleteAll(): Promise<void>;
}
