import * as React from "react";
import { Bot, MessageSquare, History, Bookmark, Settings } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { useChatHistories } from "@/hooks/use-chat-histories";
import { useNavigate } from "@tanstack/react-router";
import { useAppStore } from "@/store/use-app-store";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
    user: {
        name: "sleever",
        email: "m@sleever.ai",
        avatar: "/avatars/shadcn.jpg",
    },
    teams: [
        {
            name: "sleever",
            logo: Bot,
            plan: "Enterprise",
        },
    ],
    navMain: [
        {
            title: "Agents",
            url: "#",
            icon: Bot,
            isActive: true,
            items: [
                {
                    title: "My Agents",
                    url: "/my-agents",
                },
                {
                    title: "Create Agent",
                    url: "#",
                },
                {
                    title: "Settings",
                    url: "#",
                },
            ],
        },
        {
            title: "Chats",
            url: "#",
            icon: MessageSquare,
            items: [
                {
                    title: "Recent Chats",
                    url: "#",
                    icon: History,
                    component: ChatHistoryList,
                },
                {
                    title: "Saved",
                    url: "#",
                    icon: Bookmark,
                },
                {
                    title: "Settings",
                    url: "#",
                    icon: Settings,
                },
            ],
        },
    ],
    projects: [],
};

// Create a new ChatHistory component
function ChatHistoryList() {
    const { chatItems, loading, error } = useChatHistories();
    const navigate = useNavigate();
    const { setCurrentOrchestratorId } = useAppStore();

    if (loading) {
        return <div className="px-4 py-2 text-sm">Loading histories...</div>;
    }

    if (error) {
        return <div className="px-4 py-2 text-sm text-red-500">{error}</div>;
    }

    const handleChatSelect = (chat: any) => {
        console.log('Selected chat:', chat);
        setCurrentOrchestratorId(chat.orchestratorId);
        navigate({
            to: '/chats/$chatId',
            params: { chatId: chat._id }
        });
    };

    return (
        <div className="space-y-1">
            {chatItems.map((chat) => (
                <div
                    key={chat._id}
                    onClick={() => handleChatSelect(chat)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent/50 rounded-lg cursor-pointer"
                >
                    <div className="font-medium truncate">{chat.title}</div>
                    {chat.lastMessage && (
                        <div className="text-xs text-muted-foreground truncate">
                            {chat.lastMessage}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar
            className="uppercase tracking-wider border"
            collapsible="icon"
            {...props}
        >
            <SidebarContent>
                <NavMain items={data.navMain} />
                <NavProjects projects={data.projects} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
