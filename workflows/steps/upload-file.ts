import { FatalError, RetryableError } from 'workflow'; 

export async function uploadToSupabase(
  file: File | Blob,
  options?: {
    bucket?: string;
    filename?: string;
    contentType?: string;
  }
) {
  "use step";

  // Convert file/blob to base64 for sending in JSON
  const arrayBuffer = await file.arrayBuffer();

  const base64 = Buffer.from(arrayBuffer).toString('base64');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/upload`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64,
        filename: options?.filename || (file instanceof File ? file.name : `upload-${Date.now()}`),
        contentType: options?.contentType || (file instanceof File ? file.type : 'application/pdf'),
        bucket: options?.bucket || 'uploads'
      })
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
  }

  const result = await response.json();

  return {
    path: result.path,
    publicUrl: result.publicUrl,
    bucket: result.bucket
  };
}