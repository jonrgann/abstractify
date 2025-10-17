import { google } from '@ai-sdk/google';
import { streamText, generateText, UIMessage, createUIMessageStream, createUIMessageStreamResponse, Output, type FilePart} from 'ai';
import { MyUIMessage } from '@/lib/types';
import z from 'zod';
import { orderEntryAgent } from '@/lib/agents/order-entry-agent';
import { PropertySyncClient } from '@/lib/propertysync/client';
import { subdivisionAgent } from '@/lib/agents/subdivision-agent';
import { createClient } from '@/lib/supabase/server';
import { nameSearchAgent } from '@/lib/agents/name-search-agent';
import { determineNamesInTitle, determineNamesInTitleFromChain, Document, filterByDeeds, getMostRecentDeed, createChainOfTitle, TitlePeriod } from '@/lib/research/utils'; 

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {

  const { filePart }: { messages: UIMessage[], attachmentURL: string, filePart?: FilePart } = await req.json();

  const stream = createUIMessageStream<MyUIMessage>({
    async execute({ writer }) {
    
    if(filePart){

      try{

        /* -------------- READ PDF DOCUMENT -------------- */ 
       const orderInfo = await orderEntryAgent(filePart, writer);


       /* -------------- Connect to PropertySync -------------- */ 

       writer.write({
        type: 'data-workflowConnectPropertysync',
        id: 'workflow-2',
        data: { status:'active', label:`Connecting to Propertysync...` }, 
    }); 

      const client = new PropertySyncClient();
      const PROPERTY_SYNC_USER =process.env.PROPERTYSYNC_USERNAME;
      const PROPERTY_SYNC_PASS = process.env.PROPERTYSYNC_PASSWORD;
      const documentGroupId = "54766f37-bfad-4922-a607-30963a9c4a60"
      const companyId = "da87ef4e-60a9-4a38-b743-c53c20ed4f18"
      await client.login({email: PROPERTY_SYNC_USER!, password:PROPERTY_SYNC_PASS})

      const documentGroupDetails = await client.getDocumentGroupDetails(documentGroupId);
      const subdivisions = await client.getAutoCompletes(documentGroupId, { type: "addition"})

      // Search Date

      const date = new Date(); // Gets the current date and time
      const searchDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const effectiveDateString = documentGroupDetails.plantEffectiveDate!;
      const newEffectiveDate = new Date(effectiveDateString);  
      const effectiveDate = newEffectiveDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      writer.write({
        type: 'data-workflowConnectPropertysync',
        id: 'workflow-2',
        data: { status:'complete', label:`Connected to Propertysync.`, output: { name: documentGroupDetails.name, effectiveDate } }, 
    }); 

    /* --------------- Generate Search Queries --------------------- */

    writer.write({
      type: 'data-workflowGeneratePropertySearch',
      id: 'workflow-3',
      data: { status:'active', label:`Generating search queries...`, output: { queries : [{}] } }, 
    }); 

    const result = await generateText({
      model: google('gemini-2.5-flash-lite'),
      system: `You are an expert title research assistant.  
      Your task is to use the review order information and use the searchPropertyTool to search the property within the title plant software. 
      - Use null for values not present on the order.
      - Use the addition field for both subdivisions and additions.`,
      experimental_output: Output.object({
        schema: z.object({
          queries: z.object({
            lot: z.string().nullable(),
            block: z.string().nullable(),
            addition: z.string()
          }).array()
        })
      }),
      messages: [
          {
            role: 'user',
            content: `<order-info>${JSON.stringify(orderInfo.legalDescription)}</orderInfo>`
          }
        ]
    });

    const output = JSON.parse(result.text);

    const queries = await Promise.all(
      output.queries.map(async (query: any) => {
        return {
          ...query,
          addition: await subdivisionAgent(query.addition, subdivisions.map((sub) => sub.value))
        }
      })
    )

    writer.write({
      type: 'data-workflowGeneratePropertySearch',
      id: 'workflow-3',
      data: { status:'active', label:`Generated search queries:`, output: {queries: queries } }, 
  }); 


  /*--------------- RUN SEARCH ---------------- */

  const propertySearchResults = [];
  const propertySearchDocuments = [];

  let propertySyncOrderId;
      // Process all name queries
    for (const query of queries) {

      const workflowId = crypto.randomUUID();

        writer.write({
          type: 'data-workflowSearch',
          id: workflowId,
          data: { status:'active', label:`Searching: Lot ${query.lot}, ${query.addition}` }, 
      }); 

      const searchQuery = {
        queryParams: {
          excludeOrders: 1,
          excludeRelatedDocuments: 1,
          subdivisions: queries,
          recordingInfo: {
            dateFrom: null,
            dateTo: null
          }
        } 
      };

      const searchResponse = await client.searchDocuments(documentGroupId, searchQuery);
      const searchResults = await client.retrieveResults(documentGroupId, searchResponse.id);
      // const createOrderResponse = await client.createOrder(documentGroupId, companyId, { title: `AI-${orderInfo.orderNumber}`, searchID: searchResponse.id})
      // propertySyncOrderId = createOrderResponse.id;
      const documentResults = searchResults.filter((r)=>r.documentType != 'ORDER').map((result)=>{
        return {
          documentId:result.documentId,
          documentNumber: result.documentNumber ? result.documentNumber : result.bookNumber + result.pageNumber.padStart(6, '0')  ,
          filedDate: result.filedDate,
          documentType: result.documentType,
          grantor: result.bestGrantor,
          grantee: result.bestGrantee,
          legal: result.legalHeader.replace(/\s+/g, ' ').trim()
        };
      });


    writer.write({
      type: 'data-workflowGeneratePropertySearch',
      id: 'workflow-3',
      data: { status:'complete', label:`Generated search queries:`, output: { queries: queries, results: documentResults} }, 
  }); 

    propertySearchResults.push(...searchResults);
    propertySearchDocuments.push(...documentResults);

    }

    const documentIds = propertySearchDocuments.filter((r)=>r.documentType != 'ORDER').map((result)=> result.documentId);
   
    const allPropertyDocuments = await Promise.all(
      documentIds.map(async (documentId, index) => {
        // Stagger the start of each request by 200ms
        await new Promise(resolve => setTimeout(resolve, index * 200));
        
        const details = await client.getDocumentDetails(documentGroupId, documentId);
        
        return {
          documentId: details.id,
          documentNumber: details.json.instrumentNumber ? details.json.instrumentNumber : details.json.bookNumber + details.json.pageNumber.padStart(6, '0'),
          filedDate: new Date(details.json.filedDate).toISOString().split('T')[0],
          documentType: details.json.instrumentType,
          grantors: details.json.grantors,
          grantees: details.json.grantees,
        };
      })
    );


    /*--------------- To Do: Read and summarize documents ---------------- */

      // const documentsToSummarize =  propertySearchResults.filter((r)=>r.documentType != 'ORDER').map((result)=>{
      //   return {
      //     id: result.documentId,
      //     documentNumber: result.documentNumber,
      //     documentType: result.documentType,
      //   };
      // });
      
 
      //  Batch processing summaries (parallel with concurrency limit)
      // async function processBatch(items: any, batchSize = 10) {
      //   const results = [];
      //   for (let i = 0; i < items.length; i += batchSize) {
      //     await new Promise(resolve => setTimeout(resolve, i * 200)); 
      //     const batch = items.slice(i, i + batchSize);
      //     const batchResults = await Promise.all(
      //       batch.map(async (doc: any) => {

      //         writer.write({
      //           type: 'data-workflowSummarize',
      //           id: `workflow-${doc.id}`,
      //           data: { status:'active', label:`Reading Document: ${doc.documentNumber}...`,  }, 
      //       }); 

      //         const details = await client.getDocumentDetails(documentGroupId, doc.id);


      //         const document = {
      //           documentId: details.id,
      //           documentNumber: details.json.instrumentNumber,
      //           filedDate: details.json.filedDate,
      //           documentType: details.json.instrumentType,
      //           grantors: details.json.grantors,
      //           grantees: details.json.grantees,
      //           // legal: details.json.subdivisionLegal,
      //           // summary: summary
      //         }
             
      //         allPropertyDocuments.push(document)

      //         let summary;
      //       //   const sumamarizeAgent = streamText({
      //       //     model: google('gemini-2.5-flash-lite'),
      //       //     system: `You are an expert at summarizing real estate documents filed with the county clerk.  Your task is to summarize the document in 5 sentences or less, but include all of the relevant filing dates, party names, legal descriptions.  Extract all grantor and grantee names exactly as they appear on the document. Include only the summary in your response. Summary:`,
      //       //     messages: [
      //       //       {
      //       //         role: 'user',
      //       //         content: [
      //       //           {
      //       //             type: 'text',
      //       //             text: "<document>"
      //       //           },
      //       //           { type: 'image', image: details.image.s3Path},
      //       //           {
      //       //             type: 'text',
      //       //             text: "</document>"
      //       //           }
      //       //         ]
      //       //       }
      //       //     ],
      //       //     onFinish: async ({ text }) => {
      //       //       writer.write({
      //       //         type: 'data-workflowSummarize',
      //       //         id: `workflow-${doc.id}`,
      //       //         data: { status:'complete', label:`Read Document: ${doc.documentNumber} - ${doc.documentType} `, output: { summary : text}}, 
      //       //     }); 
      //       //     summary = text;

      //       //     const document = {
      //       //       documentId: details.id,
      //       //       documentNumber: details.json.instrumentNumber,
      //       //       filedDate: details.json.filedDate,
      //       //       documentType: details.json.instrumentType,
      //       //       grantors: details.json.grantors,
      //       //       grantees: details.json.grantees,
      //       //       // legal: details.json.subdivisionLegal,
      //       //       // summary: summary
      //       //     }
               
      //       //     allPropertyDocuments.push(document)
      //       //     }
      //       // },);

      //       // for await (const textPart of sumamarizeAgent.textStream) {
      //       //   writer.write({
      //       //     type: 'data-workflowSummarize',
      //       //     id: `workflow-${doc.id}`,
      //       //     data: { status:'active', label:`Reading Document: ${doc.documentNumber}`, output: { summary : textPart}}, 
      //       // }); 
      //       // }

      //         return summary;
      //       })
      //     );
      //     results.push(...batchResults);
      //   }
      //   return results;
      // }

    /*--------------- To Do:Creating Chain of Title ---------------- */


      // const [summaries, chainOfTitleAgent] = await Promise.all([
      //   processBatch(documentsToSummarize),
      //   nameSearchAgent(filterByDeeds(propertySearchDocuments), writer, client, documentGroupId, companyId, propertySyncOrderId! )
      // ]);

      // await processBatch(documentsToSummarize)
      // const chainOfTitleAgent =  await nameSearchAgent(filterByDeeds(allPropertyDocuments), writer, client, documentGroupId, companyId, propertySyncOrderId! )
      // const nameSearchDocuments = chainOfTitleAgent.documents


      const nameSearchDocuments: any[] = [];
      const currentowners = determineNamesInTitle(allPropertyDocuments);
      const chainOfTitle = createChainOfTitle(allPropertyDocuments);

      console.log(chainOfTitle)

      for (const query of chainOfTitle) {

        const workflowId = crypto.randomUUID();

        writer.write({
          type: 'data-workflowGenerateNameSearch',
          id: workflowId, // Unique ID for this specific query's update
          data: {
              status: 'active', // Change status to reflect ongoing work
              label: `Generating name search`,
              output: {
                  query: query
              }
          },
      });
  
        const nameSearchQuery = {
          queryParams: {
            excludeRelatedDocuments: 1,
            giOnly: 1,
            soundexSearch: 1,
            proximitySearch: 1,
            recordingInfo: {
              dateFrom: query.startDate == 'UNKNOWN' ? null : query.startDate,
              dateTo: query.endDate == 'UNKNOWN' ? null : query.endDate,
            },
            parties: [
              {
                partyName: query.name,
              }
            ]
          } 
        };
  
        const searchResponse = await client.searchDocuments(documentGroupId, nameSearchQuery);
        const searchResults = await client.retrieveResults(documentGroupId, searchResponse.id);
        // const createOrderResponse = await client.createOrder(documentGroupId, companyId, { title: `AI-${orderInfo.orderNumber}`, searchID: searchResponse.id})
        // propertySyncOrderId = createOrderResponse.id;
        const documentResults = searchResults.filter((r)=>r.documentType != 'ORDER').map((result)=>{
          return {
            documentId:result.documentId,
            documentNumber: result.documentNumber ? result.documentNumber : result.bookNumber + result.pageNumber.padStart(6, '0')  ,
            filedDate: new Date(result.filedDate).toISOString().split('T')[0],
            documentType: result.documentType,
            grantor: result.bestGrantor,
            grantee: result.bestGrantee,
            legal: result.legalHeader.replace(/\s+/g, ' ').trim()
          };
        });
  

        writer.write({
          type: 'data-workflowGenerateNameSearch',
          id: workflowId, // Unique ID for this specific query's update
          data: {
              status: 'complete', // Change status to reflect ongoing work
              label: `Generating name search`,
              output: {
                  query: { ...query, name: query.name},
                  results: documentResults
              }
          },
        })
  
      nameSearchDocuments.push(...documentResults);
  
      }
 
    /* ---------- To Do: GET VESTING INFO -----------*/

    const vestingInfo =  { names: currentowners.join(", ")}

      writer.write({
        type: 'data-workflowVesting',
        id: 'workflow-vesting-1',
        data: { status:'complete', label:`Names in Title:`, output: vestingInfo }, 
    }); 

    /* --------------- GENERATE REPORT DATA -------------- */

      const allDocuments = [...propertySearchDocuments, ...nameSearchDocuments];
      const openMortgages = allDocuments.filter((doc) => ['MORTGAGE'].includes(doc.documentType.toUpperCase()));
      const exceptions = allDocuments.filter((doc) => ['PLAT','PROTECTIVE COVENANTS'].includes(doc.documentType.toUpperCase()));
      const judgments = allDocuments.filter((doc) => ['JUDGMENT','FEDERAL TAX LIEN','STATE TAX LIEN'].includes(doc.documentType.toUpperCase()));

      const report =  { 
        orderInfo, 
        effectiveDate, 
        searchDate, 
        vesting: vestingInfo, 
        searchResults: propertySearchDocuments, 
        openMortgages, 
        exceptions, 
        judgments, 
        orderUrl: `https://portal.propertysync.com/documents/?orderId=${propertySyncOrderId}` 
      }
  
      writer.write({
        type: 'data-workflowResearchComplete',
        id: 'workflow-complete',
        data: { 
          output: report,
          status:'complete', 
          label:`Completed Research` 
        }, 
      }); 


      }catch(error){

        writer.write({
          type: 'data-error',
          id: 'error',
          data: { message: JSON.stringify(error, null, 2) }
      }); 

      }
    }
    },
    originalMessages:[],
    onFinish: async ({ messages }) => {
      // console.log('Stream finished with messages:', JSON.stringify(messages, null, 2));

      // Save Messages to Database
      const supabase = await createClient();
      await supabase.from('messages').insert([ { messages } ]).select();
      
    },
  },
);

  return createUIMessageStreamResponse({ 
    stream,
});

}


