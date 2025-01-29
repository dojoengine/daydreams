import { createLazyFileRoute } from "@tanstack/react-router";
import  ChatUI  from "@/components/chat-ui";
export const Route = createLazyFileRoute("/")({
    component: Index,
});

function Index() {
    return <ChatUI />;
}
