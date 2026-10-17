'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Button, Spinner } from '@/components/ui/controls'
import { Sheet } from '@/components/ui/Sheet'
import type { Circle } from '@/lib/types'

export function CirclesScreen() {
  const sb = supabaseBrowser()
  const router = useRouter()
  const welcome = useSearchParams().get('welcome') === '1'

  const [circles, setCircles] = useState<Circle[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState<Circle | null>(null)

  const load = useCallback(async () => {
    const { data, error: e } = await sb.rpc('list_circles')
    if (e) setError(e.message)
    else setCircles((data ?? []) as Circle[])
  }, [sb])

  useEffect(() => {
    void load()
  }, [load])

  if (error) {
    return <p className="m-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
  }

  if (!circles) {
    return (
      <div className="grid h-[60dvh] place-items-center">
        <Spinner className="h-6 w-6 text-rose-500" />
      </div>
    )
  }

  const age = circles.filter((c) => c.kind === 'age')
  const life = circles.filter((c) => c.kind === 'life')
  const mine = circles.filter((c) => c.is_member)

  async function open(circle: Circle) {
    if (circle.is_member) {
      router.push(`/app/circles/${circle.slug}`)
      return
    }
    if (circle.is_sensitive) {
      setJoining(circle)
      return
    }
    await sb.rpc('join_circle', { c_id: circle.id, as_anonymous: null })
    router.push(`/app/circles/${circle.slug}`)
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Кола</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Спільноти мам, у яких зараз те саме, що й у тебе. Пиши в чат кола — тебе почують ті, хто
          розуміє з півслова.
        </p>
      </header>

      {welcome && (
        <div className="fade-up mt-4 rounded-2xl border border-rose-300 bg-rose-50 p-4">
          <div className="font-semibold">Ласкаво просимо 🤍</div>
          <p className="mt-1 text-sm leading-relaxed text-rose-700">
            Ми підсвітили кола, які підходять за віком твоєї дитини. Заходь у будь-яке — вийти
            можна будь-коли.
          </p>
        </div>
      )}

      {mine.length > 0 && (
        <Section title="Мої кола">
          <div className="space-y-2">
            {mine.map((c) => (
              <CircleRow key={c.id} circle={c} onClick={() => open(c)} />
            ))}
          </div>
        </Section>
      )}

      <Section title="За віком дитини" subtitle="Однакові режим, майданчики й теми">
        <div className="grid grid-cols-2 gap-2.5">
          {age.map((c) => (
            <CircleCard key={c.id} circle={c} onClick={() => open(c)} />
          ))}
        </div>
      </Section>

      <Section
        title="Не про дітей"
        subtitle="Приватні кола. Членство не показується у профілі, писати можна анонімно."
      >
        <div className="space-y-2.5">
          {life.map((c) => (
            <SensitiveCard key={c.id} circle={c} onClick={() => open(c)} />
          ))}
        </div>
      </Section>

      <p className="py-8 text-center text-xs leading-relaxed text-muted">
        У колах діють ті самі правила: повага, без реклами, без порад «я б на твоєму місці».
        <br />
        Скаргу на повідомлення можна лишити прямо в чаті.
      </p>

      {joining && (
        <JoinSensitiveSheet
          circle={joining}
          onClose={() => setJoining(null)}
          onJoined={async (anonymous) => {
            await sb.rpc('join_circle', { c_id: joining.id, as_anonymous: anonymous })
            router.push(`/app/circles/${joining.slug}`)
          }}
        />
      )}
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-7">
      <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{title}</h2>
      {subtitle && <p className="mt-1 mb-3 text-xs text-muted">{subtitle}</p>}
      <div className={subtitle ? '' : 'mt-3'}>{children}</div>
    </section>
  )
}

function CircleCard({ circle, onClick }: { circle: Circle; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-2xl border p-4 text-left transition active:scale-[0.98] ${
        circle.is_member
          ? 'border-rose-300 bg-rose-50'
          : circle.suggested
            ? 'border-rose-300/60 bg-white'
            : 'border-line bg-white hover:bg-sand/50'
      }`}
    >
      {circle.suggested && !circle.is_member && (
        <span className="absolute top-2.5 right-2.5 rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-bold text-white">
          ТВОЄ
        </span>
      )}
      <div className="text-2xl">{circle.emoji}</div>
      <div className="mt-2 leading-snug font-semibold">{circle.title}</div>
      <div className="mt-0.5 text-xs text-muted">{circle.subtitle}</div>
      <div className="mt-2 text-[11px] text-muted">
        {circle.is_member ? '✓ Ти тут' : `${circle.members_count ?? 0} мам`}
      </div>
    </button>
  )
}

function CircleRow({ circle, onClick }: { circle: Circle; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-3 text-left transition active:scale-[0.99] hover:bg-sand/50"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sand text-xl">
        {circle.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{circle.title}</span>
        <span className="block truncate text-xs text-muted">
          {circle.i_am_anonymous ? '🕶️ Ти тут анонімно' : circle.subtitle}
        </span>
      </span>
      <span className="text-muted">›</span>
    </button>
  )
}

function SensitiveCard({ circle, onClick }: { circle: Circle; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full gap-3.5 rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
        circle.is_member ? 'border-rose-300 bg-rose-50' : 'border-line bg-white hover:bg-sand/40'
      }`}
    >
      <span className="text-2xl leading-none">{circle.emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{circle.title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted">{circle.description}</span>
        <span className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-medium text-muted">
            🔒 Приватне
          </span>
          <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-medium text-muted">
            🕶️ Можна анонімно
          </span>
          {circle.is_member && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">
              ✓ Ти тут
            </span>
          )}
        </span>
      </span>
    </button>
  )
}

function JoinSensitiveSheet({
  circle,
  onClose,
  onJoined,
}: {
  circle: Circle
  onClose: () => void
  onJoined: (anonymous: boolean) => Promise<void>
}) {
  const [busy, setBusy] = useState<'anon' | 'open' | null>(null)

  async function go(anonymous: boolean) {
    setBusy(anonymous ? 'anon' : 'open')
    await onJoined(anonymous)
  }

  return (
    <Sheet open onClose={onClose} title={circle.title}>
      <div className="space-y-5 pb-2">
        <div className="text-4xl">{circle.emoji}</div>
        <p className="text-sm leading-relaxed text-muted">{circle.description}</p>

        <div className="rounded-2xl border border-line bg-sand/40 p-4 text-sm">
          <div className="font-medium">Як тут із приватністю</div>
          <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-muted">
            <li>· Те, що ти в цьому колі, не видно у твоєму профілі й нікому зі списку мам.</li>
            <li>· Кількість учасниць не показується — ні тобі, ні іншим.</li>
            <li>
              · Анонімно — ім’я й фото замінює псевдонім («Мама №12»). Твоє справжнє ім’я у цьому
              чаті недоступне іншим навіть технічно.
            </li>
            <li>· Вийти можна будь-коли, одним дотиком.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <Button size="lg" full loading={busy === 'anon'} onClick={() => go(true)}>
            🕶️ Увійти анонімно
          </Button>
          <Button
            variant="outline"
            size="lg"
            full
            loading={busy === 'open'}
            onClick={() => go(false)}
          >
            Увійти під своїм ім’ям
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
