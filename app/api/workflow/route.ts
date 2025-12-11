import { createUIMessageStreamResponse } from 'ai';
import { start } from 'workflow/api';
import { generateReport } from '@/workflows/report';
import { NextResponse } from "next/server";


export async function POST(request: Request) {

  const { query } = await request.json();

  const run = await start(generateReport, [query]);
  
  return NextResponse.json({
    message: "Report workflow started.",
   });
}