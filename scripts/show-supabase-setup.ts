// This script shows you the exact environment variables you need to add

const existingSupabaseUrl = process.env.SUPABASE_URL
const existingSupabaseKey = process.env.SUPABASE_ANON_KEY

console.log("\n========================================")
console.log("SUPABASE SETUP INSTRUCTIONS")
console.log("========================================\n")

console.log("You need to add these 2 environment variables in the Vars section:\n")

console.log("1. VARIABLE NAME:")
console.log("   NEXT_PUBLIC_SUPABASE_URL")
console.log("\n   VALUE TO COPY:")
console.log("   " + (existingSupabaseUrl || "Not found - check your Supabase integration"))

console.log("\n\n2. VARIABLE NAME:")
console.log("   NEXT_PUBLIC_SUPABASE_ANON_KEY")
console.log("\n   VALUE TO COPY:")
console.log(
  "   " +
    (existingSupabaseKey
      ? existingSupabaseKey.substring(0, 20) + "..."
      : "Not found - check your Supabase integration"),
)

console.log("\n\n========================================")
console.log("HOW TO ADD THESE VARIABLES:")
console.log("========================================")
console.log("1. Click 'Vars' in the left sidebar")
console.log("2. Click '+ Add Variable' button")
console.log("3. Copy the VARIABLE NAME from above")
console.log("4. Copy the VALUE from above")
console.log("5. Click Save")
console.log("6. Repeat for the second variable")
console.log("\n========================================\n")
