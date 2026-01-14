import { start } from 'workflow/api';
import { generateHOALetter } from '@/workflows/hoa';
import { NextResponse } from "next/server";

export async function POST(request: Request) {

    const emailAddress = "jonrgann@gmail.com";
    const text= `Can I get the HOA info for CHARLESTON OAKS?
    

Patrick W. Curry

President

Allegiance Title Company

1450 E. Zion Rd. Ste. 7, Fayetteville, AR 72703

Direct 479.342.3130 | Cell 479.236.5564 | Main 479.342.3131

Email pcurry@alltitle.com | New Orders orders@alltitle.com

Website www.alltitle.com

WIRING INSTRUCTIONS NOTICE

Don’t get spoofed! Allegiance Title’s Wiring Instructions will not be sent as a PDF attachment. You will receive an email from no-reply@closinglock.com with instructions to login to a portal.

Call your closing team 479-342-3131 to verbally verify wiring instructions before wiring funds.
    `
    await start(generateHOALetter, [emailAddress, text]);
    return NextResponse.json({});
    
}