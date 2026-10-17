-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create mom profiles table
CREATE TABLE IF NOT EXISTS mom_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT DEFAULT '👩',
  age INTEGER,
  child_age TEXT,
  rating DECIMAL(2,1) DEFAULT 5.0,
  interests TEXT[] DEFAULT '{}',
  location TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_idx ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(sender_id, recipient_id, created_at);
CREATE INDEX IF NOT EXISTS mom_profiles_user_idx ON mom_profiles(user_id);

-- Enable realtime
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE mom_profiles REPLICA IDENTITY FULL;

-- Create test users with profiles
INSERT INTO users (email, name, password_hash) VALUES
  ('maria@promam.ua', 'Марія', '$2a$10$test1'),
  ('natalia@promam.ua', 'Наталія', '$2a$10$test2'),
  ('olha@promam.ua', 'Ольга', '$2a$10$test3'),
  ('viktoria@promam.ua', 'Вікторія', '$2a$10$test4')
ON CONFLICT (email) DO NOTHING;

-- Create profiles for test users
INSERT INTO mom_profiles (user_id, emoji, age, child_age, rating, interests, location)
SELECT id, emoji, age, child_age, rating, interests, location FROM (
  SELECT u.id,
    CASE WHEN u.email = 'maria@promam.ua' THEN '👩‍🦰'
         WHEN u.email = 'natalia@promam.ua' THEN '👩‍🦱'
         WHEN u.email = 'olha@promam.ua' THEN '👩'
         WHEN u.email = 'viktoria@promam.ua' THEN '👩‍🔬'
    END as emoji,
    CASE WHEN u.email = 'maria@promam.ua' THEN 28
         WHEN u.email = 'natalia@promam.ua' THEN 32
         WHEN u.email = 'olha@promam.ua' THEN 26
         WHEN u.email = 'viktoria@promam.ua' THEN 30
    END as age,
    CASE WHEN u.email = 'maria@promam.ua' THEN '2 роки'
         WHEN u.email = 'natalia@promam.ua' THEN '1 рік'
         WHEN u.email = 'olha@promam.ua' THEN '3 роки'
         WHEN u.email = 'viktoria@promam.ua' THEN '18 місяців'
    END as child_age,
    CASE WHEN u.email = 'maria@promam.ua' THEN 4.8
         WHEN u.email = 'natalia@promam.ua' THEN 5.0
         WHEN u.email = 'olha@promam.ua' THEN 4.9
         WHEN u.email = 'viktoria@promam.ua' THEN 4.7
    END as rating,
    CASE WHEN u.email = 'maria@promam.ua' THEN ARRAY['Кава', 'Парки', 'Книги']
         WHEN u.email = 'natalia@promam.ua' THEN ARRAY['Йога', 'Готування', 'Мистецтво']
         WHEN u.email = 'olha@promam.ua' THEN ARRAY['Спорт', 'Подорожі', 'Фото']
         WHEN u.email = 'viktoria@promam.ua' THEN ARRAY['Розвиток', 'Музика', 'Мода']
    END as interests,
    'м. Київ' as location
  FROM users u
  WHERE u.email IN ('maria@promam.ua', 'natalia@promam.ua', 'olha@promam.ua', 'viktoria@promam.ua')
) t
ON CONFLICT (user_id) DO NOTHING;
