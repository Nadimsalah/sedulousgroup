import { neon } from "@neondatabase/serverless"
import fs from "fs"
import path from "path"

const databaseUrl = process.env.POSTGRES_URL

if (!databaseUrl) {
  console.error("[v0] Missing DATABASE_URL environment variable")
  process.exit(1)
}

const sql = neon(databaseUrl)

const sqlScripts = [
  "scripts/008_create_drivers_table.sql",
  "scripts/009_create_support_tickets_table.sql",
  "scripts/010_create_deposits_table.sql",
]

async function executeMigrations() {
  console.log("[v0] Starting SQL migrations...\n")

  for (const scriptPath of sqlScripts) {
    try {
      const fullPath = path.join(process.cwd(), scriptPath)

      if (!fs.existsSync(fullPath)) {
        console.log(`[v0] ⚠️  Script not found: ${scriptPath}`)
        continue
      }

      const sqlContent = fs.readFileSync(fullPath, "utf-8")
      console.log(`[v0] Executing: ${scriptPath}`)

      // Split statements by semicolon
      const statements = sqlContent
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith("--"))

      for (const statement of statements) {
        try {
          await sql(statement)
          console.log(`[v0] ✓ ${statement.substring(0, 60)}...`)
        } catch (err) {
          // Table might already exist - that's ok
          if (err.message.includes("already exists")) {
            console.log(`[v0] ✓ Table already exists, skipping...`)
          } else {
            console.log(`[v0] Error: ${err.message}`)
          }
        }
      }

      console.log(`[v0] ✅ Completed: ${scriptPath}\n`)
    } catch (error) {
      console.error(`[v0] ❌ Error: ${error.message}`)
    }
  }

  console.log("[v0] ✅ All migrations completed!")
}

executeMigrations().catch((err) => {
  console.error("[v0] Fatal error:", err)
  process.exit(1)
})
