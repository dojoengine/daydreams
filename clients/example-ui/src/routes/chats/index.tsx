import { createFileRoute } from '@tanstack/react-router'
import ChatUI from '@/components/chat-ui'

export const Route = createFileRoute('/chats/')({
  component: ChatUI,
})

function RouteComponent() {
  const { chatId } = Route.useParams();
  return <ChatUI chatId={chatId} />
}
