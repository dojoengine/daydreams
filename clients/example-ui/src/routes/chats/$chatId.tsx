import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { MessagesList, MessageType } from "@/components/message-list";
import { getWorkingMemoryLogs, Log } from "@daydreamsai/core";
import { SidebarRight } from "@/components/sidebar-right";
import { useAgent } from "@/hooks/use-agent";
import { chat } from "@/agent/chat";
import { v7 as randomUUIDv7 } from "uuid";
import { useQueryClient } from "@tanstack/react-query";
import { useMessages } from "@/hooks/use-messages";

export const Route = createFileRoute("/chats/$chatId")({
  component: RouteComponent,
  context() {
    return {
      SideBar: SidebarRight,
      sidebarProps: {
        className:
          "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      },
    };
  },
  loader({ params }) {
    if (params.chatId === "new") {
      return redirect({
        to: "/chats/$chatId",
        params: {
          chatId: randomUUIDv7(),
        },
      });
    }
  },
});

function RouteComponent() {
  const { chatId } = Route.useParams();

  const dreams = useAgent();
  const { messages, setMessages, handleLog } = useMessages();

  const contextId = dreams.getContextId({
    context: chat.contexts!.chat,
    args: {
      chatId,
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    dreams.start().then(async () => {
      const workingMemory = await dreams.getWorkingMemory(contextId);
      getWorkingMemoryLogs(workingMemory).map((log) => handleLog(log, true));
    });
  }, [dreams, chatId]);

  const queryClient = useQueryClient();

  useEffect(() => {
    const SCROLL_THRESHOLD = 200;
    let userScrolled = false;

    const isNearBottom = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const distanceFromBottom = documentHeight - (scrollTop + windowHeight);

      return distanceFromBottom <= SCROLL_THRESHOLD;
    };

    // When user starts scrolling manually
    const handleUserScroll = () => {
      userScrolled = true;

      // Reset the flag after a short delay
      setTimeout(() => {
        userScrolled = false;
      }, 1000);
    };

    // Add scroll event listener
    window.addEventListener("wheel", handleUserScroll);
    window.addEventListener("touchmove", handleUserScroll);

    // Only auto-scroll if user hasn't manually scrolled
    if (isNearBottom() && !userScrolled) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }

    // Cleanup event listeners
    return () => {
      window.removeEventListener("wheel", handleUserScroll);
      window.removeEventListener("touchmove", handleUserScroll);
    };
  }, [messages]);

  return (
    <>
      <div className="flex flex-col flex-1 relative">
        <div className="flex flex-col">
          <div className="flex-1 p-4 pb-36" ref={scrollRef}>
            <MessagesList messages={messages} />
          </div>
        </div>
      </div>
      <form
        className="bg-background flex items-center mt-auto sticky bottom-0 left-0 right-0"
        onSubmit={async (e) => {
          e.preventDefault();
          const msg = new FormData(e.currentTarget).get("message") as string;

          setMessages((msgs) => [
            ...msgs,
            {
              id: Date.now().toString(),
              type: "user",
              message: msg,
            },
          ]);

          e.currentTarget.reset();

          await dreams.send({
            context: chat.contexts!.chat,
            args: {
              chatId,
            },
            input: {
              type: "message",
              data: {
                user: "galego",
                content: msg,
              },
            },
            handlers: {
              onLogStream(log, done) {
                handleLog(log, done);
              },
            },
          });

          if (messages.length === 0) {
            queryClient.invalidateQueries({
              queryKey: ["agent:chats"],
            });
          }
        }}
      >
        <input
          type="text"
          name="message"
          placeholder="Type your message..."
          className="border flex-1 px-6 py-4 rounded-lg bg-background text-foreground placeholder:text-primary focus:outline-none focus:border-primary"
          disabled={false} // Disable input while loading history
        />
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary h-full w-1/4 max-w-64 disabled:opacity-50 disabled:cursor-not-allowed">
          Send
        </button>
      </form>
    </>
  );
}
