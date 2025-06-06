// src/lib/socket.ts
import { io } from "socket.io-client";

const socket = io("https://e-commerce-admin-backend.onrender.com", {
  withCredentials: true,
});

export default socket;
