import {generateText, Output} from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { Document } from '@/lib/research/utils';

export async function getVestingInfo(document: Document) {
    "use step"

    const response = await generateText({
        // different system prompt, different model, no tools:
        model: google('gemini-2.5-flash'),
        system: `You are an expert title research assistant.  
        Your task is to review the attached Deed, analyze the vesting info and extract the grantee names exactly as they appear on the document. 
        Examples of Proper Extraction:
        Individual Names:

        John Smith and Jane Smith, a married couple
        John Smith and Jane Smith, husband and wife
        John Smith, a single man
        Jane Doe, an unmarried woman
        Robert Johnson, a widower

        Business Entities:

        Home Brew Construction, LLC, a limited liability company of Missouri
        ABC Corporation, a Delaware corporation
        Smith & Jones Partnership, a general partnership
        Main Street Properties, Inc., a California corporation

        Trusts:

        John Smith, Trustee of the Smith Family Trust dated January 15, 2020
        Mary Johnson, as Trustee of the Johnson Revocable Living Trust

        Multiple Parties:

        John Smith, a single man, and Mary Jones, a single woman, as joint tenants with right of survivorship
        ABC Company, LLC, a Texas limited liability company, as to an undivided 50% interest, and XYZ Corporation, a Nevada corporation, as to an undivided 50% interest

        Key Points:

        Include all punctuation (commas, periods, etc.)
        Preserve capitalization exactly as shown
        Include marital status or entity type descriptors
        Include state of formation for business entities
        Copy ownership percentages if specified
        Include capacity designations (trustee, personal representative, etc.)
        Do not abbreviate unless the deed itself uses abbreviations`,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: "<deed>"
              },
              {
                type:'image',
                image: document.image ?? ''
              },
              {
                type: 'text',
                text: "</deed>"
              }
            ]
          }
        ],
        output: Output.object({
          schema: z.object({
              grantee: z.string(),
            })
      }),
    });
  
    return response.output;
};