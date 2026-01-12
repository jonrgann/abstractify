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

export const generateHOALetter = async (
    email: string,
    text:string
  ) => {
	"use workflow";

	const { token } = await getPropertySyncBearerToken();

	let documentGroupId = "fa04f162-40ab-44cc-bbed-e8a40c613182";

	// Step
	const subdivisionList = await getSubdivisions(documentGroupId, token);

	// Step
	const subdivision = await selectFromList(text, subdivisionList.map((obj: any) => obj.value));

	// Step
	const searchResponse = await searchPropertySync(documentGroupId,token, {
        queryParams: {
          excludeOrders: 1,
          excludeRelatedDocuments: 1,
          subdivisions: [{ addition: subdivision}],
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
                                Attached are the restrictions and HOA information we have for ${data.propertyName} - if you have any questions or need further information please don't hesitate to reach out!
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
                            <a href="${data.reportURL}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; color-scheme: light">Download Report</a>
                        </td>
                    </tr>
                    
                    <!-- Footer Disclaimer -->
                    <tr>
                        <td style="padding-top: 32px; border-top: 1px solid #e5e5e5;">
                            <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                                This title report is provided for informational purposes only and does not constitute legal advice. The information is based on public records available at the time of search. This report should be reviewed by a qualified attorney before making any real estate decisions.
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