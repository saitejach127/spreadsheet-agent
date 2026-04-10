import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export const socket = io(BACKEND_URL);

socket.on("connect", () => {
  console.log("Connected to AI Backend:", socket.id);
});
