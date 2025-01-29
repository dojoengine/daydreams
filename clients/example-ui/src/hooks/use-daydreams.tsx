import { useEffect, useRef, useState, useCallback } from "react";

interface ServerMessage {
    type: string;
    message?: string;
    error?: string;
}

// Helper function to generate a simple UUID
// testing purposes only
export function generateUserId() {
    return "toto";
}

export function useDaydreamsWs() {
    const [messages, setMessages] = useState<ServerMessage[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    // Generate and store userId in a ref so it persists across renders
    const userIdRef = useRef<string>(generateUserId());

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080");
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("✅ Connected to Daydreams WebSocket!");
        };

        ws.onmessage = (event) => {
            try {
                console.log("REceived message from server", event.data);
                const data = JSON.parse(event.data) as ServerMessage;
                setMessages((prev) => [...prev, data]);
            } catch (err) {
                console.error("Failed to parse WebSocket message:", event.data);
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        ws.onclose = () => {
            console.log("❌ Disconnected from Daydreams WebSocket.");
        };

        return () => {
            ws.close();
        };
    }, []);

    const sendGoal = useCallback((goal: string, orchestratorId?: string, userId?: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({
                    goal,
                    userId: userId || generateUserId(),
                    orchestratorId,
                })
            );
        }
    }, []);

    return {
        messages,
        sendGoal,
        userId: userIdRef.current,
    };
}