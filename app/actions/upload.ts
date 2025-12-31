"use server"

import { put } from "@vercel/blob"

export async function uploadDocument(formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      throw new Error("No file provided")
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
    })

    return { url: blob.url }
  } catch (error) {
    console.error("[v0] Error uploading document:", error)
    throw error
  }
}
