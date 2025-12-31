// Script to get the last signed PDF URL
import { createClient } from "@supabase/supabase-js"

async function getLastSignedPdfUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase credentials")
    console.log("Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file")
    return
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Get the most recent signed agreement
  const { data, error } = await supabase
    .from("agreements")
    .select("id, agreement_number, signed_agreement_url, status, created_at, updated_at")
    .not("signed_agreement_url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error("Error fetching signed PDF:", error)
    return
  }

  if (!data) {
    console.log("No signed agreements found")
    return
  }

  console.log("\n=== Last Signed PDF URL ===")
  console.log("Agreement ID:", data.id)
  console.log("Agreement Number:", data.agreement_number)
  console.log("Status:", data.status)
  console.log("Created At:", data.created_at)
  console.log("Updated At:", data.updated_at)
  console.log("\nSigned PDF URL:")
  console.log(data.signed_agreement_url)
  console.log("\n=== End ===")
}

getLastSignedPdfUrl().catch(console.error)

