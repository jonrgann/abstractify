import { createUIMessageStreamResponse } from 'ai';
import { start } from 'workflow/api';
import { generateReport } from '@/workflows/report';
import { generateHOALetter } from '@/workflows/hoa';
import { NextResponse } from "next/server";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {

  const event = await request.json();

  if (event.type === 'email.received') {

    const { data, error } = await resend.emails.receiving.get(
      event.data.email_id ,
    );

    const emailAddress = data?.from ?? '';
    const toEmailAddress = data?.to ?? [''];
    
    if(toEmailAddress.length && toEmailAddress[0].toLowerCase() === 'hoa@orders.abstractify.app'){

      await start(generateHOALetter, [emailAddress]);

    }else{

      const response = await resend.emails.receiving.attachments.list({ 
        emailId: event.data.email_id 
      });
      
      if(response.data && response.data.data && emailAddress){
        const attachment = response.data.data[0];
        const url = attachment.download_url
        await start(generateReport, [url, emailAddress]);
      }
    }

  }
  return NextResponse.json({});
}