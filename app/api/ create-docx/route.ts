// app/api/generate-hoa/route.ts (App Router)
import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer } from 'docx';
import { generateHOADocument } from '@/components/generateHOADocument';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Generate document buffer

    const buffer = await generateHOADocument(data, 'hoa.docx');
    
    // Convert Buffer to Uint8Array
    const uint8Array = new Uint8Array(buffer);
    
    // Return as downloadable file
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="hoa-document.docx"`,
      },
    });
  } catch (error) {
    console.error('Error generating document:', error);
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}