import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'
import type { ChatParams } from '@/types/chat'

const ChatUI = lazy(() => import('@/components/chat-ui'))

export const Route = createFileRoute('/chats/$chatId')({
  component: ChatUI,
  validateParams: (params): ChatParams => {
    return {
      chatId: params.chatId,
    }
  },
})
