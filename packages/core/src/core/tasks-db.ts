import {MongoClient, Collection, type ObjectId} from "mongodb";

interface Task {
  _id?: ObjectId;
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
  private cache: Map<ObjectId, Task>; // In-memory cache

  constructor(private uri: string, private dbName: string = "myApp") {
    this.client = new MongoClient(uri);
    this.cache = new Map<ObjectId, Task>();
  }

  /**
   * Connects to the MongoDB server and initializes
   * 1. tasks collection.
   * 2. threads collection
   */
  public async connect(): Promise<void> {
    if (!this.client.listenerCount("connect")) {
      await this.client.connect();
    }

    const db = this.client.db(this.dbName);
    this.tasksCollection = db.collection<Task>("tasks");
    this.threadsCollection = db.collection<MessageThread>("message_threads");
  }

  /**
   * Cache a task
   * */
  private cacheTask(task: Task): void {
    this.cache.set(<ObjectId>task._id, task);
  }

  /**
   *  Fetch from cache or database
   * */
  private async fetchTaskFromCacheOrDB(taskId: ObjectId): Promise<Task | null> {
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
   * Create a new task (updates cache and DB)
   * */
  async createTask(taskData: Task): Promise<ObjectId> {
    const result = await this.tasksCollection.insertOne(
      taskData
    );

    // Update the cache
    this.cacheTask(taskData);

    return result.insertedId;
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
  async fetchTask(taskId: ObjectId): Promise<Task | null> {
    return this.fetchTaskFromCacheOrDB(taskId);
  }

  // Execute a task and mark it as completed (cache and DB consistency)
  async executeTask(taskId: ObjectId): Promise<void> {
    const task = await this.fetchTaskFromCacheOrDB(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    // Simulate task execution
    console.log(`Executing task:, ${task}`);

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

    await this.threadsCollection.updateOne(
      { _id: threadId },
      { $set: threadData },
      { upsert: true }
    );
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