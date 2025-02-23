import { createGroq } from "@ai-sdk/groq";
import {
  type MemoryStore,
  createContainer,
  createDreams,
  createMemory,
  createMemoryStore,
  createVectorStore,
} from "@daydreamsai/core";
import { chat } from "./chat";

export const groq = createGroq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
});

const browserStorage = (): MemoryStore => {
  const memoryStore = createMemoryStore();
  return {
    async get<T>(key: string) {
      let data = await memoryStore.get<T>(key);
      if (data === null) {
        const local = localStorage.getItem(key);
        if (local) {
          data = JSON.parse(local);
          await memoryStore.set(key, data);
        }
      }

      return data;
    },
    async set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
      return memoryStore.set(key, value);
    },
    async clear() {
      // localStorage.
      return memoryStore.clear();
    },
    async delete(key) {
      return memoryStore.delete(key);
    },
  };
};

export function createAgent() {
  const memoryStorage = browserStorage();
  const container = createContainer();

  return createDreams({
    model: groq("deepseek-r1-distill-llama-70b"),
    container,
    memory: createMemory(memoryStorage, createVectorStore()),
    extensions: [chat],
  });
}
