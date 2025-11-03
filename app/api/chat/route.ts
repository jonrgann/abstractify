import { streamText, UIMessage, convertToModelMessages, UIMessageChunk } from 'ai';
import { google} from '@ai-sdk/google';
import { ToolLoopAgent } from 'ai';
import { createAgentUIStreamResponse, Output, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { z } from 'zod';
import { MyUIMessage } from '@/lib/types';


// Helper function for workflow steps
async function executeWorkflowStep<T>({
  writer,
  stepId,
  stepName,
  execute,
  onPartial,
}: {
  writer: any;
  stepId: string;
  stepName: string;
  execute: () => AsyncIterable<T> | Promise<AsyncIterable<T>>;
  onPartial?: (partial: T) => any;
}) {
  // Write pending status
  writer.write({
    type: `data-${stepId}`,
    id: stepId,
    data: { 
      status: 'pending', 
      message: stepName, 
      output: null 
    },
  });

  try {
    // Execute the step
    const stream = await execute();

    let lastPartial: T | null = null;

    // Process stream
    for await (const partial of stream) {
      lastPartial = partial;
      writer.write({
        type: `data-${stepId}`,
        id: stepId,
        data: { 
          status: 'streaming', 
          message: stepName, 
          output: onPartial ? onPartial(partial) : partial 
        },
      });
    }

    // Write complete status
    writer.write({
      type: `data-${stepId}`,
      id: stepId,
      data: { 
        status: 'complete', 
        message: 'Done', 
        output: onPartial && lastPartial ? onPartial(lastPartial) : lastPartial 
      },
    });

    return lastPartial;
  } catch (error) {
    // Write error status
    writer.write({
      type: `data-${stepId}`,
      id: stepId,
      data: { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'An error occurred', 
        output: null 
      },
    });
    throw error;
  }
}


// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export const researchAgent = new ToolLoopAgent({
  model: google('gemini-2.5-flash'),
  instructions: 'You are a helpful title research agent in the real estate industry.',
});

export const orderEntryAgent = new ToolLoopAgent({
  model: google('gemini-2.5-flash'),
  instructions: 'You are an order entry assistant for a real estate title research company.  Your task is to review an order for the property information and extract the order number, property address and legal description.',
  output: Output.object({
    schema: z.object({
      orderNumber: z.string(),
      propertyAddress: z.string(),
      legalDescription: z.string(),
    }),
  }),
});

export async function POST(req: Request) {
  const { 
    messages, 
  }: { 
    messages: MyUIMessage[]; 
  } = await req.json();

  const existingMessages: MyUIMessage[] = messages;

  const stream = createUIMessageStream({
    async execute({ writer }) {


    // Step 1: Read the order PDF
    const orderInfo = await executeWorkflowStep({
      writer,
      stepId: 'workflowStep1',
      stepName: 'Reading order PDF',
      execute: async () => {
        const result = await orderEntryAgent.stream({
          messages: convertToModelMessages(messages)
        });
        return result.partialOutputStream;
      },
    });

    },
    onError: error => `Custom error:`,
    originalMessages: existingMessages,
    onFinish: ({ messages, isContinuation, responseMessage }) => {
      console.log('Stream finished with messages:', JSON.stringify(messages, null, 2));
    },
  });

  return createUIMessageStreamResponse({ 
    stream,
});

}