import {generateText, Output} from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
export async function generateTextStep(system: string, prompt: string) {
    "use step"

    const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        system: system,
        prompt: prompt
      });
  
      return text;
};