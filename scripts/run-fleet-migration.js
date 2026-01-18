import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

// Load env vars manually
try {
    const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            const value = match[2].trim().replace(/^["']|["']$/g, '')
            process.env[key] = value
        }
    })
} catch (e) {
    console.log('[v0] Could not read .env.local file')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("[v0] Missing Supabase environment variables")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const scriptPath = "scripts/950_create_fleet_vehicles.sql"

async function runMigration() {
    console.log("[v0] Starting Fleet Vehicles table migration...\n")

    try {
        const fullPath = path.join(process.cwd(), scriptPath)

        if (!fs.existsSync(fullPath)) {
            console.error(`[v0] ❌ Script not found: ${scriptPath}`)
            process.exit(1)
        }

        const sql = fs.readFileSync(fullPath, "utf-8")
        console.log(`[v0] Running: ${scriptPath}`)

        const { error } = await supabase.rpc("exec_sql", { sql_query: sql }) // Note: previous script used 'sql' param name, checking if it's 'sql' or 'sql_query'. `run-vrn-migration.js` used `{ sql }`. I'll try both or stick to one. Wait, `run-vrn-migration.js` used `{ sql }`. I'll use `{ sql }`.

        if (error) {
            // Retry with sql_query just in case param name is different
            const { error: retryError } = await supabase.rpc("exec_sql", { sql_query: sql })
            if (retryError) {
                console.error(`[v0] ❌ RPC Error: ${error.message}`)
                console.error(`[v0] ❌ Retry Error: ${retryError.message}`)
            } else {
                console.log(`[v0] ✅ Migration completed successfully via RPC (retry)`)
                return
            }
        } else {
            console.log(`[v0] ✅ Migration completed successfully via RPC`)
        }

    } catch (error) {
        console.error(`[v0] ❌ Error running migration:`, error.message)
        process.exit(1)
    }
}

runMigration()
