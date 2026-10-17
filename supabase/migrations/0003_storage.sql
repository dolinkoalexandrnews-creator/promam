-- =====================================================================
--  PROMAM — сховище файлів (фото профілю, фото в чатах, селфі-верифікація)
--  Запускати ПІСЛЯ 0002_circles.sql.
-- =====================================================================

-- avatars — публічні, бо показуються на мапі й у списках
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;

-- chat-photos — приватні, доступні лише учасницям чату
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-photos', 'chat-photos', false, 10485760,
        array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;

-- verification — приватні, бачать лише адміністратори
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verification', 'verification', false, 10485760,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Файли кладемо в теку з іменем користувачки: <user_id>/<file>
create policy "avatars readable by everyone"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "avatars writable by owner"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars updatable by owner"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars deletable by owner"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "chat photos writable by owner"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "chat photos readable by chat members"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'chat-photos'
    and exists (
      select 1 from public.messages m
      join public.chat_members cm on cm.chat_id = m.chat_id and cm.user_id = auth.uid()
      where m.photo_url like '%' || storage.objects.name
    )
  );

create policy "verification writable by owner"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'verification' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "verification readable by owner"
  on storage.objects for select to authenticated
  using (bucket_id = 'verification' and (storage.foldername(name))[1] = auth.uid()::text);
