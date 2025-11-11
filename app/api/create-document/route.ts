import { google } from '@ai-sdk/google';
import { generateText, Output} from 'ai';
import z from 'zod';

export async function POST(req: Request) {
  const { text, instructions } = await req.json();

  if(!text) Response.json({text: 'Not enough information provided.'})

  const generateDocument = await generateText({
    model: google('gemini-2.5-flash'),
    system: `You are an experienced real estate attorney with expertise in drafting precise, legally sound documents for property transactions.  
    Your task is to draft an ACCESS EASMENT AGREEMENT document from the information provided in the users request.
    - Grantor and Grantee names should include marrital status if provided.` 
    + (instructions ?? ''),
    prompt:`input: ${text}`,
    output: Output.object({
      schema: z.object({
        grantor: z.string(),
        grantee: z.string(),
        burdened_tract_legal_description: z.string().describe("The legal description of the burndened tract."),
        benifitted_tract_legal_description: z.string().describe("The legal description of the burndened tract."),
        easement_legal_description: z.string().describe("The legal description of the easement tract.")
      }),
    }),
  })

  const output = JSON.parse(generateDocument.text)
    
  return Response.json({ output});

}

