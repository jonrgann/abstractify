import { ToolLoopAgent, UIMessage, createAgentUIStreamResponse, stepCountIs, tool, rerank} from 'ai';
import { google } from '@ai-sdk/google';
import { cohere } from '@ai-sdk/cohere';
import { researchAgent, ResearchAgentUIMessage } from '@/lib/agents/researchAgent';
import { z } from 'zod';
// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { county, messages }: { county: string, messages: ResearchAgentUIMessage[] } = await req.json();

  const plan = [];
  const executedTasks = [];

  const createPlan = tool({
    description: "Create a plan for a given task.",
    inputSchema: z.object({
        tasks: z.array(z.string())
    }),
    execute: async ( { tasks }) => {
        plan.push(...tasks)
        return `Successfully created plan`
    }
  })

  const executeTask = tool({
    description: "Execute a task",
    inputSchema: z.object({}),
    execute: async ( { importantContext }, { messages }) => {
        return `Successfully executed task.`
    }
  })

  const selectTool = tool({
    description: "Select the best match for a given query.",
    inputSchema: z.object({
        query: z.string()
    }),
    execute: async ( { query },{ experimental_context: context }) => {

        const documents = [
            'MORTGAGE',
            'RELEASE',
            'DEED', 
          ];
          
          const { ranking, rerankedDocuments } = await rerank({
            model: cohere.reranking('rerank-v3.5'),    
            documents,
            query: query,
            topN: 5, // Return top 2 most relevant documents
          })

        return ranking
    }
  })

  const planningAgent = new ToolLoopAgent({
    model: google('gemini-2.5-flash'),
    instructions: 'You are a helpful assistant. Select the best match for a users query.',
    tools: { selectTool },
    toolChoice: 'required',
    stopWhen: stepCountIs(2),
    // prepareStep: async () => {
    //     if(plan.length > 0){
    //         return{
    //             activeTools: ["executeTask"],
    //             system: "Current todo list state:\n\n",
    //             toolChoice: { toolName: "executeTask", type: "tool"}
    //         }
    //     }
    // },
  });

  return createAgentUIStreamResponse({
    agent: planningAgent,
    messages,
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

