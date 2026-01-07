import { start } from 'workflow/api';
import { generateHOALetter } from '@/workflows/hoa';
import { NextResponse } from "next/server";

export async function POST(request: Request) {

    const emailAddress = "jonrgann@gmail.com"
    await start(generateHOALetter, [emailAddress]);
    return NextResponse.json({});
    
}