import { createClient } from "./client"

export const supabase = createClient()

export async function uploadPdfToSupabase(file: File): Promise<string> {
  try {
    // Generate a unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `pdfs/${fileName}`

    // Upload file to Supabase storage
    const { error } = await supabase.storage
      .from("uploads") // Make sure this bucket exists in your Supabase project
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })


    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get the public URL
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filePath)

    return urlData.publicUrl
  } catch (error) {
    console.error("Upload error:", error)
    throw error
  }
}
