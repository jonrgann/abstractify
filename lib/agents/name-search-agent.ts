import { google } from '@ai-sdk/google';
import { generateText, Output, UIMessageStreamWriter, UIMessage} from 'ai';
import z from 'zod';
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
    

        const wildCardSearch = nameToWildcard(query.name)
        // Create Name Search
        const nameSearch = {
            queryParams: {
              excludeRelatedDocuments: 1,
              giOnly: 1,
              soundexSearch: 1,
              proximitySearch: 1,
              recordingInfo: {
                dateFrom: query.startDate,
                dateTo: query.endDate
              },
              parties: [
                {
                  partyName: wildCardSearch,
                }
              ]
            } 
          };
    
          console.log(`Searching Documents... ${query.name}`);
          const nameSearchResponse = await client.searchDocuments(documentGroupId, nameSearch);
          console.log(`Retrieving results... ${query.name}`);
          const nameSearchResults = await client.retrieveResults(documentGroupId, nameSearchResponse.id);
          console.log(`Results received... ${query.name}`);
          
          if(orderId){
            await client.addSearchToOrder(documentGroupId, companyId, orderId, { title: wildCardSearch, searchID: nameSearchResponse.id})      
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
                    query: { ...query, name: wildCardSearch},
                    results: nameDocumentResults
                }
            },
        });
    }));


    return { chainofTitle: output.chainofTitle, searchResults: searchResults, documents: documents};

}

function nameToWildcard(name: string): string {
  // Common suffixes to remove
  const suffixes = [
    'LLC',
    'Inc',
    'Corp',
    'Corporation',
    'Ltd',
    'Limited',
    'Company',
    'Co',
    'LLP',
    'LP',
    'PC',
    'PLLC',
    'PA'
  ];
  
  // Common words to filter out
  const stopWords = [
    'the',
    'a',
    'an',
    'and',
    'or',
    'of'
  ];
  
  // Remove punctuation and normalize
  let normalized = name
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .trim()
    .toLowerCase();
  
  // Split into words
  let words = normalized.split(/\s+/).filter(word => word.length > 0);
  
  // Remove suffixes
  words = words.filter(word => 
    !suffixes.some(suffix => suffix.toLowerCase() === word)
  );
  
  // Remove stop words
  words = words.filter(word => 
    !stopWords.includes(word)
  );
  
  // Take first two significant words
  const significantWords = words.slice(0, 2);
  
  // Keep first word(s) complete, truncate only the last word
  if (significantWords.length > 0) {
    const lastIndex = significantWords.length - 1;
    const lastWord = significantWords[lastIndex];
    const truncateLength = Math.min(lastWord.length, lastWord.length >= 5 ? 5 : 4);
    significantWords[lastIndex] = lastWord.substring(0, truncateLength);
  }
  
  // Join with space and add wildcard
  const result = significantWords.join(' ') + '%';
  
  // Capitalize first letter of each word for readability
  return result
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

