import * as React from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";

// import { Calendars } from "@/components/calendars";
// import { DatePicker } from "@/components/date-picker";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  calendars: [
    {
      name: "My Calendars",
      items: ["Personal", "Work", "Family"],
    },
    {
      name: "Favorites",
      items: ["Holidays", "Birthdays"],
    },
    {
      name: "Other",
      items: ["Travel", "Reminders", "Deadlines"],
    },
  ],
};

// Dummy news data
const newsItems = [
  {
    id: 1,
    title: "New Feature Release",
    description: "Exciting new features added to the platform",
    timestamp: "2 hours ago",
    category: "Product Update",
  },
  {
    id: 2,
    title: "Team Milestone Achieved",
    description: "Development team hits major project milestone",
    timestamp: "5 hours ago",
    category: "Team News",
  },
  {
    id: 3,
    title: "System Maintenance",
    description: "Scheduled maintenance this weekend",
    timestamp: "1 day ago",
    category: "System Update",
  },
  {
    id: 4,
    title: "New Team Members",
    description: "Welcome our new developers joining next week",
    timestamp: "2 days ago",
    category: "Team News",
  },
];

// News Card Component
function NewsCard({
  title,
  description,
  timestamp,
  category,
}: {
  title: string;
  description: string;
  timestamp: string;
  category: string;
}) {
  return (
    <Card className="p-4 mb-4 hover:bg-accent transition-colors">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <h3 className="font-medium">{title}</h3>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="mt-2">
          <span className="text-xs bg-secondary px-2 py-1">{category}</span>
        </div>
      </div>
    </Card>
  );
}

export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="none"
      className="sticky hidden lg:flex top-0 h-svh border bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]"
      side="right"
      {...props}
    >
      <SidebarContent className="px-4 py-4">
        <div className="space-y-4">
          {newsItems.map((news) => (
            <NewsCard
              key={news.id}
              title={news.title}
              description={news.description}
              timestamp={news.timestamp}
              category={news.category}
            />
          ))}
        </div>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="w-full flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Load More News</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
