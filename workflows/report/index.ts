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
	const mortgages = documents.filter((doc) => ['MORTGAGE','ASSIGMENT OF MORTGAGE', 'MODIFICATION'].includes(doc.documentType.toUpperCase()));
	const exceptions = documents.filter((doc) => ['PLAT','PROTECTIVE COVENANTS',"RESTRICTIONS", "ORDINANCE", "BILL OF ASSURANCES","NOTICE","SURVEY"].includes(doc.documentType.toUpperCase()));
	const judgments = documents.filter((doc) => ['JUDGMENT','FEDERAL TAX LIEN','STATE TAX LIEN','CERT OF INDEBTEDNESS','BANKRUPTCY'].includes(doc.documentType.toUpperCase()));

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

	// Create openJudgments by filtering out released mortgages
	const openJudgments = judgments.filter((mortgage) => 
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
	  judgments: openJudgments
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

/*

# Title Report

## Purpose and Scope
This document outlines the examination procedures and requirements for a Title Report. The report identifies current ownership, recent title transfers, encumbrances, and exceptions that may affect the insurability of the property.

---

## Report Components

### 1. Ownership Information

**Name**
- Extract the exact legal names of current owners from the latest bonafide deed
- Include complete vesting information exactly as written in the deed
- Capture marital status designations (e.g., "a married man," "a single woman," "husband and wife")
- Note ownership percentages or type of ownership (e.g., joint tenants, tenants in common, tenants by the entirety)
- Include any special designations (e.g., trustee, personal representative, life tenant)
- Record full legal names without abbreviation

**Date Acquired**
- The recording date of the bonafide deed conveying the property to current owners

**Recording Number**
- The document number/book and page where the individuals acquired the property

**Note:** A "bonafide deed" excludes quitclaim deeds and includes only instruments that actually convey title with warranties or consideration.

---

### 2. 24 Month Chain of Title

**Scope**
- Show all deeds recorded within the last 24 months that transfer title to the property
- For each deed, include:
  - Grantor name(s)
  - Grantee name(s)
  - Recording date
  - Recording number
  - Type of deed

**If No Deeds Within 24 Months**
- Use the last bonafide deed on record and note the recording date

**Exclusions**
- Quitclaim deeds are excluded from this section

---

### 3. Open Mortgages, Assignments, and Modifications

**Definition**
- All mortgages, deeds of trust, or security instruments found in the record where there is no corresponding release, satisfaction, or reconveyance

**Include**
- Original mortgages without releases
- Assignments of mortgage (track to current holder)
- Modifications to existing mortgages

---

### 4. Active Judgments, Tax Liens, and Certificates of Indebtedness

**Scope**
- Judgments without documents releasing or satisfying them
- Tax liens (federal, state, or local) without releases
- Certificates of Indebtedness (COIs) without satisfaction

---

### 5. Exceptions

**Documents to Include**
All recorded documents affecting the property in the following categories:
- PLAT (subdivision plats, replats)
- PROTECTIVE COVENANTS
- RESTRICTIONS (deed restrictions, building restrictions)
- ORDINANCE (zoning ordinances, municipal orders)
- BILL OF ASSURANCES
- NOTICE (notices of violation, lis pendens)
- SURVEY (recorded surveys showing encroachments or easements)

**Reporting**
- List each exception with recording information
- Note any documents that may affect use, enjoyment, or marketability of the property

---

## Examination Notes
[Space for examiner's additional observations, concerns, or recommendations]

---

*This examination logic is designed to provide comprehensive title information necessary for underwriting title insurance policies.*

*/