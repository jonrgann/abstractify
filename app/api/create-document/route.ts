import { google } from '@ai-sdk/google';
import { generateText, Output} from 'ai';
import z from 'zod';

import { NextResponse } from 'next/server';

import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'

export async function POST(req: Request,) {
  const { text, instructions } = await req.json();

  if(!text) Response.json({text: 'Not enough information provided.'})

  const generateDocument = await generateText({
    model: google('gemini-2.5-flash'),
    system: `You are an experienced real estate attorney with expertise in drafting precise, legally sound documents for property transactions.  
    Your task is to draft an ACCESS EASEMENT AGREEMENT document from the information provided in the users request.
    - Grantor and Grantee names should include maritial status if provided.` 
    + (instructions ?? ''),
    prompt:`input: ${text}`,
    output: Output.object({
      schema: z.object({
        grantor: z.string(),
        grantee: z.string(),
        burdened_tract_legal_description: z.string().describe("The legal description of the burndened tract."),
        benifited_tract_legal_description: z.string().describe("The legal description of the burndened tract."),
        easement_legal_description: z.string().describe("The legal description of the easement tract."),
        county:z.string().describe("The county name. ex: Craighead")
      }),
    }),
  })

  const output = generateDocument.output;

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
        // Header section
        new Paragraph({
          children: [new TextRun({ text: "Prepared by and after", size: 20 })]
        }),
        new Paragraph({
          children: [new TextRun({ text: "recording return to:", size: 20 })]
        }),
        new Paragraph({
          children: [new TextRun({ text: "[ATTORNEY NAME]", size: 20 })]
        }),
        new Paragraph({
          children: [new TextRun({ text: "[ATTORNEY ADDRESS LINE 1]", size: 20 })]
        }),
        new Paragraph({
          children: [new TextRun({ text: "[ATTORNEY ADDRESS LINE 2]", size: 20 })]
        }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("")] }),

        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "ACCESS & UTILITY EASEMENT AGREEMENT", bold: true, size: 24 })]
        }),
        new Paragraph({ children: [new TextRun("")] }),

        // Opening paragraph
        new Paragraph({
          indent: { left: 720 },
          children: [
            new TextRun({ text: "This ACCESS & UTILITY EASEMENT AGREEMENT (\"Agreement\") is made this ____ day of " }),
            new TextRun({ text: "[MONTH]" }),
            new TextRun({ text: ", " }),
            new TextRun({ text: "[YEAR]" }),
            new TextRun({ text: " by and between " }),
            new TextRun({ text: "[GRANTOR 1 NAME]" }),
            new TextRun({ text: ", " }),
            new TextRun({ text: "[GRANTOR 1 MARITAL STATUS]" }),
            new TextRun({ text: " and " }),
            new TextRun({ text: "[GRANTOR 2 NAME]" }),
            new TextRun({ text: ", " }),
            new TextRun({ text: "[GRANTOR 2 MARITAL STATUS]" }),
            new TextRun({ text: " (collectively, \"Grantor\"); and " }),
            new TextRun({ text: "[GRANTEE 1 NAME]" }),
            new TextRun({ text: " and " }),
            new TextRun({ text: "[GRANTEE 2 NAME]" }),
            new TextRun({ text: ", husband and wife (collectively, \"Grantee\")." })
          ]
        }),

        // WITNESSETH
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "WITNESSETH:", bold: true })]
        }),

        // WHEREAS clauses
        new Paragraph({
          children: [
            new TextRun({ text: "WHEREAS, " }),
            new TextRun({ text: "[GRANTOR 1 NAME]" }),
            new TextRun({ text: " is the owner of that certain tract of real property located in " }),
            new TextRun({ text: "[COUNTY]" }),
            new TextRun({ text: " County, Arkansas, more particularly described on Exhibit A-1 attached hereto and incorporated herein by reference (the \"" }),
            new TextRun({ text: "[GRANTOR 1 SHORT NAME]" }),
            new TextRun({ text: " Property\"); and" })
          ]
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "WHEREAS, " }),
            new TextRun({ text: "[GRANTOR 2 NAME]" }),
            new TextRun({ text: " is the owner of that certain tract of real property located in " }),
            new TextRun({ text: "[COUNTY]" }),
            new TextRun({ text: " County, Arkansas, more particularly described on Exhibit A-2 attached hereto and incorporated herein by reference (the \"" }),
            new TextRun({ text: "[GRANTOR 2 SHORT NAME]" }),
            new TextRun({ text: " Property\") (collectively, the " }),
            new TextRun({ text: "[GRANTOR 1 SHORT NAME]" }),
            new TextRun({ text: " Property and the " }),
            new TextRun({ text: "[GRANTOR 2 SHORT NAME]" }),
            new TextRun({ text: " Property are hereinafter referred to as the \"Grantor Property\"); and" })
          ]
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "WHEREAS, Grantee is the owner of that certain real property located in " }),
            new TextRun({ text: "[COUNTY]" }),
            new TextRun({ text: " County, Arkansas, more particularly described on Exhibit B attached hereto and incorporated herein (the \"Grantee Property\"); and" })
          ]
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "WHEREAS, Grantor desires to grant and convey to Grantee, its heirs and assigns forever, a perpetual, non-exclusive easement and right-of-way over, under, across and through that certain portion of the Grantor Property, as more particularly described on Exhibit C attached hereto and incorporated herein (the \"Easement\"); and" })
          ]
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "NOW THEREFORE, for and in consideration of Ten Dollars ($10.00), the mutual covenants exchanged herein, and other good and valuable consideration, the receipt and sufficiency of which is hereby acknowledged, the parties agree as follows:" })
          ]
        }),

        // Numbered sections
        new Paragraph({
          children: [
            new TextRun({ text: "l.  " }),
            new TextRun({ text: "Grant of Easement.", bold: true }),
            new TextRun({ text: " Subject to the terms and conditions hereof, Grantor hereby grants and conveys to Grantee, its successors and assigns, and the Grantee Property, a perpetual, non-exclusive easement and right-of-way, as shown on Exhibit C." })
          ]
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "2.\t" }),
            new TextRun({ text: "Use of Easement.", bold: true }),
            new TextRun({ text: "\tThe easement granted herein shall be for the purpose of constructing, repairing, replacing, upgrading, removal and operation of utilities, as well as ingress and egress to and from the Grantee Property." })
          ]
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "3.\t" }),
            new TextRun({ text: "Damage to Property.", bold: true }),
            new TextRun({ text: " In the event damage is caused to the Grantor Property or any property or improvements located on the Grantor Property by Grantee or the agents, contractors, guests, tenants, or invitees of Grantee, or any person or entity exercising rights granted hereby, such parties shall promptly restore or repair such damage to its prior condition, or, if requested by Grantor, compensate Grantor for the costs of restoration or repair." })
          ]
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "4.\t" }),
            new TextRun({ text: "Run With The Land.", bold: true }),
            new TextRun({ text: " All provisions of this Agreement shall run with the land, shall be binding upon Grantor and Grantee, the heirs, successors and assigns thereof, the Grantor Property and the Grantee Property; and shall inure to the benefit of Grantor and Grantee and their respective heirs, successors and assigns, and to the benefit of the Grantor Property and the Grantee Property." })
          ]
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "5.\t" }),
            new TextRun({ text: "Maintenance and Repair.", bold: true }),
            new TextRun({ text: "  As between the parties, Grantee shall be responsible for  all costs and expenses of the construction and maintenance of any private roads, driveways, or utility lines traversing the Easement.  Grantee shall keep the Easement in good order and repair at all times, all at Grantee's sole cost and expense. Should Grantee fail to maintain or repair the Easement after thirty (30) days written notice from Grantor, Grantor shall have the right, but not the obligation, to conduct such maintenance or repair and to bill Grantee for the reasonable cost thereof, and such costs shall be immediately due and payable by Grantee." })
          ]
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "6.\t" }),
            new TextRun({ text: "Compliance with Law.", bold: true }),
            new TextRun({ text: " The exercise of the rights and privileges granted by this Agreement shall be done in compliance with all applicable federal, state, county and municipal laws, ordinances and regulations." })
          ]
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "7.\t" }),
            new TextRun({ text: "Public Grant.", bold: true }),
            new TextRun({ text: " Nothing contained herein shall be used or construed as a grant of any rights to the public or to any public or governmental authority or agency." })
          ]
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "8.\t" }),
            new TextRun({ text: "Governing Law.", bold: true }),
            new TextRun({ text: "  The Agreement shall be governed by and construed under the laws of the State of Arkansas." })
          ]
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "9.\t" }),
            new TextRun({ text: "Recitals: Exhibits.", bold: true }),
            new TextRun({ text: " Each of the parties acknowledges and agrees that the recitals set forth above and the Exhibit attached hereto are true and accurate in all respects, are a material part of this Agreement and the consideration hereof, and are expressly incorporated herein by reference." })
          ]
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "10.\t" }),
            new TextRun({ text: "Modification and Waiver.", bold: true }),
            new TextRun({ text: " This Agreement may not be changed, amended or modified in any respect whatsoever or any obligation contained herein be waived, except in writing signed by all the then current owners of the Grantor Property and the Grantee Property." })
          ]
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "11.\t" }),
            new TextRun({ text: "Entire Agreement.", bold: true }),
            new TextRun({ text: " This Agreement, including all exhibits attached hereto, shall constitute the entire agreement and understanding of the parties and there are no other prior written or oral agreements with respect to the subject matter of this Agreement." })
          ]
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "TO HAVE AND TO HOLD the above-described Agreement and rights unto said Grantee, its heirs, successors and assigns, forever." })
          ]
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "[SIGNATURE PAGES TO FOLLOW]" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("")] }),

        // Signature blocks - Grantor 1
        new Paragraph({
          children: [new TextRun({ text: "__________________________________" })]
        }),
        new Paragraph({
          children: [new TextRun({ text: "[GRANTOR 1 NAME]" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("")] }),

        // Acknowledgment - Grantor 1
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "ACKNOWLEDGMENT", bold: true })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "STATE OF ARKANSAS" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "COUNTY OF _________________" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [
            new TextRun({ text: "On this day personally appeared before me, a Notary Public in and for said County and State, " }),
            new TextRun({ text: "[GRANTOR 1 NAME]" }),
            new TextRun({ text: ", [and ________________, his/her spouse,] personally known to me (or sufficiently proven) to be the person(s) whose name(s) is/are subscribed to the foregoing instrument, and acknowledged that he/she/they executed the same for the purposes and consideration therein expressed." })
          ]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "WITNESS my hand and official seal this ___ day of ___________, 20__." })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "__________________________________" })]
        }),
        new Paragraph({
          children: [new TextRun({ text: "Notary Public" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("")] }),

        // Signature blocks - Grantor 2
        new Paragraph({
          children: [new TextRun({ text: "__________________________________" })]
        }),
        new Paragraph({
          children: [new TextRun({ text: "[GRANTOR 2 NAME]" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("")] }),

        // Acknowledgment - Grantor 2
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "ACKNOWLEDGMENT", bold: true })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "STATE OF ARKANSAS" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "COUNTY OF _________________" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [
            new TextRun({ text: "On this day personally appeared before me, a Notary Public in and for said County and State, " }),
            new TextRun({ text: "[GRANTOR 2 NAME]" }),
            new TextRun({ text: ", [and ________________, his/her spouse,] personally known to me (or sufficiently proven) to be the person(s) whose name(s) is/are subscribed to the foregoing instrument, and acknowledged that he/she/they executed the same for the purposes and consideration therein expressed." })
          ]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "WITNESS my hand and official seal this ___ day of ___________, 20__." })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "__________________________________" })]
        }),
        new Paragraph({
          children: [new TextRun({ text: "Notary Public" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("")] }),

        // Signature blocks - Grantees
        new Paragraph({
          children: [new TextRun({ text: "__________________________________" })]
        }),
        new Paragraph({
          children: [new TextRun({ text: "[GRANTEE 1 NAME]" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "__________________________________" })]
        }),
        new Paragraph({
          children: [new TextRun({ text: "[GRANTEE 2 NAME]" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("")] }),

        // Acknowledgment - Grantees
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "ACKNOWLEDGMENT", bold: true })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "STATE OF ARKANSAS" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "COUNTY OF _________________" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [
            new TextRun({ text: "On this day personally appeared before me, a Notary Public in and for said County and State, " }),
            new TextRun({ text: "[GRANTEE 1 NAME]" }),
            new TextRun({ text: " and " }),
            new TextRun({ text: "[GRANTEE 2 NAME]" }),
            new TextRun({ text: ", husband and wife, personally known to me (or sufficiently proven) to be the persons whose names are subscribed to the foregoing instrument, and acknowledged that they executed the same for the purposes and consideration therein expressed." })
          ]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "WITNESS my hand and official seal this ___ day of ___________, 20__." })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "__________________________________" })]
        }),
        new Paragraph({
          children: [new TextRun({ text: "Notary Public" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        // Exhibits
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "EXHIBIT A-1", bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "GRANTOR PROPERTY DESCRIPTION", bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "[GRANTOR 1 SHORT NAME] Parcel", bold: true })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "Parcel: [PARCEL NUMBER]" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "[INSERT LEGAL DESCRIPTION FOR GRANTOR 1 PROPERTY]" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "EXHIBIT A-2", bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "GRANTOR PROPERTY DESCRIPTION", bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "[GRANTOR 2 SHORT NAME] Parcel", bold: true })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "Parcel: [PARCEL NUMBER]" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "[INSERT LEGAL DESCRIPTION FOR GRANTOR 2 PROPERTY]" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "EXHIBIT B", bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "GRANTEE PROPERTY DESCRIPTION", bold: true })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "[INSERT LEGAL DESCRIPTION FOR GRANTEE PROPERTY]" })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "EXHIBIT C", bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "EASEMENT DESCRIPTION", bold: true })]
        }),

        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "[WIDTH] FOOT ACCESS & UTILITY EASEMENT", bold: true })]
        }),

        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [new TextRun({ text: "[INSERT LEGAL DESCRIPTION FOR EASEMENT]" })]
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

