import * as React from "react";
import {
  Bot,
  MessageSquare,
  History,
  Bookmark,
  Settings,
  Wrench,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { useAgent } from "@/hooks/use-agent";
import { useQuery } from "@tanstack/react-query";
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
      title: "Home",
      url: "/",
      icon: Bot,
      isActive: true,
    },

    // {
    //   title: "Agents",
    //   url: "#",
    //   icon: Bot,
    //   isActive: true,
    //   items: [
    //     {
    //       title: "My Agents",
    //       url: "#",
    //     },
    //     {
    //       title: "Create Agent",
    //       url: "#",
    //     },
    //     {
    //       title: "Settings",
    //       url: "#",
    //     },
    //   ],
    // },
    {
      title: "Chats",
      url: "#",
      icon: MessageSquare,
      items: [
        {
          title: "New",
          url: "/chats/new",
          icon: Bookmark,
        },
        {
          title: "Settings",
          url: "#",
          icon: Settings,
        },
        {
          title: "Recent Chats",
          url: "#",
          icon: History,
          component: ChatHistoryList,
        },
      ],
    },
    {
      title: "Workbench",
      url: "/workbench",
      icon: Wrench,
      isActive: true,
    },
  ],
  projects: [],
};

// Create a new ChatHistory component
function ChatHistoryList() {
  const agent = useAgent();

  const chats = useQuery({
    queryKey: ["agent:chats"],

    queryFn: async () => {
      const contexts = await agent.getContexts();
      return contexts.filter((ctx) => ctx.type === "chat");
    },
  });

  if (chats.isLoading) {
    return <div className="px-4 py-2 text-sm">Loading chats...</div>;
  }

  if (chats.isError) {
    return (
      <div className="px-4 py-2 text-sm text-red-500">
        {chats.error.message}
      </div>
    );
  }

  return (
    <div>
      <SidebarSeparator className="my-4" />
      {chats.data?.map((chat) => (
        <SidebarMenuSubItem key={chat.id}>
          <SidebarMenuSubButton asChild>
            <Link to={"/chats/$chatId"} params={{ chatId: chat.args.chatId }}>
              <div className="font-medium truncate">{chat.args.chatId}</div>
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
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
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      {/* <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter> */}
      <SidebarRail />
    </Sidebar>
  );
}
