import { google } from '@ai-sdk/google';
import { generateText, Output} from 'ai';
import z from 'zod';

import { NextResponse } from 'next/server';

import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'

export async function POST(req: Request,) {
  const { text, instructions } = await req.json();

  if(!text) Response.json({text: 'Not enough information provided.'})

  // const generateDocument = await generateText({
  //   model: google('gemini-2.5-flash'),
  //   system: `You are an experienced real estate attorney with expertise in drafting precise, legally sound documents for property transactions.  
  //   Your task is to draft an ACCESS EASEMENT AGREEMENT document from the information provided in the users request.
  //   - Grantor and Grantee names should include maritial status if provided.` 
  //   + (instructions ?? ''),
  //   prompt:`input: ${text}`,
  //   output: Output.object({
  //     schema: z.object({
  //       grantor: z.string(),
  //       grantee: z.string(),
  //       burdened_tract_legal_description: z.string().describe("The legal description of the burndened tract."),
  //       benifited_tract_legal_description: z.string().describe("The legal description of the burndened tract."),
  //       easement_legal_description: z.string().describe("The legal description of the easement tract."),
  //       county:z.string().describe("The county name. ex: Craighead")
  //     }),
  //   }),
  // })

  // const output = generateDocument.output;




  const doc = new Document({
    styles: {
      default: { 
        document: { 
          run: { font: "Times New Roman", size: 24 } 
        } 
      }
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        // Title - centered and bold
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "ACCESS EASEMENT AGREEMENT", bold: true, size: 24 })
          ]
        }),
        
        // Blank line
        new Paragraph({ children: [new TextRun("")] }),
        
        // Opening clause
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "KNOW BY ALL MEN THESE PRESENTS:", size: 24 })
          ]
        }),
        
        // Blank line
        new Paragraph({ children: [new TextRun("")] }),
        
        // Main paragraph with indentation
        new Paragraph({
          indent: { left: 720 },
          children: [
            new TextRun({ text: "THAT ", size: 24 }),
            new TextRun({ text: "Brian Blackman, a married person", bold: true, size: 24 }),
            new TextRun({ text: ",  hereinafter collectively referred to as \"Grantor,\" for and in consideration of the sum of Ten Dollars ($10.00) and other good and valuable consideration to them in hand paid by ", size: 24 }),
            new TextRun({ text: "Keith Blackman, a married person", bold: true, size: 24 }),
            new TextRun({ text: ", hereinafter referred to as \"Grantee,\" the receipt and sufficiency of which is hereby acknowledged, does hereby grant, bargain and sell unto the said Grantee, and unto his successors and assigns, an easement for the purpose of ingress and egress, over, under, and across the hereinafter described land in Craighead County County, Arkansas, to-wit", size: 24 })
          ]
        }),
        
        // Blank line
        new Paragraph({ children: [new TextRun("")] }),
        
        // Burdened tract heading
        new Paragraph({
          children: [
            new TextRun({ text: "BURDENED TRACT DESCRIPTION (Servient Estate):", bold: true, size: 24 })
          ]
        }),
        
        // Burdened tract description
        new Paragraph({
          children: [
            new TextRun({ text: "The property owned by Grantor and over which the easement is granted is legally described as:", size: 24 })
          ]
        }),
        
        // Blank line
        new Paragraph({ children: [new TextRun("")] }),
        
        // Lot description
        new Paragraph({
          children: [
            new TextRun({ text: "Lot 2, Block 1, Brookland Estates, Craighead County, Arkansas", size: 24 })
          ]
        }),
        
        // Blank line
        new Paragraph({ children: [new TextRun("")] }),
        
        // Subject to clause
        new Paragraph({
          indent: { left: 720 },
          children: [
            new TextRun({ text: "SUBJECT to all easements, rights-of-way, protective covenants and mineral reservations of record, if any.", size: 24 })
          ]
        }),
        
        // Blank line
        new Paragraph({ children: [new TextRun("")] }),
        
        // Benefitted tract heading
        new Paragraph({
          children: [
            new TextRun({ text: "BENEFITTED TRACT DESCRIPTION (Dominant Estate):", bold: true, size: 24 })
          ]
        }),
        
        // Benefitted tract description
        new Paragraph({
          children: [
            new TextRun({ text: "The property owned by Grantee and benefitted by this easement is legally described as:", size: 24 })
          ]
        }),
        
        // Blank line
        new Paragraph({ children: [new TextRun("")] }),
        
        // Benefitted lot description
        new Paragraph({
          children: [
            new TextRun({ text: "The West Twenty (20) Feet of Lot 2, Block 1, Brookland Estates, Craighead County, Arkansas", size: 24 })
          ]
        }),
        
        // Blank line
        new Paragraph({ children: [new TextRun("")] }),
        
        // Easement tract heading
        new Paragraph({
          children: [
            new TextRun({ text: "EASEMENT TRACT DESCRIPTION:", bold: true, size: 24 })
          ]
        }),
        
        // Easement tract description
        new Paragraph({
          children: [
            new TextRun({ text: "The specific portion of the Burdened Tract over which this Access Easement is granted for ingress and egress is legally described as:", size: 24 })
          ]
        }),
        
        // Blank line
        new Paragraph({ children: [new TextRun("")] }),
        
        // Placeholder for easement description
        new Paragraph({
          children: [
            new TextRun({ text: "{{easement_legal_description}}", size: 24 })
          ]
        }),
        
        // Blank line
        new Paragraph({ children: [new TextRun("")] }),
        
        // Together with clause
        new Paragraph({
          indent: { left: 720 },
          children: [
            new TextRun({ text: "TOGETHER WITH the right of ingress and egress across the Easement Tract for the purpose of providing access to and from the Benefitted Tract, including the right to construct, maintain, repair, replace, and improve a private driveway or road within the Easement Tract, and to perform all other acts reasonably necessary for the full enjoyment of the rights herein granted.", size: 24 })
          ]
        }),
        
        // Blank line
        new Paragraph({ children: [new TextRun("")] }),
        
        // To have and to hold clause
        new Paragraph({
          indent: { left: 720 },
          children: [
            new TextRun({ text: "TO HAVE AND TO HOLD the above described easement and rights unto said Grantee, his successors and assigns, forever.", size: 24 })
          ]
        }),
        
        // Blank line
        new Paragraph({ children: [new TextRun("")] }),
        
        // Warrant clause
        new Paragraph({
          indent: { left: 720 },
          children: [
            new TextRun({ text: "And Grantor agrees to warrant and forever defend all and singular the above described easement and rights unto said Grantee, his successors and assigns, against every person whomsoever lawfully claiming or seeking to claim the same or any part thereof.", size: 24 })
          ]
        }),
        
        // Blank line
        new Paragraph({ children: [new TextRun("")] }),
        
        // Final declaration
        new Paragraph({
          indent: { left: 720 },
          children: [
            new TextRun({ text: "This Easement is declared to and does inure to the benefit of the Benefitted Tract and shall be binding upon the successors in title to the lands herein described or any other part thereof, their mortgagees, lessees, heirs, administrators, executors, successors, and assigns.", size: 24 })
          ]
        })
      ]
    }]
  });
  
  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  const uint8Array = new Uint8Array(buffer);
  return new NextResponse(uint8Array, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename=access_easement_agreement.docx',
    },
  });


}

