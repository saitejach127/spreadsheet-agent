import { connectAndExtract, cleanData } from "./worker";

interface Task {
  taskId: string;
  type: "SEARCH" | "CLEAN";
  args: any[];
  socket: any; // Socket.io socket instance
}

// Simple in-memory queue to limit concurrency
const queue: Task[] = [];
let processingCount = 0;
const MAX_CONCURRENT = 3;

export function addToQueue(task: Task) {
  queue.push(task);
  processQueue();
}

async function processQueue() {
  if (processingCount >= MAX_CONCURRENT || queue.length === 0) {
    return;
  }

  const task = queue.shift();
  if (!task) return;

  processingCount++;
  
  try {
    let resultValue = "";
    
    if (task.type === "SEARCH") {
      const { text, source } = await connectAndExtract(task.args[0], task.args[1]);
      resultValue = text;
    } else if (task.type === "CLEAN") {
      resultValue = await cleanData(task.args[0], task.args[1]);
    }

    // Emit back to UI using taskId
    task.socket.emit("task_result", {
      taskId: task.taskId,
      value: resultValue,
    });

  } catch (err: any) {
    console.error("Task failed: ", err);
    task.socket.emit("task_result", {
      taskId: task.taskId,
      value: "#ERROR! " + err.message,
    });
  } finally {
    processingCount--;
    // Check if more jobs pending
    processQueue();
  }
}
