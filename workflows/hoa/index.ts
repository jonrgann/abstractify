import { FatalError, RetryableError } from 'workflow'; 
import { sendEmail } from "../steps/send-email";
import { searchPropertySync } from "../steps/search";
import { getDocumentDetails } from '../steps/get-document-details';
import { retrieveDocumentIds } from '../steps/retrieve-document-ids';
import { formatFullName, } from "@/lib/research/utils";
import { Document } from "@/lib/research/utils";
import { generatePDF } from '../steps/generate-pdf';
import { generateDocX } from '../steps/generate-docx';
import { sampleHOAData } from '@/components/generateHOADocument';
import { selectFromList } from '../steps/rerank';
import { getSubdivisions } from '../steps/get-subdivisions';
import { generateTextStep } from '../steps/generate-text';

export const generateHOALetter = async (
    email: string,
    text:string
  ) => {
	"use workflow";

	const { token } = await getPropertySyncBearerToken();

	let documentGroupId = "fa04f162-40ab-44cc-bbed-e8a40c613182";

    const query = await generateTextStep(`AI Agent Prompt: HOA Email Parser
You are an AI agent that processes emails sent to an automated email address requesting HOA (Homeowner Association) information about specific subdivisions.
Your primary task:
Extract the subdivision name from the user's query in the email.
Instructions:

Read the incoming email content
Identify the subdivision name being requested
Handle various phrasings such as:

"Can I get the HOA information for [Subdivision Name]?"
"What's the HOA info for [Subdivision Name]?"
"I need homeowner association information for [Subdivision Name]"
Variations with abbreviations, informal language, or different word orders


Return ONLY the subdivision name as plain text (no additional formatting, labels, or explanation)

If you cannot identify a clear subdivision query:
Return the following standard message:
"Unable to identify subdivision name from request. This email has been flagged for manual review."
Examples:

Input: "Can I get the HOA information for Canterberry Place?"
Output: Canterberry Place
Input: "What are the rules for Oak Hills subdivision?"
Output: Oak Hills
Input: "Hello, I need some information please"
Output: MISSING SUBDIVISION.`, `<email>${text}</email>`)

    console.log(`query: ${query}`);

    // End Workflow if similarity score is too low.
    if(query === 'MISSING SUBDIVISION') return;
	// Step
	const subdivisionsResponse = await getSubdivisions(documentGroupId, token);
    const subdivisions = subdivisionsResponse.map((obj: any) => obj.value);

	// Step
	const subdivision = await selectFromList(query, subdivisions);

    // End Workflow if similarity score is too low.
    if(subdivision.score < 0.1) return;

	// Step
	const searchResponse = await searchPropertySync(documentGroupId,token, {
        queryParams: {
          excludeOrders: 1,
          excludeRelatedDocuments: 1,
          subdivisions: [{ addition: subdivision.document}],
        } 
    })

	// Step
	const documentIds = await retrieveDocumentIds(documentGroupId,token, searchResponse.id);

	// Step
	const documentResults = await Promise.all(
		documentIds.map((id: string) => getDocumentDetails(documentGroupId, token, id))
	);

	const documents = convertToDocuments(documentResults);

	// Filter by instrumentType = "HOA CONTACT" and get the first one
	const hoaContactDoc = documents.find(doc => doc.documentType === "HOA CONTACT");
	const filteredDocuments = documents.filter((doc => doc.documentType != "HOA CONTACT"));
	const plats = sortDocumentsByFiledDate(filteredDocuments.filter((doc => doc.documentType === "PLAT")), 'asc');
	const restrictions = sortDocumentsByFiledDate(filteredDocuments.filter((doc => doc.documentType === "RESTRICTIONS")), 'asc');
	const sortedDocuments = [...plats,...restrictions]

	const report = {
		propertyName: hoaContactDoc?.subdivisionLegal[0].addition,
		hoaName: hoaContactDoc?.grantors[0],
		dues: hoaContactDoc?.caseNumber ?? 'NO INFORMATION',
		managementCompany: hoaContactDoc?.grantees[0],
		address: `${hoaContactDoc?.address[0].address1 || ''} ${hoaContactDoc?.address[0].city || ''} ${hoaContactDoc?.address[0].state || ''} ${hoaContactDoc?.address[0].zipCode || ''}`.trim(),
		phoneNumber: [hoaContactDoc?.parcelLegal[0].parcel],
		emailAddress: hoaContactDoc?.comment,
		documents: sortedDocuments.map((document) => { return { name: document.comment, url: document.image }})
	  }

      console.dir(report);

	  const reportURL = await generatePDF(report,'HOA');
	  console.log(reportURL);
	  const emailHTML = await generateHOAEmail({...report, reportURL})
	// const reportURL = await generateDocX(report);
	// console.log(reportURL)

	
    //Step 9 Send Email

	// const tempEmail = 'jonrgann@gmail.com'

	await sendEmail('Abstractify <hoa@orders.abstractify.app>', email, `${report.propertyName} HOA Documents and Restrictions`, emailHTML,);

}

async function getPropertySyncBearerToken() {
    "use step"

    const response = await fetch(
        `https://api.propertysync.com/v1/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body:JSON.stringify({
            email: 'jon.r.gann@gmail.com',
            password: '@Test2025!'
          })
        }
      );

    if (response.status >= 500) {
        // Uncaught exceptions are retried by default
        throw new Error("Server error");
    }
    
    if (response.status === 404) {
    // Explicitly throw a FatalError to skip retrying
    throw new FatalError("Resource not found. Skipping retries.");
    }
    
    if (response.status === 429) {
    // Customize retry delay - accepts duration strings, milliseconds, or Date instances
    throw new RetryableError("Too many requests. Retrying...", {
        retryAfter: "10s"
    });
    }
    
    return response.json();
};

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
			related: obj.relatedDocuments,
			comment: obj.json.comment,
			address: obj.json.address,
			parcelLegal: obj.json.parcelLegal,
			subdivisionLegal: obj.json.subdivisionLegal,
			caseNumber: obj.json.caseNumber
		}
	})
}

export function sortDocumentsByFiledDate(
	documents: Document[],
	order: 'asc' | 'desc' = 'desc'
  ): Document[] {
	return [...documents].sort((a, b) => {
	  if (order === 'asc') {
		return a.filedDate.localeCompare(b.filedDate);
	  } else {
		return b.filedDate.localeCompare(a.filedDate);
	  }
	});
  }

async function generateHOAEmail(data: any) {

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HOA Documents and Restrictions</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 60px 20px;">
                <table width="540" cellpadding="0" cellspacing="0" border="0">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding-bottom: 20px;">
                            <h1 style="margin: 0; color: #000000; font-size: 24px; font-weight: 600;">HOA Documents and Restrictions</h1>
                        </td>
                    </tr>
                    
                    <!-- Introduction -->
                    <tr>
                        <td style="padding-bottom: 32px;">
                            <p style="margin: 0; color: #666666; font-size: 15px; line-height: 1.6;">
                                Below are the restrictions and HOA information we have for ${data.propertyName} - if you have any questions or need further information please don't hesitate to reach out!
                            </p>
                        </td>
                    </tr>
                       
                    <!-- Divider -->
                    <tr>
                        <td style="padding-bottom: 32px;">
                            <div style="height: 1px; background-color: #e5e5e5;"></div>
                        </td>
                    </tr>
                                        
                    <!-- Download Button -->
                    <tr>
                        <td style="padding-bottom: 32px;">
                            <a href="${data.reportURL}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; color-scheme: light">Download PDF</a>
                        </td>
                    </tr>
                    
                    <!-- Footer Disclaimer -->
                    <tr>
                        <td style="padding-top: 32px; border-top: 1px solid #e5e5e5;">
                            <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                                 This attached Homeowner's Association (HOA) informational packet is provided as a courtesy and convenience. This packet is for
informational purposes only and may not be complete. Any additional information which is included is not warranted in any fashion
and is provided for convenience and informational purposes only. This packet is not and shall not be considered to be a legal opinion,
survey, title opinion letter, a title examination report, title guarantee, a title commitment, a title binder, or a policy of title insurance.
The covenants, conditions and/or restrictions are sourced directly from the public records of the Clerk and Recorder in and for the
parish where the property is located. These documents may contain unlawful and unenforceable provisions under current state and/or
federal law including the Fair Housing Act and the ADA and therefore it is not for the parish and its affiliates to determine their
legality. Documents are the property of the Texas and/or applicable Title & Abstract Co., and are merely reproduced public records.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`

}