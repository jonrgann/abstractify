import { google } from '@ai-sdk/google';
import {
    convertToModelMessages,
    createUIMessageStream,
    createUIMessageStreamResponse,
    Output,
    streamText,
  } from 'ai';
  import { z } from 'zod';

  import { PropertySyncClient } from '@/lib/propertysync/client';
  import { subdivisionAgent } from '@/lib/agents/subdivision-agent';
  import { determineNamesInTitle, determineNamesInTitleFromChain, Document, filterByDeeds, getMostRecentDeed, createChainOfTitle, TitlePeriod, filterByDocumentTypes, NameObject, formatFullName, getLatestDeed, getDeedsLast24Months } from '@/lib/research/utils'; 
  export async function POST(req: Request) {
    const { messages } = await req.json();
    
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // step 1 example: forced tool call

        writer.write({
            type: 'data-workflowReadOrder',
            id: 'workflowReadOrder-1',
            data: { status: 'active' }
        }); 
        const result1 = streamText({
        model: google('gemini-2.5-flash'),
        system: `You are an expert title research assistant.  
        Your task is review a document and extract the title order information so that it can be imported into the title plant system.
        - Extract the order number, seller names, buyer (borrower) names, and legal descriptions.`,
        messages: convertToModelMessages(messages),
        output: Output.object({
            schema: z.object({
                orderNumber: z.string(),
                sellers: z.string().array(),
                borrowers: z.string().array(),
                propertyAddress: z.string(),
                legalDescription: z.string(),
                county: z.string(),
            })
        }),
        onFinish: async ({ text }) => {
            const data = JSON.parse(text);
            writer.write({
                type: 'data-workflowReadOrder',
                id: 'workflowReadOrder-1',
                data: { output: data, status: 'complete'}
            }); 
        },
        });
  
        // forward the initial result to the client without the finish event:
        writer.merge(result1.toUIMessageStream({ sendFinish: false }));
  
        // note: you can use any programming construct here, e.g. if-else, loops, etc.
        // workflow programming is normal programming with this approach.

        const orderInfo = JSON.parse(await result1.text);

        if(orderInfo.county.toUpperCase() != "BENTON" || orderInfo.county.toUpperCase() != "WASHINGTON" ){
          writer.write({
            type: 'data-workflowError',
            id: 'workflowError-1',
            data: { status: 'complete', output: 'I can only work on properties in Benton and Washington county at this time.  Please refresh the page and try again.'}
          }); 
          // Exits Stream.
          return;
        }
  
        // example: continue stream with forced tool call from previous step

        writer.write({
          type: 'data-workflowGeneratePropertySearch',
          id: 'workflowGeneratePropertySearch-1',
          data: { status: 'active', output: { queries:[], results:[] }}
      }); 

        const result2 = streamText({
          // different system prompt, different model, no tools:
          model: google('gemini-2.5-flash'),
          system: `You are an expert title research assistant.  
          Your task is to use the review order information and use the searchPropertyTool to search the property within the title plant software. 
          - Use null for values not present on the order.
          - Use the addition field for both subdivisions and additions.`,
          prompt:`<order-info>${JSON.stringify(orderInfo.legalDescription)}</orderInfo>`,
          output: Output.object({
            schema: z.object({
                queries: z.object({
                  lot: z.string().nullable(),
                  block: z.string().nullable(),
                  addition: z.string()
                }).array()
              })
        }),
        onFinish: async ({ text }) => {
            const data = JSON.parse(text);
            writer.write({
                type: 'data-workflowGeneratePropertySearch',
                id: 'workflowGeneratePropertySearch-1',
                data: { output: data , status: 'active'}
            }); 
        },
        });
  
        writer.merge(result2.toUIMessageStream({ sendStart: false }));


        // Step 3. Connect to PropertySync

        const client = new PropertySyncClient();
        const PROPERTY_SYNC_USER =process.env.PROPERTYSYNC_USERNAME;
        const PROPERTY_SYNC_PASS = process.env.PROPERTYSYNC_PASSWORD;
        const companyId = "da87ef4e-60a9-4a38-b743-c53c20ed4f18"
        await client.login({email: PROPERTY_SYNC_USER!, password:PROPERTY_SYNC_PASS})

        let documentGroupId = "54766f37-bfad-4922-a607-30963a9c4a60"
        if(orderInfo.county.toUpperCase() === "BENTON"){
          documentGroupId = "54766f37-bfad-4922-a607-30963a9c4a60"
        }
  
        if(orderInfo.county.toUpperCase() === "WASHINGTON"){
          documentGroupId = "4c8cdb5e-1335-4a4a-89b0-523e02386af0"
        }
  
        const documentGroupDetails = await client.getDocumentGroupDetails(documentGroupId);
        const subdivisions = await client.getAutoCompletes(documentGroupId, { type: "addition"})

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

        // Run Search

        const generatedQueries = JSON.parse(await result2.text);

        const queries = await Promise.all(
          generatedQueries.queries.map(async (query: any) => {
            return {
              ...query,
              addition: await subdivisionAgent(query.addition, subdivisions.map((sub) => sub.value))
            }
          })
        )

        writer.write({
          type: 'data-workflowGeneratePropertySearch',
          id: 'workflowGeneratePropertySearch-1',
          data: { output: {queries: queries} , status: 'complete'}
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
              data: { status:'active', output: { results: []} }, 
            }); 

            const searchQuery = {
              queryParams: {
                excludeOrders: 1,
                excludeRelatedDocuments: 1,
                subdivisions: queries,
                recordingInfos: [{
                  dateFrom: null,
                  dateTo: null
                }]
              } 
            };

            const searchResponse = await client.searchDocuments(documentGroupId, searchQuery);
            const searchResults = await client.retrieveResults(documentGroupId, searchResponse.id);
            const createOrderResponse = await client.createOrder(documentGroupId, companyId, { title: `AI-${orderInfo.orderNumber}`, searchID: searchResponse.id})
            propertySyncOrderId = createOrderResponse.id;
            const documentResults = searchResults.filter((r)=>r.documentType != 'ORDER').map((result)=>{

              return {
                documentId:result.documentId,
                documentNumber: result.documentNumber || 
                (result.bookNumber != null && result.pageNumber != null 
                  ? result.bookNumber + result.pageNumber.padStart(6, '0')
                  : 'UNKNOWN'),
                filedDate: result.filedDate,
                documentType: result.documentType,
                grantors: [result.bestGrantor],
                grantees: [result.bestGrantee],
                legal: result.legalHeader.replace(/\s+/g, ' ').trim(),
                amount: result.details.consideration
              };
            });


           console.log(searchResponse)
            writer.write({
              type: 'data-workflowSearch',
              id: workflowId,
              data: { status:'complete',  output: { results: documentResults} }, 
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

          // Step 4. Name Searches

          const nameSearchDocuments: any[] = [];
          const currentowners = determineNamesInTitleFromChain(allPropertyDocuments);

          console.log(allPropertyDocuments)
          console.log('current owners', currentowners)
          const chainOfTitle = createChainOfTitle(allPropertyDocuments);
    
          // Add Buyer names to chain of title.
          for ( const buyer of orderInfo.borrowers){
            chainOfTitle.push({ name: buyer.toUpperCase(), startDate: '', endDate: null, acquiredBy: '', conveyedBy: null})
          }

          console.log(chainOfTitle)
    
          for (const query of chainOfTitle) {
    
            const workflowId = crypto.randomUUID();
    
            writer.write({
              type: 'data-workflowGenerateNameSearch',
              id: `name-` + workflowId, // Unique ID for this specific query's update
              data: {
                  status: 'complete', // Change status to reflect ongoing work
                  output: {
                      query: query
                  }
              },
          });

          writer.write({
            type: 'data-workflowSearch',
            id: workflowId, // Unique ID for this specific query's update
            data: {
                status: 'active', // Change status to reflect ongoing work
                output: {
                    results: []
                }
            },
          })

          const wildCardSearch = nameToWildcard(query.name)

          const nameSearchQuery = {
            queryParams: {
              excludeRelatedDocuments: 1,
              giOnly: 1,
              soundexSearch: 1,
              proximitySearch: 1,
              recordingInfos: [{
                dateFrom: query.startDate == '' ? null : query.startDate,
                dateTo: query.endDate == '' ? null : query.endDate,
              }],
              parties: [
                {
                  partyName: query.name,
                },
              ]
            } 
          };
      
            const searchResponse = await client.searchDocuments(documentGroupId, nameSearchQuery);
            const searchResults = await client.retrieveResults(documentGroupId, searchResponse.id);
            if(propertySyncOrderId){
              await client.addSearchToOrder(documentGroupId,companyId, propertySyncOrderId, { title: query.name, searchID: searchResponse.id})
            }
            const documentResults = searchResults.filter((r)=>r.documentType != 'ORDER').map((result)=>{
              return {
                documentId:result.documentId,
                documentNumber: result.documentNumber || 
                (result.bookNumber != null && result.pageNumber != null 
                  ? result.bookNumber + result.pageNumber.padStart(6, '0')
                  : 'UNKNOWN'),
                filedDate: new Date(result.filedDate).toISOString().split('T')[0],
                documentType: result.documentType,
                grantors: [result.bestGrantor],
                grantees: [result.bestGrantee],
                legal: result.legalHeader.replace(/\s+/g, ' ').trim()
              };
            });
      
    
            writer.write({
              type: 'data-workflowSearch',
              id: workflowId, // Unique ID for this specific query's update
              data: {
                  status: 'complete', // Change status to reflect ongoing work
                  output: {
                      results: documentResults
                  }
              },
            })
      
          nameSearchDocuments.push(...documentResults);
      
          }


          // Get Vesting Info

          writer.write({
            type: 'data-workflowVesting',
            id: 'workflowVesting-1',
            data: { status: 'active'}
        }); 

          const lastDeed = getLatestDeed(allPropertyDocuments)
          const lastDeedDetails = await client.getDocumentDetails(documentGroupId, lastDeed.documentId);
          const lastDeedImage = lastDeedDetails.image.s3Path;

          const vestingResult = streamText({
            // different system prompt, different model, no tools:
            model: google('gemini-2.5-flash'),
            system: `You are an expert title research assistant.  
            Your task is to review the attached Deed, analyze the vesting info and extract the grantee names exactly as they appear on the document. 
            Examples of Proper Extraction:
            Individual Names:
  
            John Smith and Jane Smith, a married couple
            John Smith and Jane Smith, husband and wife
            John Smith, a single man
            Jane Doe, an unmarried woman
            Robert Johnson, a widower
  
            Business Entities:
  
            Home Brew Construction, LLC, a limited liability company of Missouri
            ABC Corporation, a Delaware corporation
            Smith & Jones Partnership, a general partnership
            Main Street Properties, Inc., a California corporation
  
            Trusts:
  
            John Smith, Trustee of the Smith Family Trust dated January 15, 2020
            Mary Johnson, as Trustee of the Johnson Revocable Living Trust
  
            Multiple Parties:
  
            John Smith, a single man, and Mary Jones, a single woman, as joint tenants with right of survivorship
            ABC Company, LLC, a Texas limited liability company, as to an undivided 50% interest, and XYZ Corporation, a Nevada corporation, as to an undivided 50% interest
  
            Key Points:
  
            Include all punctuation (commas, periods, etc.)
            Preserve capitalization exactly as shown
            Include marital status or entity type descriptors
            Include state of formation for business entities
            Copy ownership percentages if specified
            Include capacity designations (trustee, personal representative, etc.)
            Do not abbreviate unless the deed itself uses abbreviations`,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: "<deed>"
                  },
                  {
                    type:'image',
                    image:lastDeedImage
                  },
                  {
                    type: 'text',
                    text: "</deed>"
                  }
                ]
              }
            ],
            output: Output.object({
              schema: z.object({
                  grantee: z.string(),
                })
          }),
          onFinish: async ({ text }) => {
              const data = JSON.parse(text);
              writer.write({
                  type: 'data-workflowVesting',
                  id: 'workflowVesting-1',
                  data: { output: { name: data.grantee } , status: 'complete'}
              }); 
          },
          });

        const vestingName = JSON.parse(await vestingResult.text);
        const vestingInfo = { name: vestingName.grantee, recordingDate: lastDeed.filedDate, recordingNumber: lastDeed.documentNumber }

        const allDocuments = [...propertySearchDocuments, ...nameSearchDocuments];
        const mortgages = propertySearchDocuments.filter((doc) => ['MORTGAGE'].includes(doc.documentType.toUpperCase()));
        const releases = allPropertyDocuments.filter((doc) => ['RELEASE', 'PARTIAL RELEASE'].includes(doc.documentType.toUpperCase()))
        const releasedDocumentIds: string[] = [];
        for ( const doc of releases){
            if(doc.related){
              for (const relatedDoc of doc.related){
                releasedDocumentIds.push(relatedDoc.documentId)
              }
            }
        }

        // Create openMortgages by filtering out released mortgages
        const openMortgages = mortgages.filter((mortgage) => 
          !releasedDocumentIds.includes(mortgage.documentId)
        );

        const deeds = filterByDeeds(allPropertyDocuments);
        const deeds24Months = getDeedsLast24Months(allPropertyDocuments);
        const chain24Month: Document[] = await Promise.all(
          deeds24Months.map(async (deed) => {
              if (deed.image) {
                const vestingResult = streamText({
                  // different system prompt, different model, no tools:
                  model: google('gemini-2.5-flash'),
                  system: `You are an expert title research assistant.  
                  Your task is to review the attached Deed, analyze the vesting info and extract the grantor and grantee names exactly as they appear on the document. 
                  Examples of Proper Extraction:
                  Individual Names:
        
                  John Smith and Jane Smith, a married couple
                  John Smith and Jane Smith, husband and wife
                  John Smith, a single man
                  Jane Doe, an unmarried woman
                  Robert Johnson, a widower
        
                  Business Entities:
        
                  Home Brew Construction, LLC, a limited liability company of Missouri
                  ABC Corporation, a Delaware corporation
                  Smith & Jones Partnership, a general partnership
                  Main Street Properties, Inc., a California corporation
        
                  Trusts:
        
                  John Smith, Trustee of the Smith Family Trust dated January 15, 2020
                  Mary Johnson, as Trustee of the Johnson Revocable Living Trust
        
                  Multiple Parties:
        
                  John Smith, a single man, and Mary Jones, a single woman, as joint tenants with right of survivorship
                  ABC Company, LLC, a Texas limited liability company, as to an undivided 50% interest, and XYZ Corporation, a Nevada corporation, as to an undivided 50% interest
        
                  Key Points:
        
                  Include all punctuation (commas, periods, etc.)
                  Preserve capitalization exactly as shown
                  Include marital status or entity type descriptors
                  Include state of formation for business entities
                  Copy ownership percentages if specified
                  Include capacity designations (trustee, personal representative, etc.)
                  Do not abbreviate unless the deed itself uses abbreviations`,
                  messages: [
                    {
                      role: 'user',
                      content: [
                        {
                          type: 'text',
                          text: "<deed>"
                        },
                        {
                          type:'image',
                          image:deed.image
                        },
                        {
                          type: 'text',
                          text: "</deed>"
                        }
                      ]
                    }
                  ],
                  output: Output.object({
                    schema: z.object({
                        grantor: z.string(),
                        grantee: z.string(),
                      })
                }),
                });
                  const vestingText = await vestingResult.text;
                  const vesting = JSON.parse(vestingText);
                  return { ...deed, grantors: [vesting.grantor], grantees: [vesting.grantee] };
              }
              return deed;
          })
      );

      console.log('24 month chain', chain24Month);

        const exceptions = allDocuments.filter((doc) => ['PLAT','PROTECTIVE COVENANTS',"RESTRICTIONS", "ORDINANCE", "BILL OF ASSURANCES","NOTICE"].includes(doc.documentType.toUpperCase()));
        const judgments = allDocuments.filter((doc) => ['JUDGMENT','FEDERAL TAX LIEN','STATE TAX LIEN'].includes(doc.documentType.toUpperCase()));

        const report =  { 
          orderNumber: orderInfo.orderNumber, 
          effectiveDate, 
          searchDate,
          property: { propertyAddress: orderInfo.propertyAddress, legalDescription: orderInfo.legalDescription, county: orderInfo.county} ,
          currentOwner: vestingInfo, 
          deedChain: deeds,
          chain24Month: chain24Month,
          searchResults: propertySearchDocuments, 
          openMortgages: openMortgages,
          exceptions: exceptions,
          judgments: judgments
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

      },
      onFinish: async ({ messages }) => {
        // console.log('Stream finished with messages:', JSON.stringify(messages, null, 2));
      },
    },
  );
  
    return createUIMessageStreamResponse({ stream });
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
    const normalized = name
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