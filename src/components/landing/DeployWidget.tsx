'use client'

import { useState } from 'react'

export function DeployWidget() {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const quickDeployCmd = 'npm run deploy'

  const copyToClipboard = () => {
    navigator.clipboard.writeText(quickDeployCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-2xl shadow-lg transition hover:bg-rose-600 hover:scale-110"
        title="Deploy PROMAM"
      >
        🚀
      </button>

      {/* Widget Panel */}
      {expanded && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-full rounded-2xl bg-white shadow-xl border border-line p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-ink">🚀 Deploy PROMAM</h3>
            <button
              onClick={() => setExpanded(false)}
              className="text-muted hover:text-ink"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 text-sm">
            {/* Status */}
            <div className="rounded-xl bg-cream p-4 border-l-4 border-rose-500">
              <p className="font-medium text-ink">✅ Готово до розгортки</p>
              <p className="text-xs text-muted mt-1">
                Усі SQL миграції й скрипти готові. Один командна лінія і PROMAM запущений!
              </p>
            </div>

            {/* Command */}
            <div className="space-y-2">
              <p className="font-medium text-ink">Quick Deploy:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-ink text-cream px-3 py-2 text-xs font-mono overflow-x-auto">
                  {quickDeployCmd}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="flex-shrink-0 rounded-lg bg-rose-500 text-white px-3 py-2 text-xs font-medium transition hover:bg-rose-600"
                >
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <p className="font-medium text-ink">Що буде:</p>
              <ul className="space-y-1 text-xs text-muted">
                <li>✓ SQL #2 (circles) → Supabase</li>
                <li>✓ SQL #3 (storage) → Supabase</li>
                <li>✓ Build Next.js проекту</li>
                <li>✓ Git commit → GitHub</li>
                <li>✓ Deploy на Vercel</li>
              </ul>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line">
              <a
                href="https://github.com/dolinkoalexandrnews-creator/promam"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center rounded-lg bg-rose-50 text-rose-600 px-3 py-2 text-xs font-medium transition hover:bg-rose-100"
              >
                🌐 GitHub
              </a>
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center rounded-lg bg-rose-50 text-rose-600 px-3 py-2 text-xs font-medium transition hover:bg-rose-100"
              >
                🚀 Vercel
              </a>
              <a
                href="https://supabase.com/dashboard/project/pvcgswmlqnrsyugkuixg/sql"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center rounded-lg bg-rose-50 text-rose-600 px-3 py-2 text-xs font-medium transition hover:bg-rose-100"
              >
                💾 Supabase
              </a>
              <a
                href="https://localhost:3000"
                className="text-center rounded-lg bg-rose-50 text-rose-600 px-3 py-2 text-xs font-medium transition hover:bg-rose-100"
              >
                💻 Local
              </a>
            </div>

            {/* Info */}
            <p className="text-xs text-muted pt-2 border-t border-line">
              📌 Потребує Node.js, npm, git, GitHub та Vercel аккаунти
            </p>
          </div>
        </div>
      )}
    </>
  )
}
