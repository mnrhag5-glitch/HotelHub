
import { io } from "socket.io-client";

const SOCKET_URL =
    import.meta.env.VITE_API_URL || "http://localhost:3000";

export const chatSocket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    transports: ["websocket", "polling"],
});
