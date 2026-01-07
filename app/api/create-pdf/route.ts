import { NextRequest, NextResponse } from 'next/server';
import { generateTitleReportPDF } from '@/components/generateTitleReportPDF';
import { generateHOAReportPDF } from '@/components/generateHOALetter';

export async function POST(request: NextRequest) {
  try {

    const { data } = await request.json();

    let pdfBlob;
    if(data.hoaName){
      pdfBlob = await generateHOAReportPDF(data);
    }else{
      pdfBlob = await generateTitleReportPDF(data);
    }
    
    // Convert blob to array buffer
    const arrayBuffer = await pdfBlob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="title-report.pdf"',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}