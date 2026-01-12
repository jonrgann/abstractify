import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    ExternalHyperlink,
    HeadingLevel,
  } from 'docx';
  import * as fs from 'fs';
  
  /**
   * Interface for HOA contact information
   */
  interface HOAContactInfo {
    hoaName: string;
    dues: string;
    managementCompany: string;
    address: string;
    phoneNumber: string;
    emailAddress: string;
  }
  
  /**
   * Interface for subdivision filing links
   */
  interface SubdivisionLink {
    label: string;
    url: string;
  }
  
  /**
   * Interface for HOA document data
   */
  interface HOADocumentData {
    propertyName: string;
    contactInfo: HOAContactInfo;
    platLinks: SubdivisionLink[];
    restrictionLinks: SubdivisionLink[];
    exceptionLinks: SubdivisionLink[];
  }
  
  /**
   * Generates an HOA document template using the docx library
   * @param data - The HOA document data
   * @param outputPath - Path where the document will be saved
   */
  export async function generateHOADocument(
    data: HOADocumentData,
    outputPath: string
  ): Promise<Buffer> {
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: 'Arial',
              size: 24, // 12pt
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              size: {
                width: 12240, // 8.5 inches in DXA (US Letter)
                height: 15840, // 11 inches in DXA
              },
              margin: {
                top: 1440, // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: [
            // Property Name (Bold)
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Property Name: ',
                  bold: true,
                }),
                new TextRun({
                  text: data.propertyName,
                  bold: true,
                }),
              ],
              spacing: {
                after: 240,
              },
            }),
  
            // Introduction paragraph
            new Paragraph({
              children: [
                new TextRun({
                  text: 'The above-referenced property is located within a community that has recorded subdivision restrictions. For your convenience we have included the following links to access current HOA contact details and recorded property restrictions:',
                }),
              ],
              spacing: {
                after: 240,
              },
            }),
  
            // HOA Contact & Management Information section
            new Paragraph({
              children: [
                new TextRun({
                  text: 'HOA Contact & Management Information',
                  bold: true,
                }),
              ],
              spacing: {
                before: 240,
                after: 120,
              },
            }),
  
            // HOA Name
            new Paragraph({
              children: [
                new TextRun({
                  text: 'HOA Name: ',
                  bold: true,
                }),
                new TextRun({
                  text: data.contactInfo.hoaName,
                }),
              ],
            }),
  
            // Dues
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Dues: ',
                  bold: true,
                }),
                new TextRun({
                  text: data.contactInfo.dues,
                }),
              ],
            }),
  
            // Management Company
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Management Company: ',
                  bold: true,
                }),
                new TextRun({
                  text: data.contactInfo.managementCompany,
                }),
              ],
            }),
  
            // Address
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Address: ',
                  bold: true,
                }),
                new TextRun({
                  text: data.contactInfo.address,
                }),
              ],
            }),
  
            // Phone Number
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Phone Number: ',
                  bold: true,
                }),
                new TextRun({
                  text: data.contactInfo.phoneNumber,
                }),
              ],
            }),
  
            // Email Address
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Email Address: ',
                  bold: true,
                }),
                new TextRun({
                  text: data.contactInfo.emailAddress,
                }),
              ],
              spacing: {
                after: 240,
              },
            }),
  
            // Subdivision Filings & Restrictions section
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Subdivision Filings & Restrictions',
                  bold: true,
                }),
              ],
              spacing: {
                before: 240,
                after: 120,
              },
            }),
  
            // Generate PLAT links
            ...data.platLinks.map(
              (link) =>
                new Paragraph({
                  children: [
                    new ExternalHyperlink({
                      children: [
                        new TextRun({
                          text: link.label,
                          style: 'Hyperlink',
                          color: '0563C1',
                          underline: {},
                        }),
                      ],
                      link: link.url,
                    }),
                  ],
                })
            ),
  
            // Generate RESTRICTION links
            ...data.restrictionLinks.map(
              (link) =>
                new Paragraph({
                  children: [
                    new ExternalHyperlink({
                      children: [
                        new TextRun({
                          text: link.label,
                          style: 'Hyperlink',
                          color: '0563C1',
                          underline: {},
                        }),
                      ],
                      link: link.url,
                    }),
                  ],
                })
            ),
  
            // Generate exception links
            ...data.exceptionLinks.map(
              (link) =>
                new Paragraph({
                  children: [
                    new ExternalHyperlink({
                      children: [
                        new TextRun({
                          text: link.label,
                          style: 'Hyperlink',
                          color: '0563C1',
                          underline: {},
                        }),
                      ],
                      link: link.url,
                    }),
                  ],
                })
            ),
  
            // Footer disclaimer
            new Paragraph({
              children: [
                new TextRun({
                  text: 'All links provided are verified and safe to access. Please refer to these resources for the most accurate and up-to-date information regarding the association and the property\'s governing documents.',
                }),
              ],
              spacing: {
                before: 240,
                after: 240,
              },
            }),
  
            // Closing paragraph
            new Paragraph({
              children: [
                new TextRun({
                  text: 'If you have any questions regarding this attachment or need assistance locating additional documents, please contact our office.',
                }),
              ],
            }),
          ],
        },
      ],
    });
  
    // Generate and save the document
    const buffer = await Packer.toBuffer(doc);
    return buffer;
    // fs.writeFileSync(outputPath, buffer);
  }
  
  /**
   * Example usage with sample data based on Carrington Place (EBR)
   */
  export async function generateCarringtonPlaceExample(): Promise<void> {
    const sampleData: HOADocumentData = {
      propertyName: 'Carrington Place (EBR)',
      contactInfo: {
        hoaName: 'Carrington Place (EBR)',
        dues: 'No Information',
        managementCompany: 'No Information',
        address: 'P O Box 86986, Baton Rouge, LA 70879',
        phoneNumber: '(225)324-1420',
        emailAddress: 'barcediano@gmail.com',
      },
      platLinks: [
        {
          label: 'PLAT - 1st filing (587-10261).pdf',
          url: 'https://commercetitle.sharepoint.com/:b:/g/IQDdW_o1AD_LTq0u0biyA4ksAeAayWPtno2jvtU3N5bJFjY?e=r8pZXT',
        },
        {
          label: 'PLAT - 3rd filing (75-10377).pdf',
          url: 'https://commercetitle.sharepoint.com/:b:/g/IQBxfHfZp9X6R5nG6RHkg-izARmn8ddWJdvx3erPVjS-5U8?e=4BbydX',
        },
        {
          label: 'PLAT - 4th filing (580-10487).pdf',
          url: 'https://commercetitle.sharepoint.com/:b:/g/IQBUu2gpJBN1QbCAJvY89HSQAfJQG36n6uClCAWSMJz9bYU?e=RG39UP',
        },
      ],
      restrictionLinks: [
        {
          label: 'RESTRICTIONS - 1st filing (123-10217).pdf',
          url: 'https://commercetitle.sharepoint.com/:b:/g/IQA9Uo0AXi9VQa8FLTnMcawhAYTtAzeoC6xwysi0HDh_bVA?e=QSCNpV',
        },
        {
          label: 'RESTRICTIONS - 2nd filing (406-10313).pdf',
          url: 'https://commercetitle.sharepoint.com/:b:/g/IQCR6itOMZRWRLDI0FiqO4CdAT7f6llCoziV5Gio0kp8KzA?e=X4r20N',
        },
        {
          label: 'RESTRICTIONS - 3rd filing (688-10378).pdf',
          url: 'https://commercetitle.sharepoint.com/:b:/g/IQCIUjO2xUrmRJjYJpoXDywYAW1VzcjPAMtjIoy4kOgqEZc?e=yLNeJZ',
        },
        {
          label: 'RESTRICTIONS - 4th filing (797-10489).pdf',
          url: 'https://commercetitle.sharepoint.com/:b:/g/IQDGwuugJNVLTrXK9A8Q_nLsARjldjeqt0tGzCY3i4do0Ds?e=HTvZsc',
        },
        {
          label: 'RESTRICTIONS - 4th filing, correction (826-10492).pdf',
          url: 'https://commercetitle.sharepoint.com/:b:/g/IQDk1CT3Gz1VSJSl4o5Wwnp3AVel7cxY_1SUarq_atcV7ik?e=2Ziscu',
        },
        {
          label: 'RESTRICTIONS - 5th filing (809-11063).pdf',
          url: 'https://commercetitle.sharepoint.com/:b:/g/IQAaS7LMDsRkTKd3fB_PVGCxAVlpTHYGpwI5WdtFpqrlfTg?e=rk45L0',
        },
        {
          label: 'RESTRICTIONS - amend, all filings (280-12944).pdf',
          url: 'https://commercetitle.sharepoint.com/:b:/g/IQDEKRLWpMIpQIcAS2zRsf1cAT0U7KtW2ew0I9yMStBUA3g?e=KKvmKe',
        },
        {
          label: 'RESTRICTIONS - amend, all filings (423-12780).pdf',
          url: 'https://commercetitle.sharepoint.com/:b:/g/IQDH0zecv2w5RpJItvDPAJQwAQMdgmTWv3p3_65lDQagpuY?e=UtJYbN',
        },
        {
          label: 'RESTRICTIONS - amend, all filings (645-12766).pdf',
          url: 'https://commercetitle.sharepoint.com/:b:/g/IQDc5oTxfHCHTL55SrKQ11AeAQWUIWM4uobB8BreheG_-KI?e=xYH2fV',
        },
        {
          label: 'RESTRICTIONS - amend, all filings (653-12766).pdf',
          url: 'https://commercetitle.sharepoint.com/:b:/g/IQB3eF6_CzLbRokyn7_J2huSAb9lmXRo3gJYQNlPl2bNQD4?e=VRObYK',
        },
        {
          label: 'RESTRICTIONS - amend, all filings (659-12766).pdf',
          url: 'https://commercetitle.sharepoint.com/:b:/g/IQDKOlWaVMbyQJX6TxoY20sqAYH16HTEtFOUmQGjD_yKTmM?e=YoBDVw',
        },
        {
          label: 'RESTRICTIONS - amend, all filings (677-12766).pdf',
          url: 'https://commercetitle.sharepoint.com/:b:/g/IQBWZb824P1OQa5rRA8z7aUzAVSS_oWtp5rNk6-dBXXi9KA?e=dafCUc',
        },
      ],
      exceptionLinks: [
        {
          label: 'restrictions exceptions - 1st filing.docx',
          url: 'https://commercetitle.sharepoint.com/:w:/g/IQAPPUOfP42OTq5YQvIyAxEDAeN6rzYLGzvPK_lHZ6ET2BE?e=VDfEko',
        },
        {
          label: 'restrictions exceptions - 2nd filing.docx',
          url: 'https://commercetitle.sharepoint.com/:w:/g/IQBxO5eTwaMXRpklI_U1Wi3NAW7XgkssY8Y9BCyAPsnzUcw?e=P8dTes',
        },
        {
          label: 'restrictions exceptions - 3rd filing.docx',
          url: 'https://commercetitle.sharepoint.com/:w:/g/IQAoB3lMsYKOQYw-YSL0DhVzAU7x2MNMY3B4D9O6q9p_ymU?e=0VmT8o',
        },
        {
          label: 'restrictions exceptions - 4th filing.docx',
          url: 'https://commercetitle.sharepoint.com/:w:/g/IQBB3WrAynJnTo7QtyBW2nJoAe7OEVYGqWhbPvotIDKNEzo?e=sdqIjM',
        },
        {
          label: 'restrictions exceptions - 5th filing.docx',
          url: 'https://commercetitle.sharepoint.com/:w:/g/IQCT4BQ5sQoLQ7TjLy3C9NJVATYTH4YP4nR4KW0ECWdHmSo?e=x8qA6B',
        },
      ],
    };
  
    await generateHOADocument(sampleData, 'carrington-place-hoa.docx');
    console.log('HOA document generated successfully!');
  }

  export const sampleHOAData: HOADocumentData = {
    propertyName: 'Carrington Place (EBR)',
    contactInfo: {
      hoaName: 'Carrington Place (EBR)',
      dues: 'No Information',
      managementCompany: 'No Information',
      address: 'P O Box 86986, Baton Rouge, LA 70879',
      phoneNumber: '(225)324-1420',
      emailAddress: 'barcediano@gmail.com',
    },
    platLinks: [
      {
        label: 'PLAT - 1st filing (587-10261).pdf',
        url: 'https://commercetitle.sharepoint.com/:b:/g/IQDdW_o1AD_LTq0u0biyA4ksAeAayWPtno2jvtU3N5bJFjY?e=r8pZXT',
      },
      {
        label: 'PLAT - 3rd filing (75-10377).pdf',
        url: 'https://commercetitle.sharepoint.com/:b:/g/IQBxfHfZp9X6R5nG6RHkg-izARmn8ddWJdvx3erPVjS-5U8?e=4BbydX',
      },
      {
        label: 'PLAT - 4th filing (580-10487).pdf',
        url: 'https://commercetitle.sharepoint.com/:b:/g/IQBUu2gpJBN1QbCAJvY89HSQAfJQG36n6uClCAWSMJz9bYU?e=RG39UP',
      },
    ],
    restrictionLinks: [
      {
        label: 'RESTRICTIONS - 1st filing (123-10217).pdf',
        url: 'https://commercetitle.sharepoint.com/:b:/g/IQA9Uo0AXi9VQa8FLTnMcawhAYTtAzeoC6xwysi0HDh_bVA?e=QSCNpV',
      },
      {
        label: 'RESTRICTIONS - 2nd filing (406-10313).pdf',
        url: 'https://commercetitle.sharepoint.com/:b:/g/IQCR6itOMZRWRLDI0FiqO4CdAT7f6llCoziV5Gio0kp8KzA?e=X4r20N',
      },
      {
        label: 'RESTRICTIONS - 3rd filing (688-10378).pdf',
        url: 'https://commercetitle.sharepoint.com/:b:/g/IQCIUjO2xUrmRJjYJpoXDywYAW1VzcjPAMtjIoy4kOgqEZc?e=yLNeJZ',
      },
      {
        label: 'RESTRICTIONS - 4th filing (797-10489).pdf',
        url: 'https://commercetitle.sharepoint.com/:b:/g/IQDGwuugJNVLTrXK9A8Q_nLsARjldjeqt0tGzCY3i4do0Ds?e=HTvZsc',
      },
      {
        label: 'RESTRICTIONS - 4th filing, correction (826-10492).pdf',
        url: 'https://commercetitle.sharepoint.com/:b:/g/IQDk1CT3Gz1VSJSl4o5Wwnp3AVel7cxY_1SUarq_atcV7ik?e=2Ziscu',
      },
      {
        label: 'RESTRICTIONS - 5th filing (809-11063).pdf',
        url: 'https://commercetitle.sharepoint.com/:b:/g/IQAaS7LMDsRkTKd3fB_PVGCxAVlpTHYGpwI5WdtFpqrlfTg?e=rk45L0',
      },
      {
        label: 'RESTRICTIONS - amend, all filings (280-12944).pdf',
        url: 'https://commercetitle.sharepoint.com/:b:/g/IQDEKRLWpMIpQIcAS2zRsf1cAT0U7KtW2ew0I9yMStBUA3g?e=KKvmKe',
      },
      {
        label: 'RESTRICTIONS - amend, all filings (423-12780).pdf',
        url: 'https://commercetitle.sharepoint.com/:b:/g/IQDH0zecv2w5RpJItvDPAJQwAQMdgmTWv3p3_65lDQagpuY?e=UtJYbN',
      },
      {
        label: 'RESTRICTIONS - amend, all filings (645-12766).pdf',
        url: 'https://commercetitle.sharepoint.com/:b:/g/IQDc5oTxfHCHTL55SrKQ11AeAQWUIWM4uobB8BreheG_-KI?e=xYH2fV',
      },
      {
        label: 'RESTRICTIONS - amend, all filings (653-12766).pdf',
        url: 'https://commercetitle.sharepoint.com/:b:/g/IQB3eF6_CzLbRokyn7_J2huSAb9lmXRo3gJYQNlPl2bNQD4?e=VRObYK',
      },
      {
        label: 'RESTRICTIONS - amend, all filings (659-12766).pdf',
        url: 'https://commercetitle.sharepoint.com/:b:/g/IQDKOlWaVMbyQJX6TxoY20sqAYH16HTEtFOUmQGjD_yKTmM?e=YoBDVw',
      },
      {
        label: 'RESTRICTIONS - amend, all filings (677-12766).pdf',
        url: 'https://commercetitle.sharepoint.com/:b:/g/IQBWZb824P1OQa5rRA8z7aUzAVSS_oWtp5rNk6-dBXXi9KA?e=dafCUc',
      },
    ],
    exceptionLinks: [
      {
        label: 'restrictions exceptions - 1st filing.docx',
        url: 'https://commercetitle.sharepoint.com/:w:/g/IQAPPUOfP42OTq5YQvIyAxEDAeN6rzYLGzvPK_lHZ6ET2BE?e=VDfEko',
      },
      {
        label: 'restrictions exceptions - 2nd filing.docx',
        url: 'https://commercetitle.sharepoint.com/:w:/g/IQBxO5eTwaMXRpklI_U1Wi3NAW7XgkssY8Y9BCyAPsnzUcw?e=P8dTes',
      },
      {
        label: 'restrictions exceptions - 3rd filing.docx',
        url: 'https://commercetitle.sharepoint.com/:w:/g/IQAoB3lMsYKOQYw-YSL0DhVzAU7x2MNMY3B4D9O6q9p_ymU?e=0VmT8o',
      },
      {
        label: 'restrictions exceptions - 4th filing.docx',
        url: 'https://commercetitle.sharepoint.com/:w:/g/IQBB3WrAynJnTo7QtyBW2nJoAe7OEVYGqWhbPvotIDKNEzo?e=sdqIjM',
      },
      {
        label: 'restrictions exceptions - 5th filing.docx',
        url: 'https://commercetitle.sharepoint.com/:w:/g/IQCT4BQ5sQoLQ7TjLy3C9NJVATYTH4YP4nR4KW0ECWdHmSo?e=x8qA6B',
      },
    ],
  };
  
  // Uncomment to run the example
  // generateCarringtonPlaceExample();