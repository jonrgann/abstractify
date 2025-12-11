import {generateText, Output} from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export async function generateSearchQueries(input: string) {
    "use step"

    const response = await generateText({
        model: google('gemini-2.5-flash-lite'),
        system: `You are an expert title research assistant.  
        Your task is to use the review order information and use the searchPropertyTool to search the property within the title plant software. 
        - Use null for values not present on the order.
        - Use the addition field for both subdivisions and additions.`,
        experimental_output: Output.object({
          schema: z.object({
            queries: z.object({
              lot: z.string().nullable(),
              block: z.string().nullable(),
              addition: z.string()
            }).array()
          })
        }),
        messages: [
            {
              role: 'user',
              content: `<order-info>${JSON.stringify(input)}</orderInfo>`
            }
          ]
      });
  
      return response.output;
};