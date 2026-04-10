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
    const { taskId, type, args } = data;
    
    // Add to in-memory queue
    addToQueue({ taskId, type, args, socket });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
