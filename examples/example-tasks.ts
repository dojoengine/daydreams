import {KeyValueDB} from "../packages/core/src/core/tasks-db";
import chalk from "chalk";

async function main() {

  const taskDb = new KeyValueDB(
    "mongodb://localhost:27017",
    "myApp",
  );

  await taskDb.connect();


  // // Store a task
  const now = new Date();
  await taskDb.createTask({
    status: "pending",
    type: "scheduled",
    updatedAt: now,
    createdAt: now,
    scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours from now,
    metadata: { description: "Sample task" },
  });

  // Fetch and execute pending scheduled tasks
  const tasks = await taskDb.fetchTasks("scheduled", "pending");
  for (const task of tasks) {
    await taskDb.executeTask(task._id);
  }

  console.log(tasks);

  // Store a message thread
  await taskDb.storeMessageThread("thread_001", "user_123", [
    {
      messageId: "msg_001",
      content: "Hello!",
      timestamp: new Date(),
    },
    {
      messageId: "msg_002",
      content: "How can I help?",
      timestamp: new Date(),
    },
  ]);

  // Fetch a message thread
  const thread = await taskDb.fetchMessageThread("thread_001");
  console.log("Fetched thread:", thread);
}

// Run the example
main().catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});
