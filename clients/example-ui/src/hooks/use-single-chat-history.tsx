import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/use-app-store';

interface UseSingleChatHistoryProps {
    userId: string;
}

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
    name: string;
    userId: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

export function useSingleChatHistory({ userId }: UseSingleChatHistoryProps) {
    const [history, setHistory] = useState<ChatHistory | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { currentOrchestratorId, currentChatId } = useAppStore();

    useEffect(() => {
        async function fetchHistory() {
            if (!currentOrchestratorId || !currentChatId || !userId) {
                console.log('⏳ Waiting for IDs...', { currentOrchestratorId, currentChatId, userId });
                return;
            }

            setLoading(true);
            setError(null);

            try {
                console.log('🔄 Fetching chat history...', { currentOrchestratorId, currentChatId });
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/history/${userId}?orchestratorId=${currentOrchestratorId}&chatId=${currentChatId}`
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('📥 Received history:', data);
                setHistory(data);
            } catch (err) {
                console.error('❌ Error fetching history:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch chat history');
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, [userId, currentOrchestratorId, currentChatId]);
    const refreshHistory = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `http://localhost:8081/api/history/${userId}/${chatId}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setHistory(data);
            setError(null);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to fetch chat history"
            );
            console.error("Error fetching chat history:", err);
        } finally {
            setLoading(false);
        }
    };

    return {
        history,
        loading,
        error,
        refreshHistory,
    };
}
