import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/store/use-app-store";
import { generateUserId } from "./use-daydreams";

interface ChatMessage {
    role: string;
    name: string;
    data: {
        content?: string;
        message?: string;
        userId: string;
    };
    timestamp: Date;
}

interface ChatHistory {
    _id: string;
    messages: ChatMessage[];
    userId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export function useChatHistory(chatId?: string) {
    const [history, setHistory] = useState<ChatHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { currentOrchestratorId } = useAppStore();
    const userId = generateUserId();

    const fetchHistory = useCallback(async () => {
        if (!chatId || !currentOrchestratorId) {
            console.log('⏳ Waiting for IDs...', { chatId, currentOrchestratorId });
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
            const url = `${apiUrl}/api/orchestrators/${currentOrchestratorId}`;

            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Server error:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
            }

            const data = await response.json();
            setHistory(data);

        } catch (err) {
            console.error('❌ Error fetching chat history:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch chat history');
        } finally {
            setLoading(false);
        }
    }, [chatId, currentOrchestratorId, userId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return {
        history,
        loading,
        error,
        refreshHistory: fetchHistory,
    };
}
