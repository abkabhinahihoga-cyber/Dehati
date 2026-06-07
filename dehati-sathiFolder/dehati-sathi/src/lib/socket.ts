// app/lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER as string, {
        transports: ["websocket"], // Use websocket only for better performance
    });
  }
  return socket;
};