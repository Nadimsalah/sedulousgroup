import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create admin client with service role to bypass RLS
function createAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials")
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Uploading file:", file.name, "Size:", file.size, "Type:", file.type)

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const uniqueFilename = `${timestamp}-${sanitizedName}`

    // Upload to Supabase Storage
    const supabase = createAdminSupabase()
    
    // Use rental-contracts bucket (already configured in Supabase)
    const bucket = "rental-contracts"

    // Upload file to Supabase Storage
    let { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(uniqueFilename, file, {
        cacheControl: "3600",
        upsert: false,
      })

    // If bucket doesn't exist, try to create it
    if (uploadError && (uploadError.message.includes("Bucket not found") || uploadError.message.includes("not found"))) {
      console.log("[v0] Bucket not found, attempting to create bucket:", bucket)
      
      // Try to create the bucket
      const { data: bucketData, error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes: null, // Allow all file types
        fileSizeLimit: 10485760, // 10MB
      })

      if (createError) {
        console.error("[v0] Failed to create bucket:", createError)
        // If creation fails, try uploading to a generic bucket name
        const fallbackBucket = "uploads"
        console.log("[v0] Trying fallback bucket:", fallbackBucket)
        
        // Try to create fallback bucket
        await supabase.storage.createBucket(fallbackBucket, {
          public: true,
          allowedMimeTypes: null,
          fileSizeLimit: 10485760,
        }).catch(() => {
          // Ignore error if bucket already exists
        })
        
        // Try uploading to fallback bucket
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from(fallbackBucket)
          .upload(uniqueFilename, file, {
            cacheControl: "3600",
            upsert: false,
          })
        
        if (fallbackError) {
          throw new Error(`Failed to upload file. Please create a storage bucket named "${bucket}" or "${fallbackBucket}" in your Supabase dashboard. Error: ${fallbackError.message}`)
        }
        
        const { data: urlData } = supabase.storage.from(fallbackBucket).getPublicUrl(uniqueFilename)
        console.log("[v0] File uploaded successfully to Supabase (fallback bucket):", urlData.publicUrl)
        return NextResponse.json({ url: urlData.publicUrl })
      }

      console.log("[v0] Bucket created successfully, retrying upload")
      
      // Retry upload after creating bucket
      const retryResult = await supabase.storage
        .from(bucket)
        .upload(uniqueFilename, file, {
          cacheControl: "3600",
          upsert: false,
        })
      
      if (retryResult.error) {
        throw new Error(`Failed to upload file after creating bucket: ${retryResult.error.message}`)
      }
      
      uploadData = retryResult.data
      uploadError = null
    }

    if (uploadError) {
      console.error("[v0] Supabase upload error:", uploadError)
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uniqueFilename)
    
    console.log("[v0] File uploaded successfully to Supabase:", urlData.publicUrl)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to upload file"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
