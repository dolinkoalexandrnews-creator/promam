import { CircleChatScreen } from '@/components/circles/CircleChatScreen'

export default async function CirclePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <CircleChatScreen slug={slug} />
}
