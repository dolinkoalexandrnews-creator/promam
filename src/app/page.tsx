import Link from 'next/link'
import { FORMATS, FORMAT_LIST } from '@/lib/constants'
import { Faq } from '@/components/landing/Faq'
import { SignUpSection } from '@/components/landing/SignUpSection'
import { DeployWidget } from '@/components/landing/DeployWidget'
import { AuthButtons } from '@/components/landing/AuthButtons'

const STEPS = [
  {
    n: 1,
    title: 'Увійди як зручно',
    text: 'Google, пошта або Telegram — один дотик. Номер телефону підтверджується один раз і лишається ключем акаунта: саме він захищає PROMAM від фейкових профілів.',
  },
  {
    n: 2,
    title: 'Розкажи про себе й дитину',
    text: 'Фото, кілька слів, вік дитини та інтереси. Вік дитини — головне: найлегше порозумітись з мамою, у якої дитина такого ж віку.',
  },
  {
    n: 3,
    title: 'Подивись на мапу',
    text: 'Видно мам поруч і формат зустрічі: ☕ кава, 🚶 прогулянка, 🎈 майданчик, 🏠 сусідки. Фільтри — вік мами, вік дитини, інтереси.',
  },
  {
    n: 4,
    title: 'Постав свою мітку',
    text: 'Зараз або на потім (до 7 днів наперед), у кав’ярні поруч чи просто там, де ти гуляєш. Для однієї мами чи для компанії до п’ятьох. Живе до доби.',
  },
  {
    n: 5,
    title: '«Прийду» — і зустрічайтесь',
    text: 'Авторка підтверджує, вмикається спільний чат. Бот нагадає обом за годину до запланованої зустрічі.',
  },
  {
    n: 6,
    title: 'Відгук і подруги',
    text: 'Після зустрічі — чесний відгук, і якщо склалось, додай у подруги. У розділі «Подруги» — мами зі спільними інтересами.',
  },
]

const FEATURES = [
  {
    icon: '🗺️',
    title: 'Мапа поруч',
    text: 'Живі мітки мам навколо з фото, рейтингом і форматом зустрічі. Список «Хто поруч» — найближчі першими.',
  },
  {
    icon: '🏠',
    title: 'Сусідки з твого будинку',
    text: 'Окремий формат для тих, хто щодня бачиться в ліфті й так і не познайомився. Познач свій будинок — і побачиш мам із сусідніх під’їздів.',
  },
  {
    icon: '👶',
    title: 'Підбір за віком дитини',
    text: 'Мама з 8-місячним малюком і мама першокласника гуляють по-різному. Фільтр за віком дитини — у кожній мітці.',
  },
  {
    icon: '💬',
    title: 'Чат і спільні зустрічі',
    text: 'Повідомлення приходять миттєво, фото на весь екран, відповідь реплаєм. У компанії до п’яти мам — спільний чат мітки.',
  },
  {
    icon: '👭',
    title: 'Подруги',
    text: 'Анкета з інтересами й пошук мам, які шукають подругу не на один вечір. Анкета показується лише за твоїм бажанням.',
  },
  {
    icon: '⭐',
    title: 'Чесні відгуки',
    text: 'Відгук можна лишити лише після реальної зустрічі. Жодних накручених оцінок.',
  },
  {
    icon: '🆘',
    title: 'SOS і довірені особи',
    text: 'Утримай кнопку — довірені особи дізнаються, де ти і з ким зустріч. Таймер «Все ок» спитає, чи все гаразд.',
  },
  {
    icon: '🛡️',
    title: 'Контроль і підтримка',
    text: 'Блокування, верифікація селфі, модерація скарг і підтримка просто в застосунку.',
  },
  {
    icon: '🤝',
    title: 'Взаємодопомога',
    text: 'Окремий формат: посидіти з дитиною годину, підвезти на гурток, позичити візочок. Мами виручають мам.',
  },
]

const SAFETY = [
  'Лише справжні мами: номер телефону підтверджується один раз і стає ключем акаунта. Фейк — блокування, номер у чорний список.',
  'Кнопка SOS і таймер «Все ок»: довірені особи дізнаються, де ти. При загрозі життю — одразу 112.',
  'Заблокуй будь-кого: ви не бачитимете міток одна одної, писати й дзвонити буде неможливо.',
  'Відгуки лише після реальних зустрічей, ручна верифікація селфі, модерація скарг.',
  'Твої дані: телефон бачать лише адміністратори, точну адресу дому ніхто не бачить — лише приблизний район.',
  'PROMAM не організовує зустрічі — спілкування відбувається між людьми.',
]

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-cream">
      <DeployWidget />
      {/* Шапка */}
      <header className="sticky top-0 z-50 border-b border-line/30 bg-gradient-to-r from-white via-white to-rose-50/20 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition">
            PRO<span className="text-rose-500">MAM</span>
          </Link>
          <AuthButtons />
        </div>
      </header>

      {/* Герой */}
      <section className="mx-auto max-w-6xl px-5 pt-8 pb-16 sm:pt-14">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
          Безкоштовно · вхід у два дотики · лише мами
        </p>
        <h1 className="max-w-3xl text-4xl leading-[1.08] font-bold tracking-tight sm:text-6xl">
          Знайди маму поруч
          <span className="mt-2 block text-rose-500">PROMAM</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          Мапа мам навколо тебе, які готові зустрітися — на каву, на прогулянку з візочком, на
          майданчику. Або просто познайомитися з тією, з ким щодня мовчки їдеш у ліфті. Постав
          мітку, заплануй зустріч на вихідні, знайди подругу зі спільними інтересами.
        </p>

        <SignUpSection />

        {/* Формати */}
        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {FORMAT_LIST.map((key) => {
            const f = FORMATS[key]
            return (
              <div
                key={key}
                className="rounded-2xl border border-line bg-white/70 p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="text-2xl">{f.emoji}</div>
                <div className="mt-2 font-semibold">{f.label}</div>
                <div className="mt-1 text-xs leading-snug text-muted">{f.hint}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Як це працює */}
      <section id="how" className="border-y border-line bg-sand/50 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Як це працює</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-line bg-white p-6">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-rose-100 font-bold text-rose-700">
                  {s.n}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted">
            Усе працює просто в браузері телефона — нічого встановлювати не потрібно.
          </p>
        </div>
      </section>

      {/* Що вміє */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Що вміє PROMAM</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-line bg-white p-6">
                <div className="text-2xl">{f.icon}</div>
                <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Безпека */}
      <section className="border-y border-line bg-ink py-16 text-cream">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Безпека — не опція</h2>
          <ul className="mt-8 space-y-4">
            {SAFETY.map((s) => (
              <li key={s} className="flex gap-3 text-sm leading-relaxed text-cream/80">
                <span className="mt-0.5 text-rose-300">◆</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Faq />

      {/* Фінальний заклик */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Готова познайомитись?</h2>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Відкрий мапу й подивись, хто вже поруч. Або приєднайся прямо зараз! 💚
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <SignUpSection />
        </div>
      </section>

      <footer className="border-t border-line py-10 text-center text-sm text-muted">
        <div className="font-semibold text-ink">
          PRO<span className="text-rose-500">MAM</span>
        </div>
        <p className="mt-2">Мами знаходять мам. © {new Date().getFullYear()}</p>
      </footer>
    </main>
  )
}
