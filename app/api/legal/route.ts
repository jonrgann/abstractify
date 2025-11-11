import { google } from '@ai-sdk/google';
import { generateText,} from 'ai';

export async function POST(req: Request) {
  const { text, instructions } = await req.json();

  const exampleInput = `
  Customer needs: Access Easement Agreement
  Grantor:  Brian Blackman, a married person
  Grantee:  Keith Blackman, a married person
  Easement purpose:  Ingress and egress across the easement tract
  Burdened Tract:  Lot 2, Block 1, Brookland Estates, Craighead County, Arkansas
  Benefitted Tract:  Lot 1, Block 1, Brookland Estates, Craighead County, Arkansas
  Easement Tract:  The West Twenty (20) Feet of Lot 2, Block 1, Brookland Estates, Craighead County, Arkansas`

  const exampleOutput = `**ACCESS EASEMENT AGREEMENT**

  **KNOW ALL MEN BY THESE PRESENTS:**

  THAT Brian Blackman and Jane Blackman, his wife, hereinafter collectively referred to as “Grantor,” for and in consideration of the sum of Ten Dollars ($10.00) and other good and valuable consideration to them in hand paid by Keith Blackman, a married person, hereinafter referred to as “Grantee,” the receipt and sufficiency of which is hereby acknowledged, does hereby grant, bargain and sell unto the said Grantee, and unto his successors and assigns, an easement for the purpose of ingress and egress, over, under, and across the hereinafter described land in Craighead County, Arkansas, to-wit:

  **BURDENED TRACT DESCRIPTION (Servient Estate):**
  The property owned by Grantor and over which the easement is granted is legally described as:
  Lot 2, Block 1, Brookland Estates, Craighead County, Arkansas.

  SUBJECT to all easements, rights-of-way, protective covenants and mineral reservations of record, if any.

  **BENEFITTED TRACT DESCRIPTION (Dominant Estate):**
  The property owned by Grantee and benefitted by this easement is legally described as:
  Lot 1, Block 1, Brookland Estates, Craighead County, Arkansas.

  **EASEMENT TRACT DESCRIPTION:**
  The specific portion of the Burdened Tract over which this Access Easement is granted for ingress and egress is legally described as:
  The West Twenty (20) Feet of Lot 2, Block 1, Brookland Estates, Craighead County, Arkansas.

  TOGETHER WITH the right of ingress and egress across the Easement Tract for the purpose of providing access to and from the Benefitted Tract, including the right to construct, maintain, repair, replace, and improve a private driveway or road within the Easement Tract, and to perform all other acts reasonably necessary for the full enjoyment of the rights herein granted.

  **TO HAVE AND TO HOLD** the above described easement and rights unto said Grantee, his successors and assigns, forever.

  And Grantor agrees to warrant and forever defend all and singular the above described easement and rights unto said Grantee, his successors and assigns, against every person whomsoever lawfully claiming or seeking to claim the same or any part thereof.

  This Easement is declared to and does inure to the benefit of the Benefitted Tract and shall be binding upon the successors in title to the lands herein described or any other part thereof, their mortgagees, lessees, heirs, administrators, executors, successors, and assigns.`

  const generateDocument = await generateText({
    model: google('gemini-2.5-flash'),
    system: `You are an experienced real estate attorney with expertise in drafting precise, legally sound documents for property transactions.  
    Your task is to draft a document for the users request using the examples provided.` 
    + (instructions ?? ''),
    prompt:`
    input: ${exampleInput}
    output: ${exampleOutput}
    input: ${text}`
  })
    
  return Response.json({text: generateDocument.text});

  }