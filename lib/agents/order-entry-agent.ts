import { google } from '@ai-sdk/google';
import { UIMessageStreamWriter, UIMessage, streamObject, FilePart} from 'ai';
import z from 'zod';

export const orderEntryAgent = async (filePart: FilePart, writer: UIMessageStreamWriter<UIMessage>) => {

  try{

    writer.write({
      type: 'data-workflowReadOrder', // type-checked against MyUIMessage
      id: 'workflowReadOrder',
      data: { status: 'active' },
    });

    const result = streamObject({
      model: google('gemini-2.5-flash'),
      system: `You are an expert title research assistant.  
      Your task is review a document and extract the title order information so that it can be imported into the title plant system.
      - Extract the order number, seller names, buyer (borrower) names, and legal descriptions.`,
      schema: z.object({
        orderNumber: z.string(),
        sellers: z.string().array(),
        borrowers: z.string().array(),
        propertyAddress: z.string(),
        legalDescription: z.string(),
        county: z.string(),
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: "<order>"
            },
            filePart,
            {
              type: 'text',
              text: "</order>"
            }
          ]
        }
      ],
      onFinish({ usage, object }) {
        writer.write({
          type: 'data-workflowReadOrder',
          id: 'workflowReadOrder',
          data: { 
            output: object,
            status: 'complete',
            usage: usage
          }, 
        });
      },
    });

    // note: the stream needs to be consumed because of backpressure

    for await (const partialObject of result.partialObjectStream) {
      writer.write({
        type: 'data-workflowReadOrder',
        id: 'workflowReadOrder',
        data: { 
          output: partialObject,
          status: 'active'
        }, 
      });
    }

  return (await result.object);

  }catch(error){
    throw error
  }
}