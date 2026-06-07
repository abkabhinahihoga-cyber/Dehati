import axios from 'axios'


const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER || "http://localhost:4000";

interface EmitParams {
    event: string;
    data: any;
    room?: string;     // Target a specific group (e.g., "delivery-boys")
    socketId?: string; // Target a specific user connection
}

async function emitEventHandler({ event, data, room, socketId }: EmitParams) {
    try {
        await axios.post(`${SOCKET_SERVER_URL}/notify`, {
            event,
            data,
            room,
            socketId
        });
        // console.log(`[Socket] Emitted event: ${event}`);
    } catch (error: any) {
        console.error("[Socket] Emit failed:", error.message);
    }
}

export default emitEventHandler;