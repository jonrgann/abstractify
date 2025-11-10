import { UIMessage, createAgentUIStreamResponse} from 'ai';
import { researchAgent, ResearchAgentUIMessage } from '@/lib/agents/researchAgent';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { county, messages }: { county: string, messages: ResearchAgentUIMessage[] } = await req.json();

  return createAgentUIStreamResponse({
    agent: researchAgent,
    messages,
  });


}