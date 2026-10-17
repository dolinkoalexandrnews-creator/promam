import { initials } from '@/lib/format'

const SIZES = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-xl',
  xl: 'h-28 w-28 text-3xl',
} as const

export function Avatar({
  src,
  name,
  size = 'md',
  verified = false,
  ring = false,
}: {
  src?: string | null
  name: string
  size?: keyof typeof SIZES
  verified?: boolean
  ring?: boolean
}) {
  return (
    <div className="relative shrink-0">
      {src ? (
        // Фото приходять із Supabase Storage, Google і Telegram — звичайний <img>
        // тут простіший за next/image і не вимагає налаштування доменів.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className={`${SIZES[size]} rounded-full object-cover ${
            ring ? 'ring-2 ring-white' : ''
          }`}
        />
      ) : (
        <div
          className={`${SIZES[size]} grid place-items-center rounded-full bg-rose-100 font-semibold text-rose-700 ${
            ring ? 'ring-2 ring-white' : ''
          }`}
        >
          {initials(name)}
        </div>
      )}
      {verified && (
        <span
          title="Профіль верифіковано"
          className="absolute -right-0.5 -bottom-0.5 grid h-4 w-4 place-items-center rounded-full bg-sage-500 text-[9px] text-white ring-2 ring-white"
        >
          ✓
        </span>
      )}
    </div>
  )
}
