import {tool, generateText} from 'ai';
import { google } from '@ai-sdk/google';
import { RetryableError, FatalError } from "workflow";
import { subdivisionAgent } from '@/lib/agents/subdivision-agent';
import { NameObject, formatFullName, } from '@/lib/research/utils';
import { z } from 'zod';

export type Context = {
    countyId: string,
    token: string,
  }

export async function search(
    documentGroupId: string,
    token: string,
    query: any
   ) {
     "use step"; 

     const response = await fetch(
        `https://api.propertysync.com/v1/search/document-groups/${documentGroupId}/searches`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(query)
        }
      );

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

export async function retrieveResults(
    documentGroupId: string,
    token: string,
    searchId: any
   ) {
     "use step"; 

     const response = await fetch(
        `https://api.propertysync.com/v1/search/document-groups/${documentGroupId}/searches/${searchId}/results`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        }
      );

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

export async function getSubdivisions(
    documentGroupId: string,
    token: string
   ) {
     "use step"; 

     const response = await fetch(
        `https://api.propertysync.com/v1/indexing/document-groups/${documentGroupId}/auto-completes/?type=addition`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

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

export async function answer(
    // ... arguments
  ) {
    "use step"; 
    // ... rest of the tool code
  }

  export async function generateAnswer(
    question: string,
    image: string
  ) {
    "use step"; 
   
    const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        system: 'You are an expert title research assistant that answers questions about real estate documents.  Given a document your task is to answer the users question as accurately as possible.',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `<question>${question}</question>`
              },
              {
                type: 'image',
                image: image,
              },
            ]
          }
        ],
    })

    return text;
  }


  // Tool definitions
export const researchAgentTools = {
    search: tool({
        description: 'Searches a title plant system for property records by legal description, party names, recording dates, and recording numbers.',
        inputSchema: z.object({
          query: z.object({
            property: z.object({
                lot: z.string().nullable(),
                block: z.string().optional().nullable(),
                addition: z.string().nullable(),
            }),
            partyName: z.string().optional(),
            startDate: z.string().describe('The start date of the search formatted YYYY-MM-DD').optional().nullable(),
            endDate: z.string().describe('The end date of the search formatted YYYY-MM-DD').optional().nullable(),
          }),
        }),
        async *execute({ query }, { experimental_context: context}) {
          const typedContext = context as Context

            yield {
              status: 'Thinking...' as const,
            };
        
            // Get Subdivisions

            const DOCUMENT_GROUP_ID = typedContext.countyId

            yield {
              status: 'Searching...' as const,
            };

            const subdivisions = await getSubdivisions(DOCUMENT_GROUP_ID, typedContext.token)

            let normalizedAddition: string | null = null;
            if(query.property.addition){
              normalizedAddition = await subdivisionAgent(query.property.addition, subdivisions.map((sub: any) => sub.value))
            }
   
            const searchQuery = {
              queryParams: {
                excludeOrders: 1,
                excludeRelatedDocuments: 1,
                subdivisions: [{ 
                  lot: query.property.lot, 
                  block: query.property.block, 
                  addition: normalizedAddition}],
                recordingInfos: [{
                  dateFrom: null,
                  dateTo: null
                }],
                parties:[{ partyName: query.partyName}]
              } 
            };

            const { id: searchId } = await search(DOCUMENT_GROUP_ID, typedContext.token, searchQuery)


            yield {
              status: 'Reviewing documents...' as const,
          };

            const retrievingResultsData = await retrieveResults(DOCUMENT_GROUP_ID, typedContext.token, searchId)

            const documents = retrievingResultsData.filter((r: any)=>r.documentType != 'ORDER').map((doc: any) => {
              return {
                documentId:doc.documentId,
                documentNumber: doc.documentNumber || 
                (doc.bookNumber != null && doc.pageNumber != null 
                  ? doc.bookNumber + doc.pageNumber.padStart(6, '0')
                  : 'UNKNOWN'),
                filedDate: doc.filedDate,
                documentType: doc.documentType,
                grantors: [doc.bestGrantor],
                grantees: [doc.bestGrantee],
                legal: doc.legalHeader.replace(/\s+/g, ' ').trim(),
                amount: doc.details.consideration
              };
            })


            yield {
              status: 'Search complete.' as const,
              results: documents
            };

          },
    }),
    readDocument: tool({
      description: 'Reads a specific document to answer the users question.',
      inputSchema: z.object({
         documentId: z.string(),
         question: z.string().describe('The question that the user is asking about the document.')
      }),
      async *execute({ documentId, question }, { experimental_context: context}) {
        const typedContext = context as Context

        console.log(documentId, question)

        yield { status: "Reading document..."}

        const DOCUMENT_GROUP_ID = typedContext.countyId

        const { image } = await getDocumentDetails(DOCUMENT_GROUP_ID, typedContext.token, documentId )

        const text = await generateAnswer(question, image.s3Path)

        yield { status: "Read document.", text: text }

      },
    }),

    answer: tool({
      description: 'Answers the users query with source documents and a text response',
      inputSchema: z.object({
        documents: z.object({
          documentId: z.string().nullable(),
          documentNumber: z.string().nullable(),
          documentType: z.string().nullable(),
          filedDate: z.string().nullable(),
        }).array(),
        response: z.string().describe('The text replying to the user.  The response should be extremely concise and to the point.')
      }),
      async *execute({ documents, response }, { experimental_context: context}) {
        const typedContext = context as Context
        console.log(documents, response);

        yield {
          status: 'Thinking...' as const,
          documents: documents,
          response: response
        };

        const detailedDocuments = await Promise.all(
          documents.map(async (document : any) => {
            
            const DOCUMENT_GROUP_ID = typedContext.countyId

            const details = await getDocumentDetails(DOCUMENT_GROUP_ID, typedContext.token, document.documentId)

            return {
              documentId: details.id,
              documentNumber: details.json.documentNumber || 
              (details.json.bookNumber != null && details.json.pageNumber != null 
                ? details.json.bookNumber + details.json.pageNumber.padStart(6, '0')
                : 'UNKNOWN'),
              image: details.image ? details.image.s3Path : null,
              filedDate: new Date(details.json.filedDate).toISOString().split('T')[0],
              documentType: details.json.instrumentType,
              grantors:  details.json.grantors.map((grantor: NameObject) => formatFullName(grantor)),
              grantees: details.json.grantees.map((grantee: NameObject) => formatFullName(grantee)),
              related: details.relatedDocuments,
              amount: details.json.consideration
            };
          })
        );

        yield { status: "Search complete.", documents: detailedDocuments, response}
      },
    }),
};
  