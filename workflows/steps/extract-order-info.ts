import {generateText, Output} from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
export async function extractOrderInfo(url: string) {
    "use step"

    const response = await generateText({
        model: google('gemini-2.5-flash'),
        system: `You are an expert title research assistant.  
        Your task is review a document and extract the title order information so that it can be imported into the title plant system.
        - Extract the order number, seller names, buyer (borrower) names, and legal descriptions.`,
        output: Output.object({schema: z.object({
          orderNumber: z.string().optional(),
          sellers: z.string().array().optional(),
          borrowers: z.string().array().optional(),
          propertyAddress: z.string().optional(),
          legalDescription: z.string().optional(),
          county: z.string(),
        })}),
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: "<order>"
              },
              {
                type: 'image',
                image: url
              },
              {
                type: 'text',
                text: "</order>"
              }
            ]
          }
        ],
      });
  
      return response.output;
};