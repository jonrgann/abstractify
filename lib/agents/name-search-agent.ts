import { google, GoogleGenerativeAIProviderOptions} from '@ai-sdk/google';
import { generateText, Output, UIMessageStreamWriter, UIMessage} from 'ai';
import z, { url } from 'zod';
import { PropertySyncClient } from '../propertysync/client';

export const nameSearchAgent = async (input: any, writer: UIMessageStreamWriter<UIMessage>, client: PropertySyncClient, documentGroupId: string, companyId: string, orderId?: string) => {

    const initialWorkflowId = `workflow-${crypto.randomUUID()}`;

    writer.write({
        type: 'data-workflowGenerateNameSearch',
        id: initialWorkflowId,
        data: { status:'active', label:`Generating name searchers:`, output: { query: {} } }, 
    }); 

    const searchQueryAgent = await generateText({
        model: google('gemini-2.5-flash'),
        system: `You are an expert title research assistant.  
        Your task is to review the results of a title search and create a chain of title.  Review the deeds and determine when grantees gained ownership of a property using the filedDate.
        - Foramt dates as 'YYYY-MM-DD'
        - Use the filedDate as the startDate for when a grantee came into title.
        - Use the fileDate as the endDate for when a grantor came out of title.
        - Use null for the startDate if no start date can be found.
        - Use null for the endDate when an individual is still in title`,
        experimental_output: Output.object({
          schema: z.object({
            chainOfTitle: z.object({
              name: z.string().nullable(),
              startDate: z.string().nullable(),
              endDate: z.string().nullable()
            }).array()
          })
        }),
        messages: [
          {
            role: 'user',
            content: `<title_search_results>${JSON.stringify(input)}</title_search_results>`
          }
        ]
      })


    const output = JSON.parse(searchQueryAgent.text);

    const queries = output.chainOfTitle;
    
    const searchResults: { query: any, results: any}[] = [];
    const documents: any[] = [];

    await Promise.all(queries.map(async (query: any, index: number) => {
        // Generate a unique ID for each specific query processing event.
        // This allows you to track individual query progress if needed,
        // while still associating them with the overall workflowInstanceId.
        const workflowId = index === 0 ? initialWorkflowId : `workflow-${crypto.randomUUID()}`;
    
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
    
        // Create Name Search
        const nameSearch = {
            queryParams: {
              excludeRelatedDocuments: 1,
              giOnly: 1,
              recordingInfo: {
                dateFrom: query.startDate,
                dateTo: query.endDate
              },
              parties: [
                {
                  partyName: query.name,
                }
              ]
            } 
          };
    
          const nameSearchResponse = await client.searchDocuments(documentGroupId, nameSearch);
          let nameSearchResults = await client.retrieveResults(documentGroupId, nameSearchResponse.id);
          
          if(orderId){
            await client.addSearchToOrder(documentGroupId, companyId, orderId, { title: query.name, searchID: nameSearchResponse.id})      
          }

          const nameDocumentResults = nameSearchResults.filter((r) => r.documentType != 'ORDER').map((result) => {
            return {
              documentNumber: result.documentNumber,
              filedDate: result.filedDate,
              documentType: result.documentType,
              grantor: result.bestGrantor,
              grantee: result.bestGrantee,
              legal: result.legalHeader.replace(/\s+/g, ' ').trim()
            };
          });

          searchResults.push({query: query, results: nameDocumentResults})
          documents.push(...nameDocumentResults)
          writer.write({
            type: 'data-workflowGenerateNameSearch',
            id: workflowId, // Unique ID for this specific query's update
            data: {
                status: 'complete', // Change status to reflect ongoing work
                label: `Generating name search`,
                output: {
                    query: query,
                    results: nameDocumentResults
                }
            },
        });
    }));


    return { chainofTitle: output.chainofTitle, searchResults: searchResults, documents: documents};

}

