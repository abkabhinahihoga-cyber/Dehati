import express from "express";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import cors from "cors";

dotenv.config();
const app = express();

// Allow CORS for the API endpoint from Next.js
app.use(cors({ origin: process.env.NEXT_BASE_URL || "*" })); 
app.use(express.json());

const server = http.createServer(app);
const port = process.env.PORT || 5000;

// Setup Redis Clients for Socket.io Adapter & Messaging
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
const messageClient = pubClient.duplicate(); // For pushing background jobs

Promise.all([pubClient.connect(), subClient.connect(), messageClient.connect()]).then(() => {
    console.log("Redis connected successfully for Socket Server.");
    
    const io = new Server(server, {
        cors: {
            origin: process.env.NEXT_BASE_URL || "*",
            methods: ["GET", "POST"]
        },
        adapter: createAdapter(pubClient, subClient)
    });

    io.on("connection", (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // 1. General Room Join (for Notifications)
        socket.on("join-room", (room) => {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room: ${room}`);
        });

        // 2. TRACKING: User joins a room to track a specific driver
        socket.on("track-driver", (driverId) => {
            socket.join(`tracking-${driverId}`);
            console.log(`Socket ${socket.id} started tracking driver ${driverId}`);
        });

        // 3. DRIVER: Updates Location
        socket.on("update-location", async ({ userId, latitude, longitude }) => {
            // A. FAST RELAY: Broadcast IMMEDIATELY to users tracking this driver
            io.to(`tracking-${userId}`).emit("driver-moved", { latitude, longitude });

            // B. PERSISTENCE: Push to Redis Stream for Next.js Background Worker to consume
            try {
                const locationData = JSON.stringify({ userId, latitude, longitude, timestamp: Date.now() });
                await messageClient.lPush("queue:location_updates", locationData);
            } catch (e) {
                console.error("Redis Push Location Error:", e.message);
            }
        });

        // 4. CHAT: Join Specific Conversation
        socket.on("join-chat", (conversationId) => {
            socket.join(conversationId);
            console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
        });

        // 5. CHAT: Send Message
        socket.on("send-message", async (message) => {
            // A. Real-time Broadcast: Send to everyone in room EXCEPT sender
            socket.to(message.conversationId).emit("receive-message", message);

            // B. Persistence: Push to Redis Message Queue for Batch DB Insert
            try {
                await messageClient.lPush("queue:chat_messages", JSON.stringify(message));
            } catch (e) {
                console.error("Redis Push Message Error:", e.message);
            }
        });

        // 6. Message Status Updates (Delivered/Seen)
        socket.on("mark-as-seen", async ({ conversationId, messageIds, seenBy }) => {
            socket.to(conversationId).emit("messages-seen", { messageIds });
            try {
                await messageClient.lPush("queue:chat_status", JSON.stringify({ messageIds, status: 'seen' }));
            } catch (e) {
                console.error("Redis Push Status Error:", e.message);
            }
        });

        socket.on("mark-as-delivered", ({ conversationId, messageIds }) => {
            socket.to(conversationId).emit("messages-delivered", { messageIds });
        });

        // 7. Typing Indicators
        socket.on("typing", ({ conversationId, userId }) => {
            socket.to(conversationId).emit("user-typing", { userId });
        });

        socket.on("stop-typing", ({ conversationId, userId }) => {
            socket.to(conversationId).emit("user-stop-typing", { userId });
        });

        // 8. DELETE MESSAGE
        socket.on("delete-message", ({ conversationId, messageId, type }) => {
            socket.to(conversationId).emit("message-deleted", { messageId, type });
        });

        // 9. CALLING FEATURES (WebRTC Signaling)
        socket.on("call-start", ({ conversationId, offer, callerName }) => {
            socket.to(conversationId).emit("incoming-call", { offer, callerName });
        });

        socket.on("call-answer", ({ conversationId, answer }) => {
            socket.to(conversationId).emit("call-accepted", { answer });
        });

        socket.on("ice-candidate", ({ conversationId, candidate }) => {
            socket.to(conversationId).emit("new-ice-candidate", { candidate });
        });

        socket.on("end-call", ({ conversationId }) => {
            socket.to(conversationId).emit("call-ended");
        });
    });

    // --- API TO TRIGGER SOCKET EVENTS FROM NEXT.JS ---
    app.post("/notify", (req, res) => {
        const { event, data, room, socketId } = req.body;
        
        if (socketId) {
            io.to(socketId).emit(event, data);
        } else if (room) {
            io.to(room).emit(event, data);
        } else {
            io.emit(event, data);
        }
        
        return res.status(200).json({ success: true });
    });

    server.listen(port, () => {
        console.log(`Production Socket Server running on port ${port} with Redis Adapter`);
    });

}).catch((err) => {
    console.error("Failed to connect to Redis:", err);
});