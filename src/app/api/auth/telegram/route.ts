import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * Вхід через Telegram.
 *
 * Telegram підписує дані користувача ключем бота. Ми перевіряємо підпис,
 * а тоді або знаходимо вже наявний акаунт за telegram_id, або створюємо
 * новий — і повертаємо одноразове посилання для входу.
 */
/**
 * Найпростіший лічильник спроб на адресу — щоб не можна було
 * перебирати підписи сотнями запитів. Живе в пам'яті процесу:
 * для одного сервера цього досить, для кількох варто винести в Redis.
 */
const attempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 60_000
const MAX_ATTEMPTS = 10

function rateLimited(ip: string) {
  const now = Date.now()
  const entry = attempts.get(ip)

  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    if (attempts.size > 10_000) attempts.clear()
    return false
  }

  entry.count += 1
  return entry.count > MAX_ATTEMPTS
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Telegram-вхід не налаштований' }, { status: 501 })
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Забагато спроб. Спробуй за хвилину.' },
      { status: 429, headers: { 'retry-after': '60' } },
    )
  }

  const { user, next } = (await request.json()) as {
    user: Record<string, string | number>
    next?: string
  }

  if (!verifyTelegramSignature(user, token)) {
    return NextResponse.json({ error: 'Підпис Telegram не збігається' }, { status: 401 })
  }

  // Дані старші за добу не приймаємо.
  if (Date.now() / 1000 - Number(user.auth_date) > 86_400) {
    return NextResponse.json({ error: 'Посилання застаріло, спробуй ще раз' }, { status: 401 })
  }

  const admin = supabaseAdmin()
  const telegramId = Number(user.id)
  const email = `tg${telegramId}@telegram.promam.app`
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')

  const { data: existing } = await admin
    .from('profiles_private')
    .select('id')
    .eq('telegram_id', telegramId)
    .maybeSingle()

  let userId = existing?.id ?? null

  if (!userId) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        avatar_url: user.photo_url ?? null,
        telegram_id: telegramId,
        telegram_username: user.username ?? null,
      },
    })

    if (error && !/already been registered|already exists/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (created?.user) {
      userId = created.user.id
    } else {
      // Акаунт із такою поштою вже є — знаходимо його.
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
      userId = list?.users.find((u) => u.email === email)?.id ?? null
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Не вдалося створити акаунт' }, { status: 500 })
  }

  await admin.from('profiles_private').upsert({
    id: userId,
    telegram_id: telegramId,
    telegram_username: (user.username as string) ?? null,
  })

  // Ім'я й фото з Telegram беремо лише як початкове значення —
  // якщо мама вже заповнила профіль сама, не перетираємо.
  const { data: current } = await admin
    .from('profiles')
    .select('display_name, photo_url')
    .eq('id', userId)
    .single()

  const patch: Record<string, string> = {}
  if (fullName && !current?.display_name) patch.display_name = fullName
  if (user.photo_url && !current?.photo_url) patch.photo_url = user.photo_url as string
  if (Object.keys(patch).length) {
    await admin.from('profiles').update(patch).eq('id', userId)
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
  const target = next?.startsWith('/') ? next : '/app'

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${site}/auth/callback?next=${encodeURIComponent(target)}` },
  })

  if (linkError || !link?.properties?.action_link) {
    return NextResponse.json(
      { error: linkError?.message ?? 'Не вдалося створити посилання для входу' },
      { status: 500 },
    )
  }

  return NextResponse.json({ url: link.properties.action_link })
}

/** Перевірка підпису за алгоритмом із документації Telegram. */
function verifyTelegramSignature(user: Record<string, string | number>, botToken: string) {
  const { hash, ...rest } = user
  if (!hash) return false

  const checkString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('\n')

  const secret = crypto.createHash('sha256').update(botToken).digest()
  const expected = crypto.createHmac('sha256', secret).update(checkString).digest('hex')

  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(String(hash), 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
