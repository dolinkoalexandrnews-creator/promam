import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function initDatabase() {
  try {
    console.log('🔄 Initializing database...')

    // Read SQL file
    const sqlPath = path.join(process.cwd(), 'supabase', 'init.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    // Execute each statement
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.log(`⚠️  Statement: ${statement.substring(0, 50)}...`)
          console.log(`   Error: ${error.message}`)
        } else {
          console.log(`✅ Executed: ${statement.substring(0, 50)}...`)
        }
      } catch (err) {
        console.log(`⚠️  ${statement.substring(0, 50)}...`)
      }
    }

    console.log('\n✅ Database initialization complete!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

initDatabase()
