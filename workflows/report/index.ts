import { convertToModelMessages, UIMessageChunk, type UIMessage } from "ai";
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import { sendEmail } from "../steps/send-email";
import { extractOrderInfo } from "../steps/extract-order-info";
import { getPropertySyncBearerToken } from "../steps/login-propertysync";
import { getSubdivisions } from "../steps/get-subdivisions";
import { generateSearchQueries } from "../steps/generate-search-queries";
import { selectSubdivision } from "../steps/select-subdivision";
import { searchPropertySync } from "../steps/search";
import { retrieveResults } from "../steps/retrieve-results";
import { generateHTML } from "../steps/generate-html";
import { getPlantDetails } from "../steps/get-plant-details";
import { generateTitleReportEmail } from "./templates/title-report-email";
import { retrieveDocumentIds } from "../steps/retrieve-document-ids";
import { getDocumentDetails } from "../steps/get-document-details";
import { formatFullName, filterByDeeds, getDeedsLast24Months } from "@/lib/research/utils";
import { determineNamesInTitleFromChain } from "@/lib/research/utils";
import { getLatestDeed } from "@/lib/research/utils";
import { getVestingInfo } from "../steps/get-vesting-info";
import { Document } from "@/lib/research/utils";
import { uploadToSupabase } from "../steps/upload-file";
import { getTitleReportBlob } from "./templates/title-report";
import { generatePDF } from "../steps/generate-pdf";
import { createChainOfTitle } from "@/lib/research/utils";

export async function generateReport(url: string, email: string) {
	"use workflow";

	// Step 0: Extract Order Information
	const orderInfo = await extractOrderInfo(url);

	// Step 1: Get Bearer Token from PropertySync
	const { token } = await getPropertySyncBearerToken();

	let documentGroupId = "54766f37-bfad-4922-a607-30963a9c4a60"
    const companyId = "da87ef4e-60a9-4a38-b743-c53c20ed4f18" // Need to eventually get this from user.

	if(orderInfo.county.toUpperCase() === "BENTON"){
		documentGroupId = "54766f37-bfad-4922-a607-30963a9c4a60"
	}

	if(orderInfo.county.toUpperCase() === "WASHINGTON"){
		documentGroupId = "4c8cdb5e-1335-4a4a-89b0-523e02386af0"
	}

	// Get context from plant.  Subdivisions, effective date etc.
	const subdivisions = await getSubdivisions(documentGroupId, token);
	const { plantEffectiveDate, name: plantName } = await getPlantDetails(documentGroupId, token);

	// Step 2: Generate Property Search Query
	const propertyQueries: { queries: { lot: string | null, block: string | null, addition: string }[]} = await generateSearchQueries(orderInfo.legalDescription ?? '');

	// Step 3: Normalize the subdivision names in the queries.
	const normalizedPropertyQueries = await Promise.all(
		propertyQueries.queries.map(async (query: any) => {
		  return {
			...query,
			addition: await selectSubdivision(query.addition, subdivisions.map((sub: { id: string, type: string, value: string}) => sub.value))
		  }
		})
	)

	// Step 4: Search PropertySync with Queries
	const searchResponse = await searchPropertySync(documentGroupId,token, {
        queryParams: {
          excludeOrders: 1,
          excludeRelatedDocuments: 1,
          subdivisions: normalizedPropertyQueries,
        } 
    })

	// Step 5: Retrieve Document Ids
	const documentIds = await retrieveDocumentIds(documentGroupId,token, searchResponse.id);

	// Step 6 Get All Document Details
	const propertyDocuments = await Promise.all(
		documentIds.map((id: string) => getDocumentDetails(documentGroupId, token, id))
	);

	const documents = convertToDocuments(propertyDocuments);

	// Step 7 Get Vesting Info from last deed.
	const lastDeed = getLatestDeed(documents);
	const { grantee : vestingName } = await getVestingInfo(lastDeed);
	const vestingInfo = { 
		name: vestingName, 
		recordingNumber: lastDeed.documentNumber, 
		recordingDate: lastDeed.filedDate
	}


	const chainOfTitle = createChainOfTitle(documents);

	// Add Buyer names to chain of title.
	if(orderInfo.borrowers){
		for (const buyer of orderInfo.borrowers){
			chainOfTitle.push({ name: buyer.toUpperCase(), startDate: '', endDate: null, acquiredBy: '', conveyedBy: null})
		}
	}

	for (const query of chainOfTitle) {

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

	  const nameSearchResponse = await searchPropertySync(documentGroupId,token, nameSearchQuery);
	  if(nameSearchResponse.count < 50){
		const nameSearchDocumentIds = await retrieveDocumentIds(documentGroupId,token, nameSearchResponse.id);
		const nameSearchDocuments = await Promise.all(
		  nameSearchDocumentIds.map((id: string) => getDocumentDetails(documentGroupId, token, id))
		);
			documents.push(...convertToDocuments(nameSearchDocuments));
		}
	  }

	// Generate Report PDF
	const deeds = filterByDeeds(documents);
	const deeds24Months = getDeedsLast24Months(documents);
	const mortgages = documents.filter((doc) => ['MORTGAGE'].includes(doc.documentType.toUpperCase()));
	const exceptions = documents.filter((doc) => ['PLAT','PROTECTIVE COVENANTS',"RESTRICTIONS", "ORDINANCE", "BILL OF ASSURANCES","NOTICE","SURVEY"].includes(doc.documentType.toUpperCase()));
	const judgments = documents.filter((doc) => ['JUDGMENT','FEDERAL TAX LIEN','STATE TAX LIEN','CERT OF INDEBTEDNESS'].includes(doc.documentType.toUpperCase()));

	const releases = documents.filter((doc) => ['RELEASE', 'PARTIAL RELEASE'].includes(doc.documentType.toUpperCase()))
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
	  
	const date = new Date(); // Gets the current date and time
	const searchDate = date.toLocaleDateString('en-US', {
	  year: 'numeric',
	  month: 'long',
	  day: 'numeric'
	});

	const newEffectiveDate = new Date(plantEffectiveDate);  
	const effectiveDate = newEffectiveDate.toLocaleDateString('en-US', {
	  year: 'numeric',
	  month: 'long',
	  day: 'numeric'
	});

	const report =  { 
	  orderNumber: orderInfo.orderNumber ?? '', 
	  effectiveDate, 
	  searchDate,
	  property: { propertyAddress: orderInfo.propertyAddress ?? '', legalDescription: orderInfo.legalDescription ?? '', county: orderInfo.county} ,
	  currentOwner: vestingInfo, 
	  deedChain: deeds,
	  chain24Month: deeds24Months,
	  searchResults: documents, 
	  openMortgages: openMortgages,
	  exceptions: exceptions,
	  judgments: judgments
	}

	// Create PDF
	const reportURL =  await generatePDF(report, 'Title-Report');

	// Step 8 Generate Title Report Email.
	const emailHTML = await generateTitleReportEmail({ 
		vestingInfo,
		propertyAddress: orderInfo.propertyAddress, 
		legalDescription: orderInfo.legalDescription,
		reportURL: reportURL 
	})

	// Step 9 Send Email
	await sendEmail('Abstractify <agent@orders.abstractify.app>', email, `Title Report | Ref # ${orderInfo.orderNumber} | ${orderInfo.propertyAddress}`, emailHTML,);

}

// Helper function that converts PropertySync data to Document Type
function convertToDocuments(data: any[]): Document[]{
	// Remove Documents with a type of ORDERS
	const docs = data.filter((obj) => obj.json.instrumentType != 'ORDER')
	return docs.map((obj) => {
		return {
			documentId: obj.id,
			image: obj.image ? obj.image.s3Path : '',
			filedDate: obj.json.filedDate,
			documentNumber: obj.json.instrumentNumber || 
			(obj.json.bookNumber != null && obj.json.pageNumber != null 
			  ? obj.json.bookNumber + obj.json.pageNumber.padStart(6, '0')
			  : 'UNKNOWN'),
			documentType: obj.json.instrumentType,
			bookNumber: obj.json.bookNumber,
			pageNumber: obj.json.pageNumber,
			grantors: obj.json.grantors.map(formatFullName),
			grantees: obj.json.grantees.map(formatFullName),
			amount: obj.json.consideration,
			related: obj.relatedDocuments
		}
	})
}

