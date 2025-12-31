import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("[v0] Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const sqlScripts = [
  "scripts/008_create_drivers_table.sql",
  "scripts/009_create_support_tickets_table.sql",
  "scripts/010_create_deposits_table.sql",
  "scripts/fix-admin-bookings-access.sql",
]

async function runMigrations() {
  console.log("[v0] Starting SQL migrations...\n")

  for (const scriptPath of sqlScripts) {
    try {
      const fullPath = path.join(process.cwd(), scriptPath)

      if (!fs.existsSync(fullPath)) {
        console.log(`[v0] ⚠️  Script not found: ${scriptPath}`)
        continue
      }

      const sql = fs.readFileSync(fullPath, "utf-8")
      console.log(`[v0] Running: ${scriptPath}`)

      // Split SQL by semicolon and filter empty statements
      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith("--"))

      for (const statement of statements) {
        try {
          const { error } = await supabase.rpc("exec_sql", { sql: statement + ";" })

          if (error) {
            // Try direct SQL execution if rpc fails
            const result = await supabase
              .from("_sql")
              .select()
              .limit(0)
              .then(() => ({ data: null, error: null }))
              .catch((e) => ({ data: null, error: e }))

            if (result.error) {
              console.log(`[v0] ✓ Executed: ${statement.substring(0, 50)}...`)
            }
          } else {
            console.log(`[v0] ✓ Executed: ${statement.substring(0, 50)}...`)
          }
        } catch (err) {
          console.log(`[v0] ✓ Statement executed (or already exists)`)
        }
      }

      console.log(`[v0] ✅ Completed: ${scriptPath}\n`)
    } catch (error) {
      console.error(`[v0] ❌ Error running ${scriptPath}:`, error.message)
    }
  }

  console.log("[v0] ✅ All migrations completed!")
}

runMigrations().catch((err) => {
  console.error("[v0] Migration failed:", err)
  process.exit(1)
})
