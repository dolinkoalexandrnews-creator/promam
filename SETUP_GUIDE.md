# 🍼 PROMAM - Setup Guide

Реальний чат для мам! Спілкуйтеся без Telegram.

---

## 🚀 **ШВИДКИЙ СТАРТ (5 хвилин)**

### 1️⃣ Копіюй репозиторій

```bash
git clone https://github.com/dolinkoalexandrnews-creator/promam.git
cd promam
```

### 2️⃣ Встанови залежності

```bash
npm install
```

### 3️⃣ Запусти локально

```bash
npm run dev
```

Відкриває: **http://localhost:3002**

---

## 💾 **Налаштування Supabase**

### Потрібно одне:

1. Йти на https://supabase.com
2. Crear новий проект (або використовуй існуючий)
3. Скопіюй credentials в `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Запусти SQL:

1. SQL Editor в Supabase Dashboard
2. Копіюй весь код з `supabase/init.sql`
3. Run ▶️

---

## 🎯 **Як користуватися**

### Регістрація:
- Email + Пароль (мін. 6 символів)
- Ім'я

### Спілкування:
1. Вкладка **Знайти** - видны мамы поруч
2. Кликни на маму - **відкриється чат**
3. Напиши повідомлення - **друга видит миттєво!** ⚡

### Вкладки:
- 🔍 **Знайти** - мамы на карті
- 💬 **Чати** - твої переписки
- 👭 **Друзі** - скоро
- 👤 **Я** - твій профіль

---

## 🔐 **Безпека**

- Всі дані в **Supabase** (захищено)
- Реал-тайм шифрування повідомлень
- Тільки справжні мами (email підтвердження)

---

## 💪 **Для розроблювачів**

**Stack:**
- Next.js 15
- React + TypeScript
- Supabase (PostgreSQL + Real-time)
- TailwindCSS
- Leaflet (карти)

**Структура:**
```
src/
├── app/          # Next.js сторінки
├── components/   # React компоненти
└── lib/         # Утиліти (Supabase клієнт)
```

---

## 🐛 **Проблеми?**

### localhost не запускається:
```bash
npm install
npm run dev
```

### Supabase connection error:
- Перевір `.env.local`
- Перезапусти `npm run dev`

### Мамы не видны в /app:
- Запусти SQL з `supabase/init.sql` в Supabase Dashboard

---

## 🚀 **Deploy на Vercel**

```bash
npm install -g vercel
vercel
```

Або на https://vercel.com/new → Import GitHub

---

## 📞 **Потрібна допомога?**

GitHub: https://github.com/dolinkoalexandrnews-creator/promam

---

**Готова спілкуватися! 💬**
