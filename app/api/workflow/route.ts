import { createUIMessageStreamResponse } from 'ai';
import { start } from 'workflow/api';
import { generateReport } from '@/workflows/report';
import { NextResponse } from "next/server";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {

  const event = await request.json();

  if (event.type === 'email.received') {
    const response = await resend.emails.receiving.attachments.list({ 
      emailId: event.data.email_id 
    });
    
    if(response.data && response.data.data){
      const attachment = response.data.data[0];
      const url = attachment.download_url
      const run = await start(generateReport, [url]);
    }
}
  return NextResponse.json({});
}