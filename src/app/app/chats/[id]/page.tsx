import { ChatRoomScreen } from '@/components/chats/ChatRoomScreen'

export default async function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ChatRoomScreen chatId={id} />
}
