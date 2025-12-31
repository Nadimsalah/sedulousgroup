// This script shows you the EXACT environment variables you need to add to Vars section

console.log("========================================")
console.log("ADD THESE TO VARS SECTION:")
console.log("========================================\n")

// Check what we have
const hasUrl = process.env.SUPABASE_URL
const hasKey = process.env.SUPABASE_ANON_KEY

if (!hasUrl || !hasKey) {
  console.log("❌ ERROR: Missing Supabase credentials in environment")
  console.log("   Please make sure Supabase integration is connected\n")
} else {
  console.log("✅ Found Supabase credentials!\n")
  console.log("Copy these EXACTLY into Vars section:\n")

  console.log("Variable 1:")
  console.log("  Key:   NEXT_PUBLIC_SUPABASE_URL")
  console.log("  Value:", hasUrl)
  console.log("")

  console.log("Variable 2:")
  console.log("  Key:   NEXT_PUBLIC_SUPABASE_ANON_KEY")
  console.log("  Value:", hasKey.substring(0, 50) + "...")
  console.log("         (Full key is", hasKey.length, "characters)")
  console.log("")

  console.log("========================================")
  console.log("INSTRUCTIONS:")
  console.log("========================================")
  console.log("1. Go to Vars in left sidebar")
  console.log("2. Click '+ Add Variable'")
  console.log("3. Add NEXT_PUBLIC_SUPABASE_URL with the value shown above")
  console.log("4. Click '+ Add Variable' again")
  console.log("5. Add NEXT_PUBLIC_SUPABASE_ANON_KEY with the full key")
  console.log("6. Save and refresh the page")
  console.log("========================================\n")
}
