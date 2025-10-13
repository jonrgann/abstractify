import { google } from '@ai-sdk/google';
import { streamText, streamObject, generateText, UIMessage, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, Output} from 'ai';
import { MyUIMessage } from '@/lib/types';
import z, { property } from 'zod';
import { orderEntryAgent } from '@/lib/agents/order-entry-agent';
import { propertySearchAgent } from '@/lib/agents/property-search-agent';
import { PropertySyncClient } from '@/lib/propertysync/client';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, attachmentURL }: { messages: UIMessage[], attachmentURL: string } = await req.json();

  const stream = createUIMessageStream<MyUIMessage>({
    async execute({ writer }) {
      // manually write start step if no LLM call
      const orderInfo = await orderEntryAgent(attachmentURL, writer);
      const searchQueries = await propertySearchAgent(JSON.stringify(orderInfo), writer);

    },
  });

  return createUIMessageStreamResponse({ stream });
}

// export async function POST(req: Request) {
//   const { messages, attachmentURL }: { messages: UIMessage[], attachmentURL: string } = await req.json();

//   const stream = createUIMessageStream<MyUIMessage>({
//     async execute({ writer }) {
//       // manually write start step if no LLM call

//       writer.write({
//         type: 'data-createOrder', // type-checked against MyUIMessage
//         id: 'createOrder',
//         data: { input:'', status: 'loading' },
//       });

//       const orderInfo = await orderEntryAgent(attachmentURL);


//       // 2. Later, update the same part (same id) with the final result
//       writer.write({
//         type: 'data-createOrder',
//         id: 'createOrder',
//         data: { 
//           input: attachmentURL,
//           output: orderInfo,
//           reasoning: '',
//           text: ``,
//           status: 'success' 
//         }, 
//       });
  

//       const client = new PropertySyncClient();
//       const PROPERTY_SYNC_USER =process.env.PROPERTYSYNC_USERNAME;
//       const PROPERTY_SYNC_PASS = process.env.PROPERTYSYNC_PASSWORD;
//       const documentGroupId = "54766f37-bfad-4922-a607-30963a9c4a60"
//       await client.login({email: PROPERTY_SYNC_USER!, password:PROPERTY_SYNC_PASS})

//       writer.write({
//         type: 'data-searchProperty',
//         id: 'searchProperty',
//         data: {
//           input: JSON.stringify(orderInfo),
//           status: 'loading'
//         }
//       });

//       const searchQueries = await propertySearchAgent(JSON.stringify(orderInfo));

//       const searchQuery = {
//         queryParams: {
//           excludeRelatedDocuments: 1,
//           subdivisions: searchQueries,
//           recordingInfo: {
//             dateFrom: null,
//             dateTo: null
//           }
//         } 
//       };

//       const searchResponse = await client.searchDocuments(documentGroupId, searchQuery);
//       let searchResults = await client.retrieveResults(documentGroupId, searchResponse.id);
//       const documentResults = searchResults.filter((r)=>r.documentType != 'ORDER').map((result)=>{
//         return {
//           documentNumber: result.documentNumber,
//           filedDate: result.filedDate,
//           documentType: result.documentType,
//           grantor: result.bestGrantor,
//           grantees: result.bestGrantee,
//           legal: result.legalHeader.replace(/\s+/g, ' ').trim()
//         };
//       });

//       writer.write({
//         type: 'data-searchProperty',
//         id: 'searchProperty',
//         data: {
//           input: JSON.stringify(orderInfo),
//           output: { query: { ...searchQueries[0], dateFrom: searchQuery.queryParams.recordingInfo.dateFrom, dateTo: searchQuery.queryParams.recordingInfo.dateTo}, results: documentResults},
//           status: 'success'
//         }
//       });

//       writer.write({
//         type: 'data-completedResearch',
//         id: 'completedResearch',
//         data: {
//           status: 'loading'
//         }
//       });
//       // 2 second delay
//       writer.write({
//         type: 'data-completedResearch',
//         id: 'completedResearch',
//         data: {
//           output: { orderInfo: orderInfo, propertySearch: { query: searchQueries[0], results: documentResults}} ,
//           status: 'success'
//         }
//       });
//     },
//   });

//   return createUIMessageStreamResponse({ stream });
// }
