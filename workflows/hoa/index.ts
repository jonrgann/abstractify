import { FatalError, RetryableError } from 'workflow'; 
import { sendEmail } from "../steps/send-email";
import { searchPropertySync } from "../steps/search";
import { getDocumentDetails } from '../steps/get-document-details';
import { retrieveDocumentIds } from '../steps/retrieve-document-ids';
import { formatFullName, } from "@/lib/research/utils";
import { Document } from "@/lib/research/utils";
import { generatePDF } from '../steps/generate-pdf';

export async function generateHOALetter(email:string,) {
	"use workflow";

	const { token } = await getPropertySyncBearerToken();

	let documentGroupId = "fa04f162-40ab-44cc-bbed-e8a40c613182";

	const subdivision = "CARRINGTON PLACE (EBR)";

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
	const filteredDocuments = documents.filter((doc => doc.documentType != "HOA CONTACT"))

	const report = {
		propertyName: hoaContactDoc?.subdivisionLegal[0].addition,
		hoaName: hoaContactDoc?.grantors[0],
		dues: hoaContactDoc?.grantees[0],
		managementCompany: hoaContactDoc?.grantees[0],
		address: `${hoaContactDoc?.address[0].address1} ${hoaContactDoc?.address[0].city} ${hoaContactDoc?.address[0].state } ${hoaContactDoc?.address[0].zipCode}`,
		phoneNumber: [hoaContactDoc?.parcelLegal[0].parcel],
		emailAddress: hoaContactDoc?.comment,
		documents: filteredDocuments.map((document) => { return { name: document.comment, url: document.image }})
	  }

	  const reportURL = await generatePDF(report);
	  console.log(reportURL)

	
    // Step 9 Send Email
	// await sendEmail('Abstractify <agent@orders.abstractify.app>', email, 'HOA LETTER', "<h1>Hello here is your html letter.</h1>",);

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
			subdivisionLegal: obj.json.subdivisionLegal
		}
	})
}