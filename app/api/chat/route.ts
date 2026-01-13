import { UIMessage, createAgentUIStreamResponse, createUIMessageStreamResponse} from 'ai';
import { researchAgent, ResearchAgentUIMessage } from '@/lib/agents/researchAgent';
import { start } from "workflow/api";
import { chat } from '@/workflows/chat';

// Allow streaming responses up to 30 seconds
// export const maxDuration = 30;

export async function POST(req: Request) {
  const { county, messages }: { county: string, messages: ResearchAgentUIMessage[] } = await req.json();


  let PROPERTY_SYNC_USER = process.env.PROPERTYSYNC_USERNAME;
  let PROPERTY_SYNC_PASS = process.env.PROPERTYSYNC_PASSWORD;
  const DOCUMENT_GROUP_ID = county
  
  if(DOCUMENT_GROUP_ID === 'fa04f162-40ab-44cc-bbed-e8a40c613182'){
    PROPERTY_SYNC_USER = process.env.DEMO_PROPERTYSYNC_USERNAME
    PROPERTY_SYNC_PASS = process.env.DEMO_PROPERTYSYNC_PASSWORD;
  }

  const loginResponse = await fetch(
    `https://api.propertysync.com/v1/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: PROPERTY_SYNC_USER,
        password: PROPERTY_SYNC_PASS
      })
    }
  );

  const { token } = await loginResponse.json();
  
  return createAgentUIStreamResponse({
    agent: researchAgent,
    messages,
    options: {
      countyId: county,
      token
    },
    messageMetadata: ({ part }) => {
        // Send metadata when streaming starts
        if (part.type === 'start') {
          return {
            createdAt: Date.now(),
            county: county
          };
        }
  
        // Send additional metadata when streaming completes
        if (part.type === 'finish') {
          return {
            totalTokens: part.totalUsage.totalTokens,
          };
        }
    },
    onFinish: ({ messages }) => {
      console.log('Stream finished with messages:',JSON.stringify(messages,null, 2));
    },
  });

}

// export async function POST(req: Request) {
// 	const { messages }: { messages: ResearchAgentUIMessage[] } = await req.json();

// 	const run = await start(chat, [messages]);
// 	const workflowStream = run.readable;

// 	return createUIMessageStreamResponse({
// 		stream: workflowStream,
// 		headers: {
// 			// The workflow run ID is stored into `localStorage` on the client side,
// 			// which influences the `resume` flag in the `useChat` hook.
// 			"x-workflow-run-id": run.runId,
// 		},
// 	});
// }