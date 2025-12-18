import { createUIMessageStreamResponse } from 'ai';
import { start } from 'workflow/api';
import { generateReport } from '@/workflows/report';
import { NextResponse } from "next/server";
import { Resend } from 'resend';


export async function POST(request: Request) {
  const event = await request.json();

  const url = "https://lbndwiqgqqpzjwkhbdip.supabase.co/storage/v1/object/public/uploads/order-sheet-25-3057.pdf"
  const emailAddress = "jonrgann@gmail.com"
  await start(generateReport, [url, emailAddress]);


  return NextResponse.json({});
}