import { sendEmail } from "../steps/send-email";
export async function generateHOALetter(email:string,) {
	"use workflow";

    	// Step 9 Send Email
	await sendEmail('Abstractify <agent@orders.abstractify.app>', email, 'HOA LETTER', "<h1>Hello here is your html letter.</h1>",);
}