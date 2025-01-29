import React from 'react';
import { Link } from '@tanstack/react-router';
import { useChatHistories } from '@/hooks/use-chat-histories';
import { useAppStore } from '@/store/use-app-store';

export default function ChatList() {
    const { currentOrchestratorId, setCurrentOrchestratorId, currentChatId } = useAppStore();
    const { chatItems, loading, error } = useChatHistories();
    const filteredChats = chatItems.filter(
        chat => chat.orchestratorId === currentOrchestratorId
    );

    const handleChatSelect = (chatId: string) => {
        const chat = filteredChats.find(c => c._id === chatId);
        if (chat) {
            setCurrentOrchestratorId(chat.orchestratorId);
            console.log('🎯 Selecting chat:', chatId, 'with orchestrator:', chat.orchestratorId);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                Loading chats...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-4 text-destructive">
                Error: {error}
            </div>
        );
    }

    if (!currentOrchestratorId) {
        return (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
                Please select an orchestrator first
            </div>
        );
    }

    if (filteredChats.length === 0) {
        return (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
                No chats found for this orchestrator
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="grid gap-4">
                {filteredChats.map((chat) => (
                    <Link
                        key={chat._id}
                        to="/chats/$chatId"
                        params={{ 
                            chatId: chat._id 
                        }}
                        onClick={
                          () => handleChatSelect(chat._id)
                        }
                        className={`p-4 rounded-lg border hover:border-primary transition-colors
                            ${chat._id === currentChatId ? 'bg-primary/10 border-primary' : ''}`}
                    >
                        <h3 className="font-medium">{chat.title}</h3>
                        {chat.lastMessage && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                                {chat.lastMessage}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                            {new Date(chat.updatedAt).toLocaleString()}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}