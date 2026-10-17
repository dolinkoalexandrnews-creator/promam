import { Suspense } from 'react'
import { CirclesScreen } from '@/components/circles/CirclesScreen'

export const metadata = { title: 'Кола — PROMAM' }

export default function CirclesPage() {
  return (
    <Suspense>
      <CirclesScreen />
    </Suspense>
  )
}
