-- =====================================================================
--  PROMAM — кола (блоки): за віком дитини та за життєвою ситуацією
--
--  Коло = спільнота зі своїм чатом. Два типи:
--    age  — «Мама однорічки», «Мама 3-річки» … Публічні, видно в профілі.
--    life — «В мене був викидень», «Я хочу бути мамою» … ЧУТЛИВІ:
--           членство приватне, у профілі не показується, у чаті можна
--           бути під псевдонімом («Мама №142»), і справжнє ім'я
--           технічно недоступне іншим учасницям.
--
--  Запускати ПІСЛЯ 0001_init.sql.
-- =====================================================================

create type circle_kind as enum ('age', 'life', 'interest');

alter table public.chats add column circle_id uuid;

create table public.circles (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  kind            circle_kind not null,
  emoji           text not null default '👩',
  title           text not null,
  subtitle        text,
  description     text,

  -- Чутливе коло: членство ніколи не публічне, вхід можливий під псевдонімом.
  is_sensitive    boolean not null default false,
  allow_anonymous boolean not null default false,

  -- Автопідбір за віком дитини (у місяцях), щоб пропонувати коло самій
  auto_child_age_min int,
  auto_child_age_max int,

  sort_order      int not null default 0,
  chat_id         uuid references public.chats(id) on delete set null,
  members_count   int not null default 0,
  created_at      timestamptz not null default now()
);

alter table public.chats
  add constraint chats_circle_fk foreign key (circle_id) references public.circles(id) on delete cascade;

create table public.circle_members (
  circle_id  uuid not null references public.circles(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  anonymous  boolean not null default false,
  alias      text,                       -- «Мама №142», коли anonymous
  joined_at  timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create index circle_members_user_idx on public.circle_members (user_id);

-- ---------------------------------------------------------------------
--  Вступ у коло / вихід
-- ---------------------------------------------------------------------

-- Кожне коло має свій чат.
create or replace function public.ensure_circle_chat(c_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare existing uuid;
begin
  select chat_id into existing from public.circles where id = c_id;
  if existing is not null then return existing; end if;

  insert into public.chats (is_group, circle_id) values (true, c_id) returning id into existing;
  update public.circles set chat_id = existing where id = c_id;
  return existing;
end $$;

create or replace function public.join_circle(c_id uuid, as_anonymous boolean default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  c         public.circles;
  chat      uuid;
  anon      boolean;
  next_num  int;
  my_alias  text;
begin
  if auth.uid() is null then raise exception 'Потрібна авторизація'; end if;

  select * into c from public.circles where id = c_id;
  if c.id is null then raise exception 'Коло не знайдено'; end if;

  -- У чутливих колах анонімність — стан за замовчуванням.
  anon := coalesce(as_anonymous, c.is_sensitive);
  if anon and not c.allow_anonymous then anon := false; end if;

  if anon then
    select coalesce(count(*), 0)::int + 1 into next_num
      from public.circle_members where circle_id = c_id;
    my_alias := 'Мама №' || next_num;
  end if;

  insert into public.circle_members (circle_id, user_id, anonymous, alias)
  values (c_id, auth.uid(), anon, my_alias)
  on conflict (circle_id, user_id) do update
    set anonymous = excluded.anonymous,
        alias = coalesce(public.circle_members.alias, excluded.alias);

  chat := public.ensure_circle_chat(c_id);
  insert into public.chat_members (chat_id, user_id) values (chat, auth.uid())
    on conflict do nothing;

  update public.circles set members_count = (
    select count(*) from public.circle_members where circle_id = c_id
  ) where id = c_id;
end $$;

create or replace function public.leave_circle(c_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare chat uuid;
begin
  select chat_id into chat from public.circles where id = c_id;
  delete from public.circle_members where circle_id = c_id and user_id = auth.uid();
  if chat is not null then
    delete from public.chat_members where chat_id = chat and user_id = auth.uid();
  end if;
  update public.circles set members_count = (
    select count(*) from public.circle_members where circle_id = c_id
  ) where id = c_id;
end $$;

-- ---------------------------------------------------------------------
--  Кола для списку: з позначкою «я тут» і «підходить мені»
-- ---------------------------------------------------------------------
create or replace function public.list_circles()
returns table (
  id              uuid,
  slug            text,
  kind            circle_kind,
  emoji           text,
  title           text,
  subtitle        text,
  description     text,
  is_sensitive    boolean,
  allow_anonymous boolean,
  members_count   int,
  chat_id         uuid,
  is_member       boolean,
  i_am_anonymous  boolean,
  suggested       boolean
)
language sql stable security definer set search_path = public as $$
  with my_kids as (
    select public.child_age_months(birth_month) as m
    from public.children where profile_id = auth.uid()
  )
  select
    c.id, c.slug, c.kind, c.emoji, c.title, c.subtitle, c.description,
    c.is_sensitive, c.allow_anonymous,
    -- У чутливих колах кількість учасниць не показуємо точно (анонімність групи).
    case when c.is_sensitive then null else c.members_count end,
    c.chat_id,
    m.user_id is not null,
    coalesce(m.anonymous, false),
    c.kind = 'age' and exists (
      select 1 from my_kids k
      where (c.auto_child_age_min is null or k.m >= c.auto_child_age_min)
        and (c.auto_child_age_max is null or k.m <= c.auto_child_age_max)
    )
  from public.circles c
  left join public.circle_members m on m.circle_id = c.id and m.user_id = auth.uid()
  order by c.kind, c.sort_order, c.title
$$;

-- ---------------------------------------------------------------------
--  Повідомлення кола — завжди через цю функцію.
--  Для анонімних учасниць справжній sender_id назовні не віддається.
-- ---------------------------------------------------------------------
create or replace function public.circle_messages(c_id uuid, before timestamptz default null, lim int default 100)
returns table (
  id          uuid,
  author_key  text,      -- стабільний ключ для групування, не uuid користувачки
  author_name text,
  author_photo text,
  is_mine     boolean,
  anonymous   boolean,
  body        text,
  photo_url   text,
  created_at  timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    msg.id,
    case when cm.anonymous then 'anon:' || md5(msg.sender_id::text || c_id::text)
         else 'user:' || msg.sender_id::text end,
    case when cm.anonymous then coalesce(cm.alias, 'Анонімна мама') else p.display_name end,
    case when cm.anonymous then null else p.photo_url end,
    msg.sender_id = auth.uid(),
    coalesce(cm.anonymous, false),
    msg.body,
    msg.photo_url,
    msg.created_at
  from public.messages msg
  join public.circles c  on c.id = c_id and c.chat_id = msg.chat_id
  join public.profiles p on p.id = msg.sender_id
  left join public.circle_members cm on cm.circle_id = c_id and cm.user_id = msg.sender_id
  where msg.deleted_at is null
    and exists (select 1 from public.circle_members me
                 where me.circle_id = c_id and me.user_id = auth.uid())
    and (before is null or msg.created_at < before)
  order by msg.created_at desc
  limit least(coalesce(lim, 100), 200)
$$;

create or replace function public.send_circle_message(c_id uuid, text_body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare chat uuid; new_id uuid;
begin
  if auth.uid() is null then raise exception 'Потрібна авторизація'; end if;
  if coalesce(btrim(text_body), '') = '' then raise exception 'Порожнє повідомлення'; end if;

  if not exists (select 1 from public.circle_members
                  where circle_id = c_id and user_id = auth.uid()) then
    raise exception 'Спочатку приєднайся до кола';
  end if;

  select chat_id into chat from public.circles where id = c_id;
  insert into public.messages (chat_id, sender_id, body)
  values (chat, auth.uid(), btrim(text_body))
  returning id into new_id;
  return new_id;
end $$;

-- ---------------------------------------------------------------------
--  RLS
-- ---------------------------------------------------------------------
alter table public.circles        enable row level security;
alter table public.circle_members enable row level security;

create policy circles_read on public.circles for select to authenticated using (true);

-- Своє членство бачиш завжди. Чуже — лише в НЕчутливих колах і лише
-- якщо учасниця не анонімна.
create policy circle_members_read on public.circle_members for select
  to authenticated using (
    user_id = auth.uid()
    or (
      not anonymous
      and exists (select 1 from public.circles c where c.id = circle_id and not c.is_sensitive)
      and exists (select 1 from public.circle_members me
                   where me.circle_id = circle_members.circle_id and me.user_id = auth.uid())
    )
  );

create policy circle_members_leave on public.circle_members for delete
  to authenticated using (user_id = auth.uid());
create policy circle_members_update on public.circle_members for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Чати чутливих кіл не можна читати напряму — лише через circle_messages(),
-- яка підміняє ім'я на псевдонім. Інакше анонімність була б уявною.
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select
  to authenticated using (
    exists (select 1 from public.chat_members m
             where m.chat_id = messages.chat_id and m.user_id = auth.uid())
    and not exists (select 1 from public.chats ch
                     join public.circles c on c.id = ch.circle_id
                    where ch.id = messages.chat_id and c.is_sensitive)
  );

-- Писати в чутливе коло теж лише через send_circle_message().
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert
  to authenticated with check (
    sender_id = auth.uid()
    and exists (select 1 from public.chat_members m
                 where m.chat_id = messages.chat_id and m.user_id = auth.uid())
    and not exists (select 1 from public.chats ch
                     join public.circles c on c.id = ch.circle_id
                    where ch.id = messages.chat_id and c.is_sensitive)
  );

-- =====================================================================
--  Наповнення: кола за віком дитини
-- =====================================================================
insert into public.circles
  (slug, kind, emoji, title, subtitle, description,
   auto_child_age_min, auto_child_age_max, sort_order)
values
  ('pregnant', 'age', '🤰', 'Я вагітна',
   'Чекаємо на малюка',
   'Для тих, хто ще готується. Обмін досвідом про пологові, аналізи, сумки в пологовий і страхи, про які незручно питати.',
   null, null, 0),

  ('newborn', 'age', '🍼', 'Мама немовляти',
   '0–12 місяців',
   'Найважчі перші місяці: сон, ГВ, кольки, перші щеплення. Тут не сплять разом з тобою о третій ночі.',
   0, 11, 1),

  ('age-1', 'age', '🧸', 'Мама однорічки',
   '1 рік',
   'Перші кроки, перші слова, перші істерики. Майданчик, прикорм, вибір садка.',
   12, 23, 2),

  ('age-2', 'age', '🚂', 'Мама 2-річки',
   '2 роки',
   'Криза двох років, горщик, перші гуртки й питання «а чи час у садок».',
   24, 35, 3),

  ('age-3', 'age', '🎨', 'Мама 3-річки',
   '3 роки',
   'Адаптація в садочку, тисяча «чому», перші справжні друзі на майданчику.',
   36, 47, 4),

  ('age-4', 'age', '🪁', 'Мама 4-річки',
   '4 роки',
   'Гуртки, характер, перші конфлікти з дітьми. І перша вільна година для себе.',
   48, 59, 5),

  ('age-5', 'age', '📚', 'Мама 5-річки',
   '5 років',
   'Підготовка до школи, літери й цифри, вибір школи та як не перевантажити.',
   60, 71, 6),

  ('age-6', 'age', '🎒', 'Мама 6-річки',
   '6 років',
   'Останній рік перед школою: готовність, співбесіди, ранці й хвилювання — більше мамине, ніж дитяче.',
   72, 83, 7),

  ('school', 'age', '✏️', 'Мама школярки/школяра',
   '7+ років',
   'Уроки, вчителі, гуртки, екранний час і як лишитись у контакті.',
   84, 155, 8),

  ('teen', 'age', '🎧', 'Мама підлітка',
   '13+ років',
   'Коли дитина більше не розповідає. Межі, довіра, і як пережити це разом.',
   156, null, 9);

-- =====================================================================
--  Наповнення: чутливі кола.
--  Приватні, з анонімністю за замовчуванням.
-- =====================================================================
insert into public.circles
  (slug, kind, emoji, title, subtitle, description, is_sensitive, allow_anonymous, sort_order)
values
  ('miscarriage', 'life', '🤍', 'В мене був викидень',
   'Приватне коло · можна анонімно',
   'Тихе місце для тих, хто втратив вагітність. Без порад «ще народиш» і без питань, на які не хочеться відповідати. Тут можна просто бути почутою.',
   true, true, 0),

  ('abortion', 'life', '🕊️', 'В мене був аборт',
   'Приватне коло · можна анонімно',
   'Без осуду і без пояснень. Простір для тих, кому треба виговоритись або просто знати, що вона не одна.',
   true, true, 1),

  ('want-to-be-mom', 'life', '🌱', 'Я хочу бути мамою',
   'Приватне коло · можна анонімно',
   'Планування, довге очікування, лікарі, ЕКЗ, спроби й зриви. Для тих, у кого дорога до материнства виявилась довшою, ніж здавалось.',
   true, true, 2);

-- Створюємо чат кожному колу одразу.
do $$
declare c record;
begin
  for c in select id from public.circles loop
    perform public.ensure_circle_chat(c.id);
  end loop;
end $$;
