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
import { generateTitleReportBase64 } from "@/components/generateTitleReportPDF";

export async function generateReport(query: string) {
	"use workflow";

	//Send Email:
	const url = 'https://lbndwiqgqqpzjwkhbdip.supabase.co/storage/v1/object/public/uploads/order-sheet-25-3057.pdf'
	const documentGroupId = "54766f37-bfad-4922-a607-30963a9c4a60"
    const companyId = "da87ef4e-60a9-4a38-b743-c53c20ed4f18" // Need to eventually get this from user.

	// Step 0: Get Bearer Token from PropertySync
	const { token } = await getPropertySyncBearerToken();

	// Get context from plant.  Subdivisions, effective date etc.
	const subdivisions = await getSubdivisions(documentGroupId, token);
	const { effectiveDate, name: plantName } = await getPlantDetails(documentGroupId, token);

	// Step 1: Extract Order Information
	const orderInfo = await extractOrderInfo(url);

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

	// Step 8 Generate Title Report Email.
	const emailHTML = await generateTitleReportEmail({ 
		vestingInfo,
		propertyAddress: orderInfo.propertyAddress, 
		legalDescription: orderInfo.legalDescription,
		reportURL: url 
	})

	// Generate Report PDF
	const deeds = filterByDeeds(documents);
	const deeds24Months = getDeedsLast24Months(documents);
	const exceptions = documents.filter((doc) => ['PLAT','PROTECTIVE COVENANTS',"RESTRICTIONS", "ORDINANCE", "BILL OF ASSURANCES","NOTICE","SURVEY"].includes(doc.documentType.toUpperCase()));
	const judgments = documents.filter((doc) => ['JUDGMENT','FEDERAL TAX LIEN','STATE TAX LIEN'].includes(doc.documentType.toUpperCase()));

	const date = new Date(); // Gets the current date and time
	const searchDate = date.toLocaleDateString('en-US', {
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
	  chain24Month: [],
	  searchResults: documents, 
	  openMortgages: [],
	  exceptions: exceptions,
	  judgments: judgments
	}

	// const reportPDF = await generateTitleReportBase64(report);
	// const attachment = { content: reportPDF, fileName:"Title Report"}

	// Step 9 Send Email
	await sendEmail('Abstractify <agent@orders.abstractify.app>', 'jonrgann@gmail.com', `Title Report | Ref # ${orderInfo.orderNumber} | ${orderInfo.propertyAddress}`, emailHTML);

}

// Helper function that converts PropertySync data to Document Type
function convertToDocuments(data: any[]): Document[]{
	// Remove Documents with a type of ORDERS
	const docs = data.filter((obj) => obj.json.instrumentType != 'ORDER')
	return docs.map((obj) => {
		return {
			documentId: obj.id,
			image: obj.image.s3Path,
			filedDate: obj.json.filedDate,
			documentNumber: obj.json.instrumentNumber ?? '',
			documentType: obj.json.instrumentType,
			bookNumber: obj.json.bookNumber,
			pageNumber: obj.json.pageNumber,
			grantors: obj.json.grantors.map(formatFullName),
			grantees: obj.json.grantees.map(formatFullName),
			amount: obj.json.consideration
		}
	})
}
