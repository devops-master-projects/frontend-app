import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { NotificationDto } from "./notificationsApi.ts";

let stompClient: Client | null = null;

export const connectWebSocket = (
    userId: string,
    onMessageReceived: (notif: NotificationDto) => void
) => {
    stompClient = new Client({
        webSocketFactory: () => new SockJS("http://localhost:8088/ws?token=" + localStorage.getItem("access_token")),
        reconnectDelay: 5000,
        connectHeaders: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`, // koristi se u STOMP CONNECT
        },
        onConnect: () => {
            console.log("Connected to WebSocket");
            stompClient?.subscribe(`/topic/notifications/${userId}`, (message) => {
                if (message.body) {
                    const notif: NotificationDto = JSON.parse(message.body);
                    onMessageReceived(notif);
                }
            });
        },
    });


    stompClient.activate();
};

export const disconnectWebSocket = () => {
    stompClient?.deactivate();
    console.log("Disconnected from WebSocket");
};
