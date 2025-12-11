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
import { generateTitleReportEmail } from "./templates/title-report-email";

export async function generateReport(query: string) {
	"use workflow";

	//Send Email:
	const url = 'https://lbndwiqgqqpzjwkhbdip.supabase.co/storage/v1/object/public/uploads/order-sheet-25-3057.pdf'
	const documentGroupId = "54766f37-bfad-4922-a607-30963a9c4a60"
    const companyId = "da87ef4e-60a9-4a38-b743-c53c20ed4f18"

	// Step 0: Get Bearer Token from PropertySync
	const { token } = await getPropertySyncBearerToken();

	const subdivisions = await getSubdivisions(documentGroupId, token);

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

	// Step 5: Retrieve Results
	const propertyResults = await retrieveResults(documentGroupId,token, searchResponse.id);

	const documents = propertyResults.map((result:any) => {
		return{
			documentType: result.documentType,
			bookNumber: result.bookNumber,
			pageNumber: result.pageNumber,
			grantors: result.bestGrantor,
			gratnees: result.bestGrantee
		}
	})


	const emailHTML = await generateTitleReportEmail({propertyAddress: orderInfo.propertyAddress, legalDescription: orderInfo.legalDescription})

	await sendEmail('Abstractify <agent@orders.abstractify.app>', 'jonrgann@gmail.com', 'Title Report', emailHTML);

}
