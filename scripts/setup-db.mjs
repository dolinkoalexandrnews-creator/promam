import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function setup() {
  try {
    console.log('🔄 Setting up database...\n')

    // Insert users
    console.log('1️⃣ Creating users...')
    const { error: usersErr } = await supabase
      .from('users')
      .insert([
        { email: 'maria@promam.ua', name: 'Марія', password_hash: '$2a$10$test1' },
        { email: 'natalia@promam.ua', name: 'Наталія', password_hash: '$2a$10$test2' },
        { email: 'olha@promam.ua', name: 'Ольга', password_hash: '$2a$10$test3' },
        { email: 'viktoria@promam.ua', name: 'Вікторія', password_hash: '$2a$10$test4' }
      ])
      .select()

    if (usersErr && !usersErr.message.includes('unique')) {
      console.error('Error:', usersErr.message)
    } else {
      console.log('✅ Users OK\n')
    }

    // Get users for profiles
    const { data: users } = await supabase.from('users').select('id, email')

    if (!users || users.length === 0) {
      console.log('⚠️  No users found')
      return
    }

    console.log('2️⃣ Creating profiles...')
    const config = {
      'maria@promam.ua': { emoji: '👩‍🦰', age: 28, child_age: '2 роки', rating: 4.8, interests: ['Кава', 'Парки', 'Книги'] },
      'natalia@promam.ua': { emoji: '👩‍🦱', age: 32, child_age: '1 рік', rating: 5.0, interests: ['Йога', 'Готування', 'Мистецтво'] },
      'olha@promam.ua': { emoji: '👩', age: 26, child_age: '3 роки', rating: 4.9, interests: ['Спорт', 'Подорожі', 'Фото'] },
      'viktoria@promam.ua': { emoji: '👩‍🔬', age: 30, child_age: '18 місяців', rating: 4.7, interests: ['Розвиток', 'Музика', 'Мода'] }
    }

    const profiles = users.map(u => ({ user_id: u.id, location: 'м. Київ', ...config[u.email] }))

    const { error: profilesErr } = await supabase.from('mom_profiles').insert(profiles)

    if (profilesErr && !profilesErr.message.includes('duplicate')) {
      console.error('Error:', profilesErr.message)
    } else {
      console.log('✅ Profiles OK\n')
    }

    console.log('🎉 Database ready!')
    console.log('🔄 Перезагрузи localhost:3002')

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

setup()
