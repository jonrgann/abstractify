import { start } from 'workflow/api';
import { generateHOALetter } from '@/workflows/hoa';
import { NextResponse } from "next/server";

export async function POST(request: Request) {

    const emailAddress = "jonrgann@gmail.com";
    const text= "Can I get the HOA info for CARRINGTON PLACE?"
    await start(generateHOALetter, [emailAddress, text]);
    return NextResponse.json({});
    
}