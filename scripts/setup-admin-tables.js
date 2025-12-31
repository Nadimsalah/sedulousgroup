// This script creates all required admin tables
// Run with: node scripts/setup-admin-tables.js

const { createClient } = require("@supabase/supabase-js")
const fs = require("fs")
const path = require("path")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

async function setupTables() {
  console.log("🚀 Starting admin tables setup...\n")

  const scripts = [
    {
      name: "Drivers Table",
      file: "scripts/008_create_drivers_table.sql",
    },
    {
      name: "Support Tickets Table",
      file: "scripts/009_create_support_tickets_table.sql",
    },
    {
      name: "Deposits Table",
      file: "scripts/010_create_deposits_table.sql",
    },
  ]

  for (const script of scripts) {
    try {
      const filePath = path.join(process.cwd(), script.file)

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${script.name}: File not found (${script.file})`)
        continue
      }

      const sql = fs.readFileSync(filePath, "utf-8")
      console.log(`📝 Setting up: ${script.name}...`)

      // Execute SQL directly via Supabase admin API
      const { data, error } = await supabase.rpc("exec_sql", {
        sql: sql,
      })

      if (error && !error.message.includes("already exists")) {
        console.log(`❌ Error: ${error.message}`)
      } else {
        console.log(`✅ ${script.name} - Done!\n`)
      }
    } catch (err) {
      console.log(`⚠️  ${script.name}: ${err.message}\n`)
    }
  }

  console.log("✅ Admin tables setup completed!")
}

setupTables().catch((err) => {
  console.error("❌ Fatal error:", err.message)
  process.exit(1)
})
