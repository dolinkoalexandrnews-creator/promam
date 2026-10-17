'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="grid h-dvh place-items-center bg-cream px-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-ink mb-2">Щось пішло не так!</h2>
        <p className="text-muted mb-6">{error.message}</p>
        <button
          onClick={() => reset()}
          className="rounded-full bg-rose-500 text-white px-6 py-2 font-medium hover:bg-rose-600"
        >
          Спробувати знову
        </button>
      </div>
    </div>
  )
}
