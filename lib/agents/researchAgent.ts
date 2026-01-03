import { UIMessage, ToolLoopAgent,tool, InferUITools, stepCountIs, hasToolCall, generateText, Output} from 'ai';
import { google, GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import { PropertySyncClient } from '../propertysync/client';
import { subdivisionAgent } from './subdivision-agent';
import { z } from 'zod';
import { NameObject, formatFullName, } from '@/lib/research/utils';

const QUICK_RESPONSES = [
  "Let me see what I can find.",
  "I'll search the title records for you.",
  "Searching our database now.",
  "Let me pull up those title documents.",
  "I'll check the property records right away.",
  "Looking into that for you now.",
  "Let me access the title history.",
  "Searching the county records database.",
  "I'll retrieve those documents for you.",
  "Let me look that up in our system.",
  "Pulling up the title information now.",
  "I'll check our records for that property.",
  "Searching for the title documents you requested.",
  "Let me find that information for you.",
  "Accessing the property records now.",
  "I'll search the title database right away.",
  "Looking up that parcel information.",
  "Let me check what we have on file.",
  "Searching our title records system.",
  "I'll pull those records for you now."
];

export type Context = {
  countyId: string,
  token: string,
}

export const researchAgent = new ToolLoopAgent({
    model: google('gemini-2.5-flash'),
    instructions: `You are a helpful title research assistant for a Real Estate Title Company.  
    You answer questions about county records by searching the title plant system.
    - You must use the search tool to gather information about the documents requested.
    - Then use the answer tool to provide the response and documents to the user.
    - If the user asks about a specific document, read the document first before answering.
    - If the user does not provide a start or end date use null.
    - Format dats as YYYY-MM-DD
    - Use markdown when listing document information to the user.`,
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingBudget: 8192,
          includeThoughts: true,
        },
      } satisfies GoogleGenerativeAIProviderOptions,
    },
    output: Output.object({
      schema: z.object({
        answer:z.string(),
        sourceDocument: z.object({
          documentType: z.string(),
          documentNumber: z.string()
        }).optional()
      })
    }),
    callOptionsSchema: z.object({
      countyId: z.string(),
      token: z.string(),
    }),
    tools: {
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
            console.log('----- Message Meta Data -------')

              yield {
                status: 'Thinking...' as const,
              };
          
              // Get Subdivisions

              const DOCUMENT_GROUP_ID = typedContext.countyId

              const subdivisionsResponse = await fetch(
                `https://api.propertysync.com/v1/indexing/document-groups/${DOCUMENT_GROUP_ID}/auto-completes/?type=addition`,
                {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${typedContext.token}`
                  }
                }
              );

              yield {
                status: 'Searching...' as const,
              };

              const subdivisions = await subdivisionsResponse.json();

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

              console.log(`normalized search query:  ${JSON.stringify(searchQuery)}`)

              const searchResponse = await fetch(
                `https://api.propertysync.com/v1/search/document-groups/${DOCUMENT_GROUP_ID}/searches`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${typedContext.token}`
                  },
                  body: JSON.stringify(searchQuery)
                }
              );

              const { id: searchId } = await searchResponse.json()


              yield {
                status: 'Reviewing documents...' as const,
            };

              const retrievingResults = await fetch(
                `https://api.propertysync.com/v1/search/document-groups/${DOCUMENT_GROUP_ID}/searches/${searchId}/results`,
                {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${typedContext.token}`
                  },
                }
              );

              const retrievingResultsData = await retrievingResults.json();

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

          const getDocumentDetails = await fetch(
            `https://api.propertysync.com/v1/indexing/document-groups/${DOCUMENT_GROUP_ID}/documents/${documentId}/`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${typedContext.token}`
              },
            }
          );

          const { image } = await getDocumentDetails.json();
          
          const generateAnswer = await generateText({
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
                    image: image.s3Path,
                  },
                ]
              }
            ],
          })

          yield { status: "Read document.", text:generateAnswer.text}

        },
      }),
      // answer: tool({
      //   description: 'Answers the users query with source documents and a text response',
      //   inputSchema: z.object({
      //     documents: z.object({
      //       documentId: z.string().nullable(),
      //       documentNumber: z.string().nullable(),
      //       documentType: z.string().nullable(),
      //       filedDate: z.string().nullable(),
      //     }).array(),
      //     response: z.string().describe('The text replying to the user.  The response should be extremely concise and to the point.')
      //   }),
      //   async *execute({ documents, response }, { experimental_context: context}) {
      //     const typedContext = context as Context
      //     console.log(documents, response);

      //     yield {
      //       status: 'Thinking...' as const,
      //       documents: documents,
      //       response: response
      //     };

      //     const detailedDocuments = await Promise.all(
      //       documents.map(async (document : any) => {
              
      //         const DOCUMENT_GROUP_ID = typedContext.countyId

      //         const getDocumentDetails = await fetch(
      //           `https://api.propertysync.com/v1/indexing/document-groups/${DOCUMENT_GROUP_ID}/documents/${document.documentId}/`,
      //           {
      //             method: 'GET',
      //             headers: {
      //               'Content-Type': 'application/json',
      //               'Authorization': `Bearer ${typedContext.token}`
      //             },
      //           }
      //         );

      //         const details = await getDocumentDetails.json()
      //         return {
      //           documentId: details.id,
      //           documentNumber: details.json.documentNumber || 
      //           (details.json.bookNumber != null && details.json.pageNumber != null 
      //             ? details.json.bookNumber + details.json.pageNumber.padStart(6, '0')
      //             : 'UNKNOWN'),
      //           image: details.image ? details.image.s3Path : null,
      //           filedDate: new Date(details.json.filedDate).toISOString().split('T')[0],
      //           documentType: details.json.instrumentType,
      //           grantors:  details.json.grantors.map((grantor: NameObject) => formatFullName(grantor)),
      //           grantees: details.json.grantees.map((grantee: NameObject) => formatFullName(grantee)),
      //           related: details.relatedDocuments,
      //           amount: details.json.consideration
      //         };
      //       })
      //     );

      //     yield { status: "Search complete.", documents: detailedDocuments, response}
      //   },
      // }),
    },
    prepareCall: ({ options, ...settings }) => ({
      ...settings,
      experimental_context: options as Context,
    }),
    stopWhen: stepCountIs(10),
});

type MyTools = InferUITools<typeof researchAgent.tools>;

export type ResearchAgentUIMessage = UIMessage<never, never, MyTools>