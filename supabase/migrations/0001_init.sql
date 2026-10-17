-- =====================================================================
--  PROMAM — початкова схема бази даних
--  Мапа мам поруч: кава, прогулянка, майданчик, сусідки по будинку.
--
--  Запускати в Supabase → SQL Editor → New query → Run.
-- =====================================================================

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
--  Перелічення (enums)
-- ---------------------------------------------------------------------

-- Формати зустрічей. "neighbors" — це і є «познайомитися в ліфті»:
-- мітка для мам із того самого будинку чи двору.
create type meet_format as enum (
  'coffee',      -- ☕ кава
  'walk',        -- 🚶 прогулянка з візочком
  'playground',  -- 🎈 дитячий майданчик
  'neighbors',   -- 🏠 сусідки: той самий будинок/двір
  'activity',    -- 🧘 спорт, йога, басейн
  'help'         -- 🤝 взаємодопомога (посидіти з дитиною, підвезти)
);

create type pin_status as enum ('active', 'full', 'done', 'cancelled', 'expired');

create type participant_status as enum (
  'requested',  -- натиснула «Прийду», авторка ще не підтвердила
  'accepted',   -- авторка підтвердила
  'declined',   -- авторка відмовила
  'on_the_way', -- «Вирушаю»
  'arrived',    -- на місці
  'cancelled'   -- передумала
);

create type friendship_status as enum ('pending', 'accepted', 'declined');

create type verification_status as enum ('none', 'pending', 'verified', 'rejected');

create type report_status as enum ('open', 'reviewing', 'resolved', 'rejected');

create type notification_type as enum (
  'pin_join_request', 'pin_accepted', 'pin_declined', 'pin_reminder',
  'pin_on_the_way', 'new_message', 'friend_request', 'friend_accepted',
  'new_review', 'sos', 'system'
);

-- ---------------------------------------------------------------------
--  profiles — анкета мами
-- ---------------------------------------------------------------------
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,

  display_name     text        not null default '',
  photo_url        text,
  bio              text        default '',
  city             text,
  birth_year       int,                       -- вік мами рахуємо з року

  -- Телефон, Telegram і координати дому НЕ зберігаються тут:
  -- вони в profiles_private, куди має доступ лише сама власниця.
  -- Тут лишається тільки «значок довіри» — факт підтвердження.
  phone_verified   boolean     not null default false,

  interests        text[]      not null default '{}',
  -- які формати зустрічей цікавлять
  looking_for      meet_format[] not null default '{}',

  -- Текстовий орієнтир, який мама пише сама й свідомо показує сусідкам.
  home_label       text,                      -- напр. «ЖК Сонячний, 3 під'їзд»

  -- Анкета «Подруги» показується, лише якщо мама сама дозволила.
  show_in_friends  boolean     not null default false,

  rating           numeric(3,2) not null default 0,
  reviews_count    int          not null default 0,

  verification     verification_status not null default 'none',

  is_banned        boolean     not null default false,
  ban_reason       text,

  onboarded_at     timestamptz,
  last_seen_at     timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint birth_year_sane check (birth_year is null or birth_year between 1950 and extract(year from now())::int - 14)
);

create index profiles_friends_idx on public.profiles (show_in_friends) where show_in_friends;

-- ---------------------------------------------------------------------
--  profiles_private — те, що не має бачити НІХТО, крім самої мами
--
--  Головна причина окремої таблиці: у Postgres політика RLS працює на
--  рівні рядка, а не колонки. Якби координати дому й телефон лежали в
--  profiles, будь-яка авторизована користувачка могла б прочитати їх
--  простим запитом — попри те, що інтерфейс їх не показує.
-- ---------------------------------------------------------------------
create table public.profiles_private (
  id                uuid primary key references public.profiles(id) on delete cascade,

  -- Номер телефону — ключ акаунта й головний захист від фейків.
  phone             text unique,

  -- Telegram (коли вхід або сповіщення через бота)
  telegram_id       bigint unique,
  telegram_username text,

  -- Приблизне місце дому. Назовні з нього віддається лише відстань.
  home_point        geography(Point, 4326),

  verification_photo_url text,

  updated_at        timestamptz not null default now()
);

create index profiles_private_home_idx on public.profiles_private using gist (home_point);

-- ---------------------------------------------------------------------
--  children — діти (вік дитини головний фільтр підбору)
-- ---------------------------------------------------------------------
create table public.children (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  name        text,
  birth_month date not null,        -- зберігаємо 1-ше число місяця, день не потрібен
  gender      text check (gender in ('girl', 'boy', 'other')),
  created_at  timestamptz not null default now()
);

create index children_profile_idx on public.children (profile_id);

-- Вік дитини в місяцях — зручно для фільтрів «однолітки».
create or replace function public.child_age_months(birth_month date)
returns int language sql immutable as $$
  select greatest(0, (extract(year from age(current_date, birth_month)) * 12
                    + extract(month from age(current_date, birth_month)))::int)
$$;

-- ---------------------------------------------------------------------
--  pins — мітки на мапі
-- ---------------------------------------------------------------------
create table public.pins (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.profiles(id) on delete cascade,

  format        meet_format not null,
  title         text not null,
  description   text default '',

  point         geography(Point, 4326) not null,
  place_name    text,                               -- «Кав'ярня Aroma, вул. Січових»

  starts_at     timestamptz not null default now(), -- «зараз» або заплановано
  expires_at    timestamptz not null,               -- мітка живе до доби
  capacity      int not null default 1 check (capacity between 1 and 5),

  -- кого шукає авторка
  want_mom_age_min   int,
  want_mom_age_max   int,
  want_child_age_min int,   -- у місяцях
  want_child_age_max int,

  status        pin_status not null default 'active',
  chat_id       uuid,                               -- груповий чат мітки (FK нижче)

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint pin_window check (expires_at > starts_at),
  constraint pin_not_too_far check (starts_at < now() + interval '8 days')
);

create index pins_point_idx  on public.pins using gist (point);
create index pins_active_idx on public.pins (status, expires_at);
create index pins_author_idx on public.pins (author_id);

-- ---------------------------------------------------------------------
--  pin_participants — хто йде на зустріч
-- ---------------------------------------------------------------------
create table public.pin_participants (
  pin_id     uuid not null references public.pins(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  status     participant_status not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (pin_id, user_id)
);

create index pin_participants_user_idx on public.pin_participants (user_id);

-- ---------------------------------------------------------------------
--  Чати
-- ---------------------------------------------------------------------
create table public.chats (
  id         uuid primary key default gen_random_uuid(),
  pin_id     uuid references public.pins(id) on delete set null,
  is_group   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.pins
  add constraint pins_chat_fk foreign key (chat_id) references public.chats(id) on delete set null;

create table public.chat_members (
  chat_id      uuid not null references public.chats(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default 'epoch',
  created_at   timestamptz not null default now(),
  primary key (chat_id, user_id)
);

create index chat_members_user_idx on public.chat_members (user_id);

create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  chat_id     uuid not null references public.chats(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  body        text,
  photo_url   text,
  reply_to    uuid references public.messages(id) on delete set null,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  constraint message_has_content check (body is not null or photo_url is not null)
);

create index messages_chat_idx on public.messages (chat_id, created_at desc);

-- Приватний чат 1-на-1: один на пару, незалежно від порядку.
create table public.direct_chats (
  user_a  uuid not null references public.profiles(id) on delete cascade,
  user_b  uuid not null references public.profiles(id) on delete cascade,
  chat_id uuid not null references public.chats(id) on delete cascade,
  primary key (user_a, user_b),
  constraint direct_pair_ordered check (user_a < user_b)
);

-- ---------------------------------------------------------------------
--  Соціальне: подруги, блокування, відгуки
-- ---------------------------------------------------------------------
create table public.friendships (
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status       friendship_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  constraint no_self_friend check (requester_id <> addressee_id)
);

create index friendships_addressee_idx on public.friendships (addressee_id, status);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

create index blocks_blocked_idx on public.blocks (blocked_id);

-- Відгук можна лишити тільки після реальної зустрічі (перевіряємо тригером).
create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.profiles(id) on delete cascade,
  pin_id     uuid not null references public.pins(id) on delete cascade,
  rating     int  not null check (rating between 1 and 5),
  text       text default '',
  created_at timestamptz not null default now(),
  unique (author_id, subject_id, pin_id),
  constraint no_self_review check (author_id <> subject_id)
);

create index reviews_subject_idx on public.reviews (subject_id);

-- ---------------------------------------------------------------------
--  Безпека: довірені особи, SOS, скарги
-- ---------------------------------------------------------------------
create table public.trusted_contacts (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  phone      text,
  telegram   text,
  created_at timestamptz not null default now(),
  constraint contact_has_channel check (phone is not null or telegram is not null)
);

create index trusted_contacts_owner_idx on public.trusted_contacts (owner_id);

create table public.sos_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  point       geography(Point, 4326),
  pin_id      uuid references public.pins(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.reports (
  id             uuid primary key default gen_random_uuid(),
  reporter_id    uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete cascade,
  target_pin_id  uuid references public.pins(id) on delete cascade,
  message_id     uuid references public.messages(id) on delete cascade,
  reason         text not null,
  details        text,
  status         report_status not null default 'open',
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  Сповіщення та push-підписки
-- ---------------------------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       notification_type not null,
  payload    jsonb not null default '{}',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  keys       jsonb not null,
  created_at timestamptz not null default now()
);

-- Колекційні картки за перші дії
create table public.cards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null,          -- 'first_pin' | 'first_meet' | 'first_review' | ...
  serial     int  not null,
  issued_at  timestamptz not null default now(),
  unique (user_id, kind),
  unique (kind, serial)
);

-- =====================================================================
--  Тригери та функції
-- =====================================================================

-- updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch         before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger pins_touch             before update on public.pins
  for each row execute function public.touch_updated_at();
create trigger pin_participants_touch before update on public.pin_participants
  for each row execute function public.touch_updated_at();
create trigger friendships_touch      before update on public.friendships
  for each row execute function public.touch_updated_at();

-- Захищені поля профілю.
--
-- Політика profiles_update дозволяє мамі редагувати СВІЙ рядок — а це
-- означає будь-яку колонку, зокрема рейтинг, значок верифікації й
-- is_banned. Цей тригер мовчки повертає такі поля до попередніх значень
-- для звичайних користувачок; змінити їх можуть лише тригери й функції
-- з security definer — усередині них current_user уже не 'authenticated',
-- а власник функції, тож перевірка їх пропускає.
create or replace function public.guard_profile_columns()
returns trigger language plpgsql as $$
begin
  if current_user = 'authenticated' then
    new.rating        := old.rating;
    new.reviews_count := old.reviews_count;
    new.verification  := old.verification;
    new.phone_verified := old.phone_verified;
    new.is_banned     := old.is_banned;
    new.ban_reason    := old.ban_reason;
    new.created_at    := old.created_at;
  end if;
  return new;
end $$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_columns();

-- Профіль створюється автоматично разом з користувачем.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, photo_url, phone_verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name',
             new.raw_user_meta_data ->> 'name',
             split_part(coalesce(new.email, ''), '@', 1),
             ''),
    new.raw_user_meta_data ->> 'avatar_url',
    new.phone is not null
  )
  on conflict (id) do nothing;

  insert into public.profiles_private (id, phone, telegram_id, telegram_username)
  values (
    new.id,
    new.phone,
    nullif(new.raw_user_meta_data ->> 'telegram_id', '')::bigint,
    new.raw_user_meta_data ->> 'telegram_username'
  )
  on conflict (id) do nothing;

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Кожна нова мітка одразу отримує свій груповий чат.
create or replace function public.create_pin_chat()
returns trigger language plpgsql security definer set search_path = public as $$
declare new_chat uuid;
begin
  insert into public.chats (pin_id, is_group) values (new.id, new.capacity > 1)
  returning id into new_chat;

  insert into public.chat_members (chat_id, user_id) values (new_chat, new.author_id);

  update public.pins set chat_id = new_chat where id = new.id;
  return new;
end $$;

create trigger pins_create_chat
  after insert on public.pins
  for each row execute function public.create_pin_chat();

-- Підтверджена учасниця потрапляє в чат мітки; мітка закривається, коли місць немає.
create or replace function public.sync_participant()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  accepted_count int;
  pin_row public.pins;
begin
  select * into pin_row from public.pins where id = new.pin_id;

  if new.status in ('accepted', 'on_the_way', 'arrived') then
    insert into public.chat_members (chat_id, user_id)
    values (pin_row.chat_id, new.user_id)
    on conflict do nothing;
  end if;

  select count(*) into accepted_count
  from public.pin_participants
  where pin_id = new.pin_id and status in ('accepted', 'on_the_way', 'arrived');

  update public.pins
     set status = case
                    when status in ('done', 'cancelled', 'expired') then status
                    when accepted_count >= pin_row.capacity then 'full'::pin_status
                    else 'active'::pin_status
                  end
   where id = new.pin_id;

  return new;
end $$;

create trigger pin_participants_sync
  after insert or update of status on public.pin_participants
  for each row execute function public.sync_participant();

-- Рейтинг профілю перераховується з відгуків.
create or replace function public.recalc_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare target uuid := coalesce(new.subject_id, old.subject_id);
begin
  update public.profiles p
     set rating = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where subject_id = target), 0),
         reviews_count = (select count(*) from public.reviews where subject_id = target)
   where p.id = target;
  return null;
end $$;

create trigger reviews_recalc
  after insert or update or delete on public.reviews
  for each row execute function public.recalc_rating();

-- Відгук — лише після зустрічі, на якій обидві були підтверджені.
create or replace function public.enforce_real_meeting()
returns trigger language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  select exists (
    select 1
    from public.pins p
    where p.id = new.pin_id
      and p.starts_at < now()
      and (
        -- авторка пише гостю, або гість авторці, або гість гостю
        (p.author_id = new.author_id and exists (
            select 1 from public.pin_participants pp
            where pp.pin_id = p.id and pp.user_id = new.subject_id
              and pp.status in ('accepted','on_the_way','arrived')))
        or
        (p.author_id = new.subject_id and exists (
            select 1 from public.pin_participants pp
            where pp.pin_id = p.id and pp.user_id = new.author_id
              and pp.status in ('accepted','on_the_way','arrived')))
        or
        (exists (select 1 from public.pin_participants pp
                 where pp.pin_id = p.id and pp.user_id = new.author_id
                   and pp.status in ('accepted','on_the_way','arrived'))
         and exists (select 1 from public.pin_participants pp
                 where pp.pin_id = p.id and pp.user_id = new.subject_id
                   and pp.status in ('accepted','on_the_way','arrived')))
      )
  ) into ok;

  if not ok then
    raise exception 'Відгук можна лишити лише після реальної зустрічі';
  end if;
  return new;
end $$;

create trigger reviews_require_meeting
  before insert on public.reviews
  for each row execute function public.enforce_real_meeting();

-- Блокування працює в обидва боки: прибираємо з подруг і з чатів.
create or replace function public.apply_block()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.friendships
   where (requester_id = new.blocker_id and addressee_id = new.blocked_id)
      or (requester_id = new.blocked_id and addressee_id = new.blocker_id);
  return new;
end $$;

create trigger blocks_apply
  after insert on public.blocks
  for each row execute function public.apply_block();

-- =====================================================================
--  Функції для застосунку
-- =====================================================================

-- Чи заблокована пара (в будь-який бік)
create or replace function public.is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks
     where (blocker_id = a and blocked_id = b)
        or (blocker_id = b and blocked_id = a)
  )
$$;

-- Головна функція мапи: мітки поруч, уже відфільтровані й з відстанню.
create or replace function public.nearby_pins(
  in_lat        double precision,
  in_lng        double precision,
  radius_m      int default 5000,
  in_formats    meet_format[] default null,
  mom_age_min   int default null,
  mom_age_max   int default null,
  child_age_min int default null,   -- місяці
  child_age_max int default null
)
returns table (
  id              uuid,
  author_id       uuid,
  author_name     text,
  author_photo    text,
  author_rating   numeric,
  author_reviews  int,
  author_verified boolean,
  author_children jsonb,
  format          meet_format,
  title           text,
  description     text,
  place_name      text,
  lat             double precision,
  lng             double precision,
  distance_m      double precision,
  starts_at       timestamptz,
  expires_at      timestamptz,
  capacity        int,
  accepted_count  bigint,
  status          pin_status,
  chat_id         uuid,
  is_mine         boolean,
  my_status       participant_status,
  can_join        boolean,
  block_reason    text
)
language sql stable security definer set search_path = public as $$
  with me as (
    select p.id,
           case when p.birth_year is null then null
                else extract(year from now())::int - p.birth_year end as mom_age
    from public.profiles p where p.id = auth.uid()
  ),
  my_children as (
    select coalesce(min(public.child_age_months(birth_month)), null) as youngest,
           coalesce(max(public.child_age_months(birth_month)), null) as oldest
    from public.children where profile_id = auth.uid()
  )
  select
    p.id,
    a.id,
    a.display_name,
    a.photo_url,
    a.rating,
    a.reviews_count,
    a.verification = 'verified',
    coalesce((
      select jsonb_agg(jsonb_build_object(
               'name', c.name,
               'gender', c.gender,
               'age_months', public.child_age_months(c.birth_month))
             order by c.birth_month desc)
      from public.children c where c.profile_id = a.id
    ), '[]'::jsonb),
    p.format,
    p.title,
    p.description,
    p.place_name,
    st_y(p.point::geometry),
    st_x(p.point::geometry),
    st_distance(p.point, st_makepoint(in_lng, in_lat)::geography),
    p.starts_at,
    p.expires_at,
    p.capacity,
    coalesce(ac.n, 0),
    p.status,
    p.chat_id,
    p.author_id = auth.uid(),
    pp.status,
    -- чи може поточна мама приєднатися
    (p.author_id <> auth.uid()
     and p.status = 'active'
     and coalesce(ac.n, 0) < p.capacity
     and (p.want_mom_age_min is null or (select mom_age from me) >= p.want_mom_age_min)
     and (p.want_mom_age_max is null or (select mom_age from me) <= p.want_mom_age_max)
     and (p.want_child_age_min is null or (select oldest from my_children) >= p.want_child_age_min)
     and (p.want_child_age_max is null or (select youngest from my_children) <= p.want_child_age_max)),
    case
      when p.author_id = auth.uid() then null
      when p.want_mom_age_min is not null and (select mom_age from me) < p.want_mom_age_min
        then 'Авторка шукає мам від ' || p.want_mom_age_min || ' років'
      when p.want_mom_age_max is not null and (select mom_age from me) > p.want_mom_age_max
        then 'Авторка шукає мам до ' || p.want_mom_age_max || ' років'
      when p.want_child_age_min is not null and (select oldest from my_children) < p.want_child_age_min
        then 'Авторка шукає мам із старшими дітьми'
      when p.want_child_age_max is not null and (select youngest from my_children) > p.want_child_age_max
        then 'Авторка шукає мам із молодшими дітьми'
      when coalesce(ac.n, 0) >= p.capacity then 'Місць більше немає'
      else null
    end
  from public.pins p
  join public.profiles a on a.id = p.author_id
  left join lateral (
    select count(*) as n from public.pin_participants pp2
    where pp2.pin_id = p.id and pp2.status in ('accepted','on_the_way','arrived')
  ) ac on true
  left join public.pin_participants pp on pp.pin_id = p.id and pp.user_id = auth.uid()
  where p.status in ('active', 'full')
    and p.expires_at > now()
    and a.is_banned = false
    and not public.is_blocked(auth.uid(), p.author_id)
    and st_dwithin(p.point, st_makepoint(in_lng, in_lat)::geography, radius_m)
    and (in_formats is null or p.format = any(in_formats))
    and (mom_age_min is null or (extract(year from now())::int - a.birth_year) >= mom_age_min)
    and (mom_age_max is null or (extract(year from now())::int - a.birth_year) <= mom_age_max)
    and (child_age_min is null or exists (
          select 1 from public.children c where c.profile_id = a.id
            and public.child_age_months(c.birth_month) >= child_age_min))
    and (child_age_max is null or exists (
          select 1 from public.children c where c.profile_id = a.id
            and public.child_age_months(c.birth_month) <= child_age_max))
  order by st_distance(p.point, st_makepoint(in_lng, in_lat)::geography)
  limit 200
$$;

-- Пошук подруг за інтересами й віком дитини (розділ «Подруги»).
create or replace function public.find_friends(
  in_lat        double precision default null,
  in_lng        double precision default null,
  radius_m      int default 30000,
  in_interests  text[] default null,
  child_age_min int default null,
  child_age_max int default null
)
returns table (
  id            uuid,
  display_name  text,
  photo_url     text,
  bio           text,
  city          text,
  mom_age       int,
  rating        numeric,
  reviews_count int,
  verified      boolean,
  interests     text[],
  children      jsonb,
  distance_m    double precision,
  friendship    friendship_status
)
language sql stable security definer set search_path = public as $$
  select
    p.id, p.display_name, p.photo_url, p.bio, p.city,
    case when p.birth_year is null then null
         else extract(year from now())::int - p.birth_year end,
    p.rating, p.reviews_count, p.verification = 'verified', p.interests,
    coalesce((
      select jsonb_agg(jsonb_build_object(
               'name', c.name, 'gender', c.gender,
               'age_months', public.child_age_months(c.birth_month))
             order by c.birth_month desc)
      from public.children c where c.profile_id = p.id), '[]'::jsonb),
    case when in_lat is null or pv.home_point is null then null
         else st_distance(pv.home_point, st_makepoint(in_lng, in_lat)::geography) end,
    (select f.status from public.friendships f
      where (f.requester_id = auth.uid() and f.addressee_id = p.id)
         or (f.requester_id = p.id and f.addressee_id = auth.uid())
      limit 1)
  from public.profiles p
  left join public.profiles_private pv on pv.id = p.id
  where p.show_in_friends
    and p.is_banned = false
    and p.id <> auth.uid()
    and not public.is_blocked(auth.uid(), p.id)
    and (in_interests is null or p.interests && in_interests)
    and (in_lat is null or pv.home_point is null
         or st_dwithin(pv.home_point, st_makepoint(in_lng, in_lat)::geography, radius_m))
    and (child_age_min is null or exists (
          select 1 from public.children c where c.profile_id = p.id
            and public.child_age_months(c.birth_month) >= child_age_min))
    and (child_age_max is null or exists (
          select 1 from public.children c where c.profile_id = p.id
            and public.child_age_months(c.birth_month) <= child_age_max))
  order by
    case when in_lat is null or pv.home_point is null then 1 else 0 end,
    st_distance(pv.home_point, st_makepoint(in_lng, in_lat)::geography) nulls last,
    p.rating desc
  limit 100
$$;

-- Відкрити (або знайти) приватний чат із мамою.
create or replace function public.open_direct_chat(other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  a uuid := least(auth.uid(), other);
  b uuid := greatest(auth.uid(), other);
  found uuid;
begin
  if auth.uid() is null then raise exception 'Потрібна авторизація'; end if;
  if auth.uid() = other then raise exception 'Не можна написати самій собі'; end if;
  if public.is_blocked(auth.uid(), other) then raise exception 'Користувачку заблоковано'; end if;

  select chat_id into found from public.direct_chats where user_a = a and user_b = b;
  if found is not null then return found; end if;

  insert into public.chats (is_group) values (false) returning id into found;
  insert into public.chat_members (chat_id, user_id) values (found, a), (found, b);
  insert into public.direct_chats (user_a, user_b, chat_id) values (a, b, found);
  return found;
end $$;

-- Записати приблизне місце дому (geography не можна писати з клієнта напряму).
create or replace function public.set_home_point(in_lat double precision, in_lng double precision)
returns void language sql security definer set search_path = public as $$
  insert into public.profiles_private (id, home_point)
  values (auth.uid(), st_makepoint(in_lng, in_lat)::geography)
  on conflict (id) do update
    set home_point = excluded.home_point,
        updated_at = now()
$$;

-- Створити мітку. Координати приймаємо числами, geography збираємо тут.
create or replace function public.create_pin(
  in_format        meet_format,
  in_title         text,
  in_description   text,
  in_lat           double precision,
  in_lng           double precision,
  in_place_name    text default null,
  in_starts_at     timestamptz default now(),
  in_hours         int default 6,
  in_capacity      int default 1,
  in_mom_age_min   int default null,
  in_mom_age_max   int default null,
  in_child_age_min int default null,
  in_child_age_max int default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'Потрібна авторизація'; end if;
  if coalesce(btrim(in_title), '') = '' then raise exception 'Напиши, на що запрошуєш'; end if;

  insert into public.pins (
    author_id, format, title, description, point, place_name,
    starts_at, expires_at, capacity,
    want_mom_age_min, want_mom_age_max, want_child_age_min, want_child_age_max
  ) values (
    auth.uid(), in_format, btrim(in_title), coalesce(btrim(in_description), ''),
    st_makepoint(in_lng, in_lat)::geography, in_place_name,
    in_starts_at,
    in_starts_at + make_interval(hours => least(greatest(in_hours, 1), 24)),
    least(greatest(in_capacity, 1), 5),
    in_mom_age_min, in_mom_age_max, in_child_age_min, in_child_age_max
  ) returning id into new_id;

  return new_id;
end $$;

-- Перенести мітку туди, де мама зараз («Оновити мітку»).
create or replace function public.move_pin(p_id uuid, in_lat double precision, in_lng double precision)
returns void language sql security definer set search_path = public as $$
  update public.pins
     set point = st_makepoint(in_lng, in_lat)::geography
   where id = p_id and author_id = auth.uid()
$$;

-- Прибирання простроченого (викликається cron-ом щогодини).
create or replace function public.expire_old_pins()
returns int language sql security definer set search_path = public as $$
  with upd as (
    update public.pins set status = 'expired'
     where status in ('active','full') and expires_at <= now()
     returning 1
  ) select count(*)::int from upd
$$;

-- =====================================================================
--  Row Level Security
-- =====================================================================

alter table public.profiles          enable row level security;
alter table public.profiles_private  enable row level security;
alter table public.children          enable row level security;
alter table public.pins              enable row level security;
alter table public.pin_participants  enable row level security;
alter table public.chats             enable row level security;
alter table public.chat_members      enable row level security;
alter table public.messages          enable row level security;
alter table public.direct_chats      enable row level security;
alter table public.friendships       enable row level security;
alter table public.blocks            enable row level security;
alter table public.reviews           enable row level security;
alter table public.trusted_contacts  enable row level security;
alter table public.sos_events        enable row level security;
alter table public.reports           enable row level security;
alter table public.notifications     enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.cards             enable row level security;

-- profiles: бачать усі авторизовані (крім заблокованих), редагує лише власниця.
create policy profiles_read on public.profiles for select
  to authenticated using (not public.is_blocked(auth.uid(), id));
create policy profiles_update on public.profiles for update
  to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- profiles_private: лише власний рядок. Жодних винятків.
create policy profiles_private_own on public.profiles_private for all
  to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- children: читає будь-хто авторизований (вік дитини — частина анкети), пише лише мама.
create policy children_read on public.children for select
  to authenticated using (not public.is_blocked(auth.uid(), profile_id));
create policy children_write on public.children for all
  to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- pins
create policy pins_read on public.pins for select
  to authenticated using (not public.is_blocked(auth.uid(), author_id));
create policy pins_insert on public.pins for insert
  to authenticated with check (author_id = auth.uid());
create policy pins_update on public.pins for update
  to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy pins_delete on public.pins for delete
  to authenticated using (author_id = auth.uid());

-- pin_participants: бачать авторка мітки й сама учасниця.
create policy pin_participants_read on public.pin_participants for select
  to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.pins p where p.id = pin_id and p.author_id = auth.uid())
    -- учасниці бачать одна одну («видно, хто прийде»)
    or exists (select 1 from public.pin_participants me
               where me.pin_id = pin_id and me.user_id = auth.uid()
                 and me.status in ('accepted','on_the_way','arrived'))
  );
create policy pin_participants_join on public.pin_participants for insert
  to authenticated with check (user_id = auth.uid());
-- статус змінює або сама учасниця (вирушаю/скасувати), або авторка (підтвердити/відмовити)
create policy pin_participants_update on public.pin_participants for update
  to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.pins p where p.id = pin_id and p.author_id = auth.uid())
  );
create policy pin_participants_delete on public.pin_participants for delete
  to authenticated using (user_id = auth.uid());

-- Чати доступні лише учасницям.
create policy chats_read on public.chats for select
  to authenticated using (
    exists (select 1 from public.chat_members m where m.chat_id = id and m.user_id = auth.uid()));

create policy chat_members_read on public.chat_members for select
  to authenticated using (
    exists (select 1 from public.chat_members m where m.chat_id = chat_members.chat_id and m.user_id = auth.uid()));
create policy chat_members_update on public.chat_members for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy messages_read on public.messages for select
  to authenticated using (
    exists (select 1 from public.chat_members m where m.chat_id = messages.chat_id and m.user_id = auth.uid()));
create policy messages_insert on public.messages for insert
  to authenticated with check (
    sender_id = auth.uid()
    and exists (select 1 from public.chat_members m where m.chat_id = messages.chat_id and m.user_id = auth.uid()));
create policy messages_update on public.messages for update
  to authenticated using (sender_id = auth.uid()) with check (sender_id = auth.uid());

create policy direct_chats_read on public.direct_chats for select
  to authenticated using (user_a = auth.uid() or user_b = auth.uid());

-- Подруги
create policy friendships_read on public.friendships for select
  to authenticated using (requester_id = auth.uid() or addressee_id = auth.uid());
create policy friendships_insert on public.friendships for insert
  to authenticated with check (requester_id = auth.uid() and not public.is_blocked(auth.uid(), addressee_id));
create policy friendships_update on public.friendships for update
  to authenticated using (addressee_id = auth.uid() or requester_id = auth.uid());
create policy friendships_delete on public.friendships for delete
  to authenticated using (requester_id = auth.uid() or addressee_id = auth.uid());

-- Блокування — приватні для того, хто блокує.
create policy blocks_own on public.blocks for all
  to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Відгуки читають усі, пише лише авторка відгуку.
create policy reviews_read on public.reviews for select to authenticated using (true);
create policy reviews_insert on public.reviews for insert
  to authenticated with check (author_id = auth.uid());
create policy reviews_update on public.reviews for update
  to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy reviews_delete on public.reviews for delete
  to authenticated using (author_id = auth.uid());

-- Безпека
create policy trusted_own on public.trusted_contacts for all
  to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy sos_own on public.sos_events for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reports_insert on public.reports for insert
  to authenticated with check (reporter_id = auth.uid());
create policy reports_read on public.reports for select
  to authenticated using (reporter_id = auth.uid());

-- Сповіщення
create policy notifications_own on public.notifications for select
  to authenticated using (user_id = auth.uid());
create policy notifications_update on public.notifications for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_own on public.push_subscriptions for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Картки видно всім (це колекція), видає сервер.
create policy cards_read on public.cards for select to authenticated using (true);

-- =====================================================================
--  Realtime (живий чат і мітки)
-- =====================================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.pins;
alter publication supabase_realtime add table public.pin_participants;
alter publication supabase_realtime add table public.notifications;
