import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { addToQueue } from "./queue";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("ai_task", async (data) => {
    console.log("Received AI Task:", data);
    const { taskId, type, args, provider } = data;
    
    // Add to in-memory queue
    addToQueue({ taskId, type, args, provider, socket });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.get("/api/models", async (req, res) => {
  try {
    const localBaseUrl = process.env.LOCAL_BASE_URL || "http://host.docker.internal:1234/v1";
    // We add /models to the base URL (which should ideally be ending in /v1)
    let modelsUrl = localBaseUrl.endsWith("/") ? localBaseUrl + "models" : localBaseUrl + "/models";
    
    // Using fetch directly as fetch is native in Node 18+
    const response = await fetch(modelsUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch models from local provider: ${response.statusText}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Error fetching local models:", error.message);
    res.status(500).json({ error: error.message, data: [] });
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
