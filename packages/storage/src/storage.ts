import type { Repository } from "./repository";

export interface Storage {
    getRepository(kind: string): Repository;
}
