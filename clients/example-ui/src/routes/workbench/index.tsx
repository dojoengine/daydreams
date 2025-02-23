import { MessagesList } from "@/components/message-list";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAgent } from "@/hooks/use-agent";
import { useMessages } from "@/hooks/use-messages";
import { context, getWorkingMemoryLogs } from "@daydreamsai/core";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

export const Route = createFileRoute("/workbench/")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const dreams = useAgent();
  const { messages, setMessages, handleLog } = useMessages();

  const [prompt, setPrompt] = useState("");
  const [key, setKey] = useState("this-is-a-test");

  const keyRef = useRef(key);

  const ctx = context({
    schema: z.object({
      key: z.string(),
    }),
    key: ({ key }) => key,
    type: "custom",
    render() {
      return prompt;
    },
  });

  const contextId = dreams.getContextId({
    context: ctx,
    args: {
      key,
    },
  });

  useEffect(() => {
    setMessages([]);
    dreams.start().then(async () => {
      const workingMemory = await dreams.getWorkingMemory(contextId);
      getWorkingMemoryLogs(workingMemory).map((log) => handleLog(log, true));
    });
  }, [dreams, key]);

  keyRef.current = key;

  return (
    <div className="grid grid-cols-2 max-h-screen min-h-[calc(100vh-64px)] relative bg-card">
      <div className="h-full flex flex-col max-h-screen overflow-hidden pr-0.5">
        <ScrollArea className="w-full flex-1 rounded-md">
          <div className="flex flex-col pb-20 px-4 pt-6">
            <Label className="mb-4">Context Prompt</Label>
            <Textarea
              value={prompt}
              className="min-h-96"
              onChange={(e) => {
                setPrompt(e.target.value);
              }}
            />
          </div>
        </ScrollArea>
      </div>
      <div className="h-full flex flex-col max-h-screen overflow-hidden">
        <div className="flex flex-col border-l w-full px-4 pt-6 pb-4 border-b">
          <Label className="mb-4">Context Key</Label>
          <Input
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
            }}
          />
        </div>
        <ScrollArea className="border-l w-full flex-1 px-4 pt-4">
          <MessagesList messages={messages} />
          <div className="pb-32"></div>
        </ScrollArea>
        <div className="bg-background flex">
          <form
            className="flex flex-1"
            onSubmit={async (e) => {
              e.preventDefault();
              const msg = new FormData(e.currentTarget).get(
                "message"
              ) as string;

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
                context: ctx,
                args: {
                  key,
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
                    if (keyRef.current === key) {
                      handleLog(log, done);
                    }
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
              className="border-t border-l border-collapse flex-1 px-6 py-4 rounded-lg bg-background text-foreground placeholder:text-primary focus:outline-none focus:border-primary"
              disabled={false} // Disable input while loading history
            />
            <button className="border border-primary rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary h-full w-1/4 disabled:opacity-50 disabled:cursor-not-allowed">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
