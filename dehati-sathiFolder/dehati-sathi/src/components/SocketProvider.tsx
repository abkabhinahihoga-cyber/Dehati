'use client'
import { useSession } from 'next-auth/react'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => {
    return useContext(SocketContext);
}

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { data: session } = useSession();

    useEffect(() => {
        // Connect only if authenticated
        if (!session?.user) {
            return;
        }

        // Initialize Socket
        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_SERVER || "http://localhost:5000", {
            transports: ['websocket'], // Force websocket for performance
        });

        socketInstance.on('connect', () => {
            console.log('Connected to Socket Server:', socketInstance.id);
            setIsConnected(true);

            // 1. Identify User
            socketInstance.emit("identity", session.user.id);

            // 2. Join Role-Based Room (CRITICAL for Delivery Boys)
            if (session.user.role === 'deliveryBoy') {
                socketInstance.emit("join-room", "delivery-boys");
                // Optional: Join specific hub room if needed later
                // socketInstance.emit("join-room", `hub-${session.user.connectedHub}`); 
            } else if (session.user.role === 'hub') {
                socketInstance.emit("join-room", "hub-managers");
            }
        });

        socketInstance.on('disconnect', () => {
            console.log('Disconnected');
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        }
    }, [session]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    )
}