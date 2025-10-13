import { google, GoogleGenerativeAIProviderOptions} from '@ai-sdk/google';
import { generateText, Output, UIMessageStreamWriter, UIMessage} from 'ai';
import z from 'zod';

export const classificationAgent = async (url: string, types:string[], writer: UIMessageStreamWriter<UIMessage>) => {

    writer.write({
      type: 'data-classifyDocument', // type-checked against MyUIMessage
      id: 'classifyDocument',
      data: { input:{ url, types }, status: 'loading' },
    });

    const classificationAgent = await generateText({
        model: google('gemini-2.5-flash-lite'),
        system: `You are an AI classification tool tasked with classifying documents that have been recorded by the county clerk. 
        You must classify the document using one of the following exact labels:
        ${types.map(label => `- ${label}`).join('\n')}
    
        #Instructions
        - Review the list of classification labels above
        - Analyze the document. Make note of the document title and context of the document content to help classify the document.
        - You MUST select one of the exact labels from the list above.
        - Do not create new labels or modify existing ones.`,
        messages: [
          { 
            role: 'user', 
            content: [
              { type: 'text', text: "<document>" },
              { type: "image", image: url },
              { type: 'text', text: "</document>" }
            ]
          }
        ],
        experimental_output: Output.object({
          schema: z.object({
            classification: z.string()
          })
        }),
        providerOptions: {
          google: {
            thinkingConfig: {
              thinkingBudget: 2048,
              includeThoughts: true
            },
          } satisfies GoogleGenerativeAIProviderOptions,
        },
      });


    const output = JSON.parse(classificationAgent.text)

    writer.write({
      type: 'data-createOrder',
      id: 'createOrder',
      data: { 
        input: url,
        output: output,
        reasoning: '',
        text: ``,
        status: 'success' 
      }, 
    });

    writer.write({
        type: 'data-classifyDocument', // type-checked against MyUIMessage
        id: 'classifyDocument',
        data: { input:{ url, types }, output: output, reasoning: classificationAgent.reasoningText, usage: classificationAgent.usage, status: 'loading' },
      });


    return output;

}