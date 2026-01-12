import {generateText, Output} from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { rerank } from 'ai';
import { cohere } from '@ai-sdk/cohere';

export async function selectFromList(input: string, documents: any[]) {
    "use step"

    const { ranking } = await rerank({
      model: cohere.reranking('rerank-v3.5'),
      documents,
      query: input,
      topN: 2,
    });

    console.dir(ranking);
  
    return ranking[0];

};