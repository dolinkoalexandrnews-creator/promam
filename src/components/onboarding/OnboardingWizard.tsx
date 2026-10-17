'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Button, Chip, Field, Input, Textarea } from '@/components/ui/controls'
import { PhotoPicker } from '@/components/profile/PhotoPicker'
import { ChildrenEditor, type DraftChild } from '@/components/profile/ChildrenEditor'
import { FORMATS, FORMAT_LIST, INTERESTS } from '@/lib/constants'
import type { Child, MeetFormat, Profile } from '@/lib/types'

const STEPS = ['Хто ти', 'Діти', 'Інтереси', 'Де ти'] as const

export function OnboardingWizard({ profile }: { profile: Profile & { children: Child[] } }) {
  const router = useRouter()
  const sb = supabaseBrowser()

  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(profile.display_name ?? '')
  const [photo, setPhoto] = useState<string | null>(profile.photo_url)
  const [birthYear, setBirthYear] = useState<string>(profile.birth_year?.toString() ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [city, setCity] = useState(profile.city ?? '')

  const [children, setChildren] = useState<DraftChild[]>(
    profile.children?.length
      ? profile.children.map((c) => ({
          id: c.id,
          name: c.name ?? '',
          birthMonth: c.birth_month.slice(0, 7),
          gender: c.gender,
        }))
      : [],
  )
  const [expecting, setExpecting] = useState(false)

  const [interests, setInterests] = useState<string[]>(profile.interests ?? [])
  const [formats, setFormats] = useState<MeetFormat[]>(
    profile.looking_for?.length ? profile.looking_for : ['coffee', 'walk', 'playground'],
  )

  const [homeLabel, setHomeLabel] = useState(profile.home_label ?? '')
  const [home, setHome] = useState<{ lat: number; lng: number } | null>(null)
  const [geoBusy, setGeoBusy] = useState(false)
  const [showInFriends, setShowInFriends] = useState(profile.show_in_friends)

  const canContinue =
    step === 0
      ? name.trim().length >= 2
      : step === 1
        ? expecting || children.length > 0
        : step === 2
          ? formats.length > 0
          : true

  function toggle<T>(list: T[], value: T, setter: (v: T[]) => void) {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])
  }

  async function detectHome() {
    setGeoBusy(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setHome({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoBusy(false)
      },
      () => {
        setError('Не вдалося отримати місце. Дозволь геолокацію в налаштуваннях браузера.')
        setGeoBusy(false)
      },
      { enableHighAccuracy: false, timeout: 10_000 },
    )
  }

  async function finish() {
    setBusy(true)
    setError(null)
    try {
      const { error: profileError } = await sb
        .from('profiles')
        .update({
          display_name: name.trim(),
          photo_url: photo,
          bio: bio.trim(),
          city: city.trim() || null,
          birth_year: birthYear ? Number(birthYear) : null,
          interests,
          looking_for: formats,
          home_label: homeLabel.trim() || null,
          show_in_friends: showInFriends,
          onboarded_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
      if (profileError) throw profileError

      // Координати дому пишемо окремо — це geography, через RPC-безпечний upsert.
      if (home) {
        const { error: geoError } = await sb.rpc('set_home_point' as never, {
          in_lat: home.lat,
          in_lng: home.lng,
        } as never)
        if (geoError) throw geoError
      }

      // Діти: прибираємо старих і пишемо актуальний список.
      await sb.from('children').delete().eq('profile_id', profile.id)
      const rows = children
        .filter((c) => c.birthMonth)
        .map((c) => ({
          profile_id: profile.id,
          name: c.name.trim() || null,
          birth_month: `${c.birthMonth}-01`,
          gender: c.gender,
        }))
      if (rows.length) {
        const { error: childError } = await sb.from('children').insert(rows)
        if (childError) throw childError
      }

      router.push('/app/circles?welcome=1')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pt-6 pb-10">
      {/* Прогрес */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={`h-1.5 rounded-full transition-colors ${
                i <= step ? 'bg-rose-500' : 'bg-line'
              }`}
            />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs font-medium text-muted">
        Крок {step + 1} з {STEPS.length} · {STEPS[step]}
      </p>

      <div className="fade-up mt-6 flex-1" key={step}>
        {step === 0 && (
          <section className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Привіт! Як тебе звати?</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Справжнє ім’я і живе фото — головне, чому інші мами наважуються написати першими.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Avatar src={photo} name={name || '?'} size="xl" />
              <PhotoPicker
                userId={profile.id}
                onUploaded={setPhoto}
                label={photo ? 'Змінити фото' : 'Додати фото'}
              />
            </div>

            <Field label="Ім’я">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Оля"
                autoFocus
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Рік народження">
                <Input
                  inputMode="numeric"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1994"
                />
              </Field>
              <Field label="Місто">
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Київ" />
              </Field>
            </div>

            <Field label="Кілька слів про себе" hint="Необов’язково, але з цим пишуть частіше.">
              <Textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 300))}
                placeholder="Гуляю щодня в парку біля дому, люблю каву й тишу, поки малий спить."
              />
            </Field>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Розкажи про дітей</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Вік дитини — найважливіше. Найлегше порозумітись з мамою, у якої дитина такого ж
                віку: однаковий режим, однакові майданчики, однакові теми.
              </p>
            </div>

            <ChildrenEditor value={children} onChange={setChildren} />

            <button
              type="button"
              onClick={() => setExpecting(!expecting)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                expecting ? 'border-rose-300 bg-rose-50' : 'border-line bg-white hover:bg-sand'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤰</span>
                <div>
                  <div className="font-medium">Я ще чекаю на малюка</div>
                  <div className="text-xs text-muted">
                    Приєднаємо тебе до кола «Я вагітна» замість віку дитини
                  </div>
                </div>
              </div>
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Що тобі цікаво?</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                За цим підбираємо мам поруч і підказуємо, кому ти можеш бути цікавою.
              </p>
            </div>

            <div>
              <h2 className="mb-2.5 text-sm font-medium">Формати зустрічей</h2>
              <div className="grid grid-cols-2 gap-2.5">
                {FORMAT_LIST.map((key) => {
                  const f = FORMATS[key]
                  const active = formats.includes(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(formats, key, setFormats)}
                      className={`rounded-2xl border p-3.5 text-left transition active:scale-[0.98] ${
                        active ? 'border-transparent text-white' : 'border-line bg-white'
                      }`}
                      style={active ? { background: f.color } : undefined}
                    >
                      <div className="text-xl">{f.emoji}</div>
                      <div className="mt-1.5 text-sm font-semibold">{f.label}</div>
                      <div className={`text-[11px] ${active ? 'text-white/80' : 'text-muted'}`}>
                        {f.hint}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <h2 className="mb-2.5 text-sm font-medium">Інтереси й ситуація</h2>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => (
                  <Chip
                    key={i}
                    active={interests.includes(i)}
                    onClick={() => toggle(interests, i, setInterests)}
                  >
                    {i}
                  </Chip>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Де тебе шукати?</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Точну адресу ніхто не побачить — лише приблизний район. Це потрібно для формату
                «Сусідки»: мами з твого будинку й двору.
              </p>
            </div>

            <Button
              variant={home ? 'soft' : 'outline'}
              size="lg"
              full
              loading={geoBusy}
              onClick={detectHome}
            >
              {home ? '✓ Місце визначено' : '📍 Визначити моє місце'}
            </Button>

            <Field
              label="Будинок або орієнтир"
              hint="Напр. «ЖК Сонячний, 3 під’їзд» — побачать лише мами з твого будинку."
            >
              <Input
                value={homeLabel}
                onChange={(e) => setHomeLabel(e.target.value)}
                placeholder="ЖК Сонячний, 3 під’їзд"
              />
            </Field>

            <button
              type="button"
              onClick={() => setShowInFriends(!showInFriends)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                showInFriends ? 'border-sage-500 bg-sage-100' : 'border-line bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">👭</span>
                <div>
                  <div className="font-medium">Показувати мене в розділі «Подруги»</div>
                  <div className="mt-0.5 text-xs leading-snug text-muted">
                    Інші мами зможуть знайти твою анкету за інтересами. Вимкнути можна будь-коли.
                  </div>
                </div>
              </div>
            </button>
          </section>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <Button variant="outline" size="lg" onClick={() => setStep(step - 1)}>
            Назад
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            size="lg"
            full
            disabled={!canContinue}
            onClick={() => setStep(step + 1)}
          >
            Далі
          </Button>
        ) : (
          <Button size="lg" full loading={busy} onClick={finish}>
            Готово — на мапу
          </Button>
        )}
      </div>
    </div>
  )
}
