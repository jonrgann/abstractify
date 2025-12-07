import { createUIMessageStreamResponse } from 'ai';
import { start } from 'workflow/api';
import { simpleStreamingWorkflow, weatherAgentWorkflow } from '@/workflows/simple';
export async function POST(request: Request) {
  const { messages } = await request.json();

  const run = await start(weatherAgentWorkflow, [messages]);
  return createUIMessageStreamResponse({
    stream: run.readable,
  });
}