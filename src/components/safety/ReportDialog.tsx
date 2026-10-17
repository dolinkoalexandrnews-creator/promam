'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Sheet } from '@/components/ui/Sheet'
import { Button, Chip, Textarea } from '@/components/ui/controls'
import { REPORT_REASONS } from '@/lib/constants'

export function ReportDialog({
  targetUserId,
  targetPinId,
  messageId,
  onClose,
}: {
  targetUserId?: string
  targetPinId?: string
  messageId?: string
  onClose: () => void
}) {
  const sb = supabaseBrowser()
  const [reason, setReason] = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alsoBlock, setAlsoBlock] = useState(true)

  async function send() {
    if (!reason) return
    setBusy(true)
    setError(null)
    try {
      const { data: auth } = await sb.auth.getUser()
      const { error: e } = await sb.from('reports').insert({
        reporter_id: auth.user!.id,
        target_user_id: targetUserId ?? null,
        target_pin_id: targetPinId ?? null,
        message_id: messageId ?? null,
        reason,
        details: details.trim() || null,
      })
      if (e) throw e

      if (alsoBlock && targetUserId) {
        await sb.from('blocks').insert({ blocker_id: auth.user!.id, blocked_id: targetUserId })
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <Sheet open onClose={onClose} title="Дякуємо">
        <div className="py-4 text-center">
          <div className="text-4xl">🤍</div>
          <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Скаргу передано модерації. Ми подивимось найближчим часом.
            {alsoBlock && targetUserId && ' Користувачку також заблоковано — ви більше не бачитимете одна одну.'}
          </p>
          <Button className="mt-6" size="lg" full onClick={onClose}>
            Зрозуміло
          </Button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet open onClose={onClose} title="Поскаржитись">
      <div className="space-y-5 pb-2">
        <p className="text-sm leading-relaxed text-muted">
          Розкажи, що сталося. Переписку модерація читає лише під час розгляду скарги.
        </p>

        <div className="flex flex-wrap gap-2">
          {REPORT_REASONS.map((r) => (
            <Chip key={r} active={reason === r} onClick={() => setReason(r)}>
              {r}
            </Chip>
          ))}
        </div>

        <Textarea
          rows={3}
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
          placeholder="Деталі (необов’язково)"
        />

        {targetUserId && (
          <label className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
            <input
              type="checkbox"
              checked={alsoBlock}
              onChange={(e) => setAlsoBlock(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--color-rose-500)]"
            />
            <span className="text-sm">
              Заблокувати
              <span className="mt-0.5 block text-xs text-muted">
                Ви не бачитимете міток одна одної, писати буде неможливо.
              </span>
            </span>
          </label>
        )}

        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <Button size="lg" full disabled={!reason} loading={busy} onClick={send}>
          Надіслати скаргу
        </Button>

        <p className="text-center text-xs text-muted">
          Якщо є загроза життю чи здоров’ю — одразу телефонуй <b>112</b>.
        </p>
      </div>
    </Sheet>
  )
}
