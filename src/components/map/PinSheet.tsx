'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Sheet } from '@/components/ui/Sheet'
import { Avatar } from '@/components/ui/Avatar'
import { Button, Spinner, Stars } from '@/components/ui/controls'
import { ReportDialog } from '@/components/safety/ReportDialog'
import { FORMATS } from '@/lib/constants'
import { childrenSummary, distance, expiresLabel, whenLabel } from '@/lib/format'
import type { Child, NearbyPin, ParticipantStatus, Profile } from '@/lib/types'

type Participant = {
  user_id: string
  status: ParticipantStatus
  profiles: { display_name: string; photo_url: string | null } | null
}

export function PinSheet({
  pin,
  me,
  onClose,
  onChanged,
}: {
  pin: NearbyPin
  me: Profile & { children: Child[] }
  onClose: () => void
  onChanged: () => void
}) {
  const sb = supabaseBrowser()
  const router = useRouter()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [people, setPeople] = useState<Participant[] | null>(null)
  const [reporting, setReporting] = useState(false)

  const f = FORMATS[pin.format]

  useEffect(() => {
    let active = true
    sb.from('pin_participants')
      .select('user_id, status, profiles(display_name, photo_url)')
      .eq('pin_id', pin.id)
      .then(({ data }) => {
        if (active) setPeople((data ?? []) as unknown as Participant[])
      })
    return () => {
      active = false
    }
  }, [sb, pin.id])

  async function run(fn: () => Promise<{ error: { message: string } | null }>) {
    setBusy(true)
    setError(null)
    const { error: e } = await fn()
    if (e) setError(e.message)
    else onChanged()
    setBusy(false)
  }

  const join = () =>
    run(async () => {
      const { data: auth } = await sb.auth.getUser()
      return sb
        .from('pin_participants')
        .upsert({ pin_id: pin.id, user_id: auth.user!.id, status: 'requested' })
    })

  const setMyStatus = (status: ParticipantStatus) =>
    run(async () => {
      const { data: auth } = await sb.auth.getUser()
      return sb
        .from('pin_participants')
        .update({ status })
        .eq('pin_id', pin.id)
        .eq('user_id', auth.user!.id)
    })

  const decide = (userId: string, status: ParticipantStatus) =>
    run(async () => {
      const result = await sb
        .from('pin_participants')
        .update({ status })
        .eq('pin_id', pin.id)
        .eq('user_id', userId)
      const { data } = await sb
        .from('pin_participants')
        .select('user_id, status, profiles(display_name, photo_url)')
        .eq('pin_id', pin.id)
      setPeople((data ?? []) as unknown as Participant[])
      return result
    })

  const cancelPin = () =>
    run(() => sb.from('pins').update({ status: 'cancelled' }).eq('id', pin.id).then((r) => r))

  async function movePinHere() {
    setBusy(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { error: e } = await sb.rpc('move_pin', {
          p_id: pin.id,
          in_lat: pos.coords.latitude,
          in_lng: pos.coords.longitude,
        })
        if (e) setError(e.message)
        else onChanged()
        setBusy(false)
      },
      () => {
        setError('Не вдалося визначити місце')
        setBusy(false)
      },
    )
  }

  async function writeToAuthor() {
    setBusy(true)
    const { data, error: e } = await sb.rpc('open_direct_chat', { other: pin.author_id })
    if (e) {
      setError(e.message)
      setBusy(false)
      return
    }
    router.push(`/app/chats/${data}`)
  }

  const accepted = people?.filter((p) =>
    ['accepted', 'on_the_way', 'arrived'].includes(p.status),
  )
  const requests = people?.filter((p) => p.status === 'requested')

  return (
    <>
      <Sheet open onClose={onClose}>
        <div className="pb-2">
          {/* Автор */}
          <div className="flex items-start gap-3 pt-2">
            <Link href={`/app/profile/${pin.author_id}`} onClick={onClose}>
              <Avatar
                src={pin.author_photo}
                name={pin.author_name}
                size="lg"
                verified={pin.author_verified}
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/app/profile/${pin.author_id}`}
                onClick={onClose}
                className="text-lg font-semibold"
              >
                {pin.author_name}
              </Link>
              {pin.author_reviews > 0 && (
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                  <Stars value={pin.author_rating} />
                  {pin.author_rating} · {pin.author_reviews} відгуків
                </div>
              )}
              <div className="mt-1.5 text-sm text-muted">
                {childrenSummary(pin.author_children)}
              </div>
            </div>
          </div>

          {/* Суть */}
          <div className="mt-5 rounded-2xl border border-line bg-sand/40 p-4">
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                style={{ background: f.color }}
              >
                {f.emoji} {f.label}
              </span>
              {pin.status === 'full' && (
                <span className="rounded-full bg-sand px-2.5 py-1 text-xs text-muted">
                  Місць немає
                </span>
              )}
            </div>

            <h3 className="mt-3 text-lg leading-snug font-semibold">{pin.title}</h3>
            {pin.description && (
              <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-muted">
                {pin.description}
              </p>
            )}

            <dl className="mt-4 space-y-1.5 text-sm">
              <Row label="Коли" value={whenLabel(pin.starts_at)} />
              <Row label="Де" value={pin.place_name ?? `за ${distance(pin.distance_m)} від тебе`} />
              <Row
                label="Скільки"
                value={
                  pin.capacity > 1
                    ? `компанія до ${pin.capacity} мам · зібралось ${pin.accepted_count}`
                    : 'одна мама'
                }
              />
              <Row label="Мітка діє" value={expiresLabel(pin.expires_at)} />
            </dl>
          </div>

          {/* Хто прийде */}
          {!!accepted?.length && (
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-medium">Прийдуть</h4>
              <div className="flex flex-wrap gap-2">
                {accepted.map((p) => (
                  <Link
                    key={p.user_id}
                    href={`/app/profile/${p.user_id}`}
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pr-3 pl-1"
                  >
                    <Avatar
                      src={p.profiles?.photo_url}
                      name={p.profiles?.display_name ?? '?'}
                      size="xs"
                    />
                    <span className="text-sm">{p.profiles?.display_name}</span>
                    {p.status === 'on_the_way' && <span title="Вже в дорозі">🚶</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Заявки — бачить лише авторка */}
          {pin.is_mine && !!requests?.length && (
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-medium">Хочуть приєднатися</h4>
              <div className="space-y-2">
                {requests.map((p) => (
                  <div
                    key={p.user_id}
                    className="flex items-center gap-2 rounded-xl border border-line bg-white p-2"
                  >
                    <Avatar
                      src={p.profiles?.photo_url}
                      name={p.profiles?.display_name ?? '?'}
                      size="sm"
                    />
                    <span className="flex-1 truncate text-sm font-medium">
                      {p.profiles?.display_name}
                    </span>
                    <Button size="sm" onClick={() => decide(p.user_id, 'accepted')}>
                      Так
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => decide(p.user_id, 'declined')}
                    >
                      Ні
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          )}

          {/* Дії */}
          <div className="mt-5 space-y-2">
            {pin.is_mine ? (
              <>
                {pin.chat_id && (
                  <Button
                    size="lg"
                    full
                    onClick={() => router.push(`/app/chats/${pin.chat_id}`)}
                  >
                    Відкрити чат зустрічі
                  </Button>
                )}
                <Button variant="outline" size="lg" full loading={busy} onClick={movePinHere}>
                  📍 Оновити мітку — я тут
                </Button>
                <Button variant="ghost" size="lg" full loading={busy} onClick={cancelPin}>
                  Скасувати мітку
                </Button>
              </>
            ) : pin.my_status === 'requested' ? (
              <>
                <div className="rounded-xl bg-sand px-4 py-3 text-center text-sm text-muted">
                  Чекаємо на підтвердження від {pin.author_name}
                </div>
                <Button
                  variant="ghost"
                  size="lg"
                  full
                  loading={busy}
                  onClick={() => setMyStatus('cancelled')}
                >
                  Передумала
                </Button>
              </>
            ) : pin.my_status === 'accepted' ? (
              <>
                <Button size="lg" full loading={busy} onClick={() => setMyStatus('on_the_way')}>
                  🚶 Вирушаю
                </Button>
                <Button variant="outline" size="lg" full onClick={writeToAuthor}>
                  Написати {pin.author_name}
                </Button>
              </>
            ) : pin.my_status === 'on_the_way' ? (
              <>
                <div className="rounded-xl bg-sage-100 px-4 py-3 text-center text-sm font-medium text-sage-600">
                  {pin.author_name} бачить, що ти в дорозі
                </div>
                <Button variant="outline" size="lg" full onClick={writeToAuthor}>
                  Написати
                </Button>
              </>
            ) : pin.can_join ? (
              <Button size="lg" full loading={busy} onClick={join}>
                Прийду
              </Button>
            ) : (
              <div className="rounded-xl bg-sand px-4 py-3 text-center text-sm text-muted">
                {pin.block_reason ?? 'Приєднатися зараз не можна'}
              </div>
            )}

            {!pin.is_mine && (
              <button
                onClick={() => setReporting(true)}
                className="w-full py-2 text-center text-xs text-muted underline"
              >
                Поскаржитись на мітку
              </button>
            )}
          </div>
        </div>
      </Sheet>

      {reporting && (
        <ReportDialog
          targetUserId={pin.author_id}
          targetPinId={pin.id}
          onClose={() => setReporting(false)}
        />
      )}
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-muted">{label}</dt>
      <dd className="flex-1">{value}</dd>
    </div>
  )
}
