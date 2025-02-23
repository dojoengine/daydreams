import { createLazyFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAgent } from "@/hooks/use-agent";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  const agent = useAgent();
  const isMobile = useIsMobile();

  const {
    data: chats,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["agent:chats"],
    queryFn: async () => {
      const contexts = await agent.getContexts();
      return contexts.filter((ctx) => ctx.type === "chat");
    },
  });

  if (isLoading) {
    return <div className="p-4">Loading chat histories...</div>;
  }

  if (isError) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }

  console.log(chats);
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Conversations</h1>
      </div>

      <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-3"} gap-4`}>
        {chats?.map((chat) => (
          <Link
            key={chat.id}
            to="/chats/$chatId"
            params={{ chatId: chat.args.chatId }}
            className="block p-4 rounded-lg border hover:border-primary transition-colors"
          >
            <h2 className="font-semibold text-lg mb-2 truncate">
              {chat.args.chatId}
            </h2>
          </Link>
        ))}

        {chats?.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-8">
            No conversations yet. Start a new chat to begin!
          </div>
        )}
      </div>
    </div>
  );
}
