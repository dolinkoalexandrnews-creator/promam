import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="grid h-dvh place-items-center bg-cream px-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-rose-500 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-ink mb-4">Сторінка не знайдена</h2>
        <p className="text-muted mb-6">Вибач, але ця сторінка не існує.</p>
        <Link
          href="/"
          className="inline-block rounded-full bg-rose-500 text-white px-6 py-2 font-medium hover:bg-rose-600"
        >
          На головну
        </Link>
      </div>
    </div>
  )
}
