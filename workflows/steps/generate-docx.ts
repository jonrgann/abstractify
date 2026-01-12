import { FatalError, RetryableError } from 'workflow'; 
import { uploadToSupabase } from './upload-file';
import { sampleHOAData } from '@/components/generateHOADocument';

export async function generateDocX(
    data: any,
   ) {
     "use step"; 
    console.log(`${process.env.NEXT_PUBLIC_BASE_URL}/api/create-docx`)
     const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/create-docx`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({sampleHOAData}) 
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
    // Get the uint8Array response
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert uint8Array to Blob for upload
    const blob = new Blob([uint8Array], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });

    const {publicUrl} = await uploadToSupabase(blob, { 
        bucket: 'uploads', 
        filename: 'HOA', 
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
    });

    return publicUrl;
}