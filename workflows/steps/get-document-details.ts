import { FatalError, RetryableError } from 'workflow'; 

export async function getDocumentDetails(
    documentGroupId: string,
    token: string,
    documentId: string,
   ) {
     "use step"; 

     const response = await fetch(`https://api.propertysync.com/v1/indexing/document-groups/${documentGroupId}/documents/${documentId}`, {
        method: 'GET',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    })

    if (response.status >= 500) {
        // Uncaught exceptions are retried by default
        throw new Error("Server error");
    }
    
    if (response.status === 404) {
    // Explicitly throw a FatalError to skip retrying
    throw new FatalError("Resource not found. Skipping retries.");
    }
    
    if (response.status === 429) {
    // Customize retry delay - accepts duration strings, milliseconds, or Date instances
    throw new RetryableError("Too many requests. Retrying...", {
        retryAfter: "10s"
    });
    }
    
    return response.json();
 
}