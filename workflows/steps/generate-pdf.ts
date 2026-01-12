import { FatalError, RetryableError } from 'workflow'; 
import { uploadToSupabase } from './upload-file';

export async function generatePDF(
    data: any,
    fileName: string | 'Untitled',
   ) {
     "use step"; 
    console.log(`${process.env.NEXT_PUBLIC_BASE_URL}/api/create-pdf`)
     const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/create-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({data}) 
        }
      );

    if (response.status >= 500) {
        throw new Error("Server error");
    }
    
    if (response.status === 404) {
        throw new FatalError("Resource not found. Skipping retries.");
    }
    
    if (response.status === 429) {
        throw new RetryableError("Too many requests. Retrying...", {
            retryAfter: "10s"
        });
    }

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Convert blob to base64 string for serialization
    const blob = await response.blob();

    const {publicUrl} = await uploadToSupabase(blob, { bucket:'uploads', filename:fileName, contentType: "application/pdf" });

    return publicUrl
}