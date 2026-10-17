'use client'

import { useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/controls'

/** Вибір і завантаження фото профілю в Supabase Storage. */
export function PhotoPicker({
  userId,
  onUploaded,
  label = 'Додати фото',
}: {
  userId: string
  onUploaded: (url: string) => void
  label?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File) {
    setBusy(true)
    setError(null)
    try {
      const sb = supabaseBrowser()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${userId}/${Date.now()}.${ext}`

      const { error: uploadError } = await sb.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' })
      if (uploadError) throw uploadError

      const { data } = sb.storage.from('avatars').getPublicUrl(path)
      onUploaded(data.publicUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void upload(file)
          e.target.value = ''
        }}
      />
      <Button variant="outline" loading={busy} onClick={() => input.current?.click()}>
        {label}
      </Button>
      {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}
    </div>
  )
}
