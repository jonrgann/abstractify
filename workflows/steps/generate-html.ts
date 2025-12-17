import {generateText, Output} from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export async function generateHTML(data: string) {
    "use step"

    const response = await generateText({
        model: google('gemini-2.5-flash'),
        system: `You are an expert HTML email developer specializing in creating professional, responsive email templates for real estate and title industry communications.`,
        output: Output.object({schema: z.object({
          html: z.string().optional(),
        })}),
        prompt:`Generate a complete, production-ready HTML email template that presents title report information in a clear, professional, and visually appealing format. Here the the title report data to display:
        ${data}
        `
      });
  
      return response.output;
};