import { DurableAgent } from '@workflow/ai/agent';
import { getWritable } from 'workflow';
import { z } from 'zod';
import { convertToModelMessages, type UIMessage, type UIMessageChunk } from 'ai';

export async function simpleStreamingWorkflow() {
    "use workflow";
  
    // Get the workflow's writable stream
    const writable = getWritable<UIMessageChunk>();
  
    // And send it into a step
    await writeStream(writable, 'Hello, world!');
  }
  
  async function writeStream(writable: WritableStream, message: string) {
    "use step";
  
    // Steps can write to the stream
    const writer = writable.getWriter();
    await writer.write({ 
        type: 'data-workflowStatus', 
        id:'workflowStatus',
        data: { message }, 
        // transient: true, 
    })
    writer.close();
  };

  async function getWeather({ location }: { location: string }) {
    "use step";
    // Fetch weather data
    const response = await fetch(`https://api.weather.com?location=${location}`);
    return response.json();
  }

  export async function weatherAgentWorkflow(messages: UIMessage[]) {
    'use workflow';

    const writable = getWritable<UIMessageChunk>();

    const agent = new DurableAgent({
      model: 'google/gemini-2.5-flash',
      tools: {
        getWeather: {
          description: 'Get current weather for a location',
          inputSchema: z.object({ location: z.string() }),
          async *execute({ location }, messages) {
            await getWeather(location);
          }
        },
      },
      system: 'You are a helpful weather assistant. Always provide accurate weather information.',
      
    });
    await agent.stream({
      messages: convertToModelMessages(messages),
      writable,
    });
  }