import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/store/use-app-store";
import { generateUserId } from './use-daydreams';

interface ChatHistoryItem {
    _id: string;
    title: string;
    lastMessage?: string;
    updatedAt: Date;
    orchestratorId: string;
}

export function useChatHistories() {
    const [chatItems, setChatItems] = useState<ChatHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { currentOrchestratorId, setCurrentOrchestratorId } = useAppStore();


    const selectFirstOrchestrator = useCallback((items: ChatHistoryItem[]) => {
        if (items.length > 0 && !currentOrchestratorId) {
            console.log('🎯 Auto-selecting first orchestrator:', items[0].orchestratorId);
            setCurrentOrchestratorId(items[0].orchestratorId);
        }
    }, [currentOrchestratorId, setCurrentOrchestratorId]);

    useEffect(() => {
        const fetchChatHistories = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const userId = generateUserId();
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
                
                const response = await fetch(
                    `${apiUrl}/api/orchestrators?userId=${userId}`,
                    {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                    }
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                const formattedItems = data.map((item: any) => ({
                    _id: item.id,
                    title: item.name || `Chat ${new Date(item.createdAt).toLocaleString()}`,
                    lastMessage: item.messages?.[item.messages.length - 1]?.data?.content,
                    updatedAt: new Date(item.updatedAt),
                    orchestratorId: item.id,
                    messages: item.messages
                }));

                setChatItems(formattedItems);
                selectFirstOrchestrator(formattedItems);

            } catch (err) {
                console.error('❌ Error fetching chat histories:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch chat histories');
            } finally {
                setLoading(false);
            }
        };

        fetchChatHistories();
    }, [selectFirstOrchestrator]);

    useEffect(() => {
        if (!currentOrchestratorId) {
            selectFirstOrchestrator(chatItems);
        }
    }, [currentOrchestratorId, chatItems, selectFirstOrchestrator]);

    const refreshHistory = () => {
        setLoading(true);
        setError(null);
    };

    return {
        chatItems,
        loading,
        error,
        refreshHistory,
    };
}
