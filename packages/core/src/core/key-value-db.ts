import { MongoClient, Collection } from "mongodb";

interface Task {
  _id: string;
  type: "ongoing" | "scheduled";
  status: "pending" | "completed";
  createdAt?: Date;
  updatedAt?: Date;
  scheduledFor?: Date;
  metadata?: Record<string, unknown>; // Additional details about the task
  output?: Record<string, unknown>; // Results of the task execution
}

interface Message {
  messageId: string;
  content: string;
  timestamp: Date;
}

interface MessageThread {
  _id: string;
  userId: string;
  messages: Message[];
  createdAt?: Date;
}

export class KeyValueDB {
  private client: MongoClient;
  private tasksCollection!: Collection<Task>;
  private threadsCollection!: Collection<MessageThread>;
  private cache: Map<string, Task>; // In-memory cache

  constructor(private uri: string, private dbName: string) {
    this.client = new MongoClient(uri);
    this.cache = new Map<string, Task>();
  }

  /**
   * Connects to the MongoDB server and initializes
   * 1. tasks collection.
   * 2. threads collection
   */
  async connect(): Promise<void> {
    await this.client.connect();
    const db = this.client.db(this.dbName);
    this.tasksCollection = db.collection<Task>("tasks");
    this.threadsCollection = db.collection<MessageThread>("message_threads");
  }

  /**
   * Cache a task
   * */
  private cacheTask(task: Task): void {
    this.cache.set(task._id, task);
  }

  /**
   *  Fetch from cache or database
   * */
  private async fetchTaskFromCacheOrDB(taskId: string): Promise<Task | null> {
    // Check the in-memory cache first
    if (this.cache.has(taskId)) {
      return this.cache.get(taskId)!;
    }

    // Fall back to the database
    const task = await this.tasksCollection.findOne({ _id: taskId });
    if (task) {
      this.cacheTask(task); // Populate the cache
    }
    return task;
  }

  /**
   *
   * Upsert a task (updates cache and DB)
   * */
  async createTask(taskId: string, taskData: Partial<Task>): Promise<void> {
    const now = new Date();
    const data = { ...taskData, updatedAt: now };
    if (!taskData.createdAt) {
      data.createdAt = now;
    }

    await this.tasksCollection.updateOne(
      { _id: taskId },
      { $set: data },
      { upsert: true } // If there is an existing task with this id - update it
    );

    // Update the cache
    const updatedTask = { ...data, _id: taskId } as Task;
    this.cacheTask(updatedTask);
  }

  /**
   * Fetch tasks by type and/or status (with cache population)
   *
   * @param taskType string;
   * @param status string;
   * */
  async fetchTasks(taskType?: string, status?: string): Promise<Task[]> {
    const query: Partial<Task> = {};
    if (taskType) query.type = taskType as Task["type"];
    if (status) query.status = status as Task["status"];

    const tasks = await this.tasksCollection.find(query).toArray();

    // Populate the cache
    tasks.forEach((task) => this.cacheTask(task));
    return tasks;
  }

  // Fetch a single task (uses cache)
  async fetchTask(taskId: string): Promise<Task | null> {
    return this.fetchTaskFromCacheOrDB(taskId);
  }

  // Execute a task and mark it as completed (cache and DB consistency)
  async executeTask(taskId: string): Promise<void> {
    const task = await this.fetchTaskFromCacheOrDB(taskId);
    if (!task) {
      throw new Error("Task with ID ${taskId} not found");
    }

    // Simulate task execution
    console.log("Executing task:, task");

    // Update task status
    const now = new Date();
    const updatedTask: Task = { ...task, status: "completed", updatedAt: now };
    await this.tasksCollection.updateOne({ _id: taskId }, { $set: { status: 'completed', updatedAt: now } });

    // Update the cache
    this.cacheTask(updatedTask);
  }

  // Store a message thread
  async storeMessageThread(
    threadId: string,
    userId: string,
    messages: Message[]
  ): Promise<void> {
    const threadData: MessageThread = {
      _id: threadId,
      userId,
      messages,
      createdAt: new Date(),
    };
    await this.threadsCollection.insertOne(threadData);
  }

  // Fetch a message thread by ID
  async fetchMessageThread(threadId: string): Promise<MessageThread | null> {
    return await this.threadsCollection.findOne({ _id: threadId });
  }

  /**
   * Closes the MongoDB client connection.
   */
  public async close(): Promise<void> {
    await this.client.close();
  }
}