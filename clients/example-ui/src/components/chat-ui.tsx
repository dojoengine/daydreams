import { useState, useEffect } from "react";
import { MessagesList } from "@/components/message-list";
import { generateUserId, useDaydreamsWs } from "@/hooks/use-daydreams";
import { useSingleChatHistory } from "@/hooks/use-single-chat-history";

interface MessageType {
  type: "user" | "assistant" | "system" | "error" | "other";
  message?: string;
  error?: string;
}

const bladerunnerQuotes = [
  "I've seen things you people wouldn't believe...",
  "All those moments will be lost in time, like tears in rain",
  "More human than human is our motto",
  "Have you ever retired a human by mistake?",
  "It's too bad she won't live, but then again who does?",
  "I want more life, father",
];

function ChatUI({ chatId }: { chatId: string }) {
  const [message, setMessage] = useState("");
  const [allMessages, setAllMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const { messages, sendGoal } = useDaydreamsWs();

  const {
    history,
    loading: historyLoading,
    error,
  } = useSingleChatHistory({
    chatId,
    userId: generateUserId(),
  });

  // Load chat history when component mounts or history changes
  useEffect(() => {
    if (history?.messages) {
      const formattedMessages: MessageType[] = history.messages.map((msg) => ({
        type:
          msg.role === "assistant"
            ? "assistant"
            : msg.role === "user"
              ? "user"
              : "system",
        message: msg.data.content || msg.data.message || "",
      }));
      setAllMessages(formattedMessages);
    }
  }, [history]);

  // Handle new WebSocket messages
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    // Only clear loading if we received an assistant or error message
    if (lastMessage.type !== "user") {
      setIsLoading(false);
    }

    setAllMessages((prev: MessageType[]) => {
      const typedMessage: MessageType = {
        type: lastMessage.type as MessageType["type"],
        message: lastMessage.message,
        error: lastMessage.error,
      };

      // Avoid duplicate messages
      if (
        prev.length > 0 &&
        JSON.stringify(prev[prev.length - 1]) === JSON.stringify(typedMessage)
      ) {
        return prev;
      }
      return [...prev, typedMessage];
    });
  }, [messages]);

  // Add quote cycling effect when loading
  useEffect(() => {
    let interval: Timer;
    if (isLoading) {
      interval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % bladerunnerQuotes.length);
      }, 3000); // Change quote every 3 seconds
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = () => {
    if (!message.trim()) return;
    setIsLoading(true);
    setAllMessages((prev) => [...prev, { type: "user", message: message }]);
    sendGoal(message, chatId);
    setMessage("");
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="relative flex flex-col h-[calc(100vh-4rem)] rounded-lg border border-l-0">
        <div className="flex-1 p-4 overflow-auto">
          {historyLoading ? (
            <div className="flex items-center justify-center p-4 text-muted-foreground italic">
              Loading chat history...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-4 text-destructive">
              Error loading chat history: {error}
            </div>
          ) : (
            <>
              <MessagesList messages={allMessages} />
              {isLoading && (
                <div className="flex items-center justify-center p-4 text-muted-foreground italic">
                  {bladerunnerQuotes[quoteIndex]}
                </div>
              )}
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t bg-background flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 px-8 py-8 rounded-lg bg-background text-foreground placeholder:text-primary
                           focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={historyLoading} // Disable input while loading history
          />
          <button
            onClick={handleSubmit}
            disabled={historyLoading} // Disable button while loading history
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 
                           focus:outline-none focus:ring-2 focus:ring-primary h-full w-64
                           disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatUI;
