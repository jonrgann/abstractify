import { type NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer"  

export async function POST(request: NextRequest) {
  try {

    const { data, options = {} } = await request.json()

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Title Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 800px;
            margin: 0 auto;
            padding: 60px 40px;
            background: #fff;
        }
        
        h1 {
            font-size: 28px;
            font-weight: 600;
            letter-spacing: -0.5px;
        }

        .separator{
            width: 100%;
            height: 1px;
            background-color: #e0e0e0;
            margin: 16px 0;    
        }
 
        .subtitle {
            color: #666;
            font-size: 14px;
            margin-bottom: 20px;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 20px;
        }
        
        .section {
            margin-bottom: 32px;
            page-break-before: auto;
        }
        
        .section-title {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #999;
            margin-bottom: 12px;
            font-weight: 500;
        }
        
        .content {
            font-size: 15px;
            color: #333;
        }
        
        .row {
            display: flex;
            margin-bottom: 8px;
        }
        
        .label {
            min-width: 140px;
            color: #666;
            font-size: 14px;
        }
        
        .value {
            color: #1a1a1a;
            font-size: 14px;
        }

        table {
            border-collapse: collapse;
            width: 100%;
        }

        th{
            color: #666;
            font-size: 14px;
            padding: 8px 8px 8px 0;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        td {
            padding: 8px 12px 8px 0;
            text-align: left;
            font-size: 14px;
            border-bottom: 1px solid #e0e0e0;
            color: #333;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 200px;
        }
    </style>
</head>
<body>
    <h1>TITLE REPORT</h1>
    <div class="separator"></div>
    <div class="section">
        <div class="section-title">Order Information</div>
        <div class="row">
            <div class="label">File Number</div>
            <div class="value">${data.orderInfo.orderNumber}</div>
        </div>
        <div class="row">
            <div class="label">Date of Search</div>
            <div class="value">${data.searchDate}</div>
        </div>
        <div class="row">
            <div class="label">Effective Date</div>
            <div class="value">${data.effectiveDate}</div>
        </div>
    </div>
    <div class="section">
        <div class="section-title">Property Information</div>
        <div class="row">
            <div class="label">Address</div>
            <div class="value">${data.orderInfo.propertyAddress}</div>
        </div>
        <div class="row">
            <div class="label">Legal Description</div>
            <div class="value">${data.orderInfo.legalDescription}</div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">Current Owner</div>
        <div class="row">
            <div class="label">Name</div>
            <div class="value">${data.vesting.names}</div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">Search Results</div>
    <table>
        <tbody> 
            ${data.searchResults && data.searchResults.length > 0
                ? // If judgments exist, map them
                  data.searchResults.map((result:any) => `
                    <tr>
                        <td>${result.documentNumber}</td>
                        <td>${result.filedDate}</td>
                        <td>${result.documentType}</td>
                        <td>${result.grantor}</td>
                        <td>${result.grantee}</td>
                    </tr>
                  `).join('')
                : 
                `<tr><td colspan="5" style="text-align: left">No documents found</td></tr>`
            }
        </tbody>
    </table>
    </div>
    <div class="section">
        <div class="section-title">Open Mortgages</div>
    <table>
        <tbody> 
            ${data.openMortgages && data.openMortgages.length > 0
                ? // If judgments exist, map them
                  data.openMortgages.map((result:any) => `
                    <tr>
                        <td>${result.documentNumber}</td>
                        <td>${result.filedDate}</td>
                        <td>${result.documentType}</td>
                        <td>${result.grantor}</td>
                        <td>${result.grantee}</td>
                    </tr>
                  `).join('')
                : 
                `<tr><td colspan="5" style="text-align: left">No documents found</td></tr>`
            }
        </tbody>
    </table>
    </div>
    <div class="section">
        <div class="section-title">Exceptions</div>
    <table>
        <tbody> 
            ${data.exceptions && data.exceptions.length > 0
                ? // If judgments exist, map them
                  data.exceptions.map((result:any) => `
                    <tr>
                        <td>${result.documentNumber}</td>
                        <td>${result.filedDate}</td>
                        <td>${result.documentType}</td>
                        <td>${result.grantor}</td>
                        <td>${result.grantee}</td>
                    </tr>
                  `).join('')
                : 
                `<tr><td colspan="5" style="text-align: left">No documents found</td></tr>`
            }
        </tbody>
    </table>
    </div>
        <div class="section">
        <div class="section-title">Judgments</div>
    <table>
        <tbody> 
            ${data.judgments && data.judgments.length > 0
                ? // If judgments exist, map them
                  data.judgments.map((result:any) => `
                    <tr>
                        <td>${result.documentNumber}</td>
                        <td>${result.filedDate}</td>
                        <td>${result.documentType}</td>
                        <td>${result.grantor}</td>
                        <td>${result.grantee}</td>
                    </tr>
                  `).join('')
                : 
                `<tr><td colspan="5" style="text-align: left">No documents found</td></tr>`
            }
        </tbody>
    </table>
    </div>
</body>
</html>`

    if (!html) {
      return NextResponse.json({ error: "HTML content is required" }, { status: 400 })
    }

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()

    // Set the HTML content
    await page.setContent(html, {
      waitUntil: "networkidle0",
    })

    // Generate PDF with options
    const pdfBuffer = await page.pdf({
      format: options.format || "A4",
      printBackground: options.printBackground !== false,
      margin: options.margin || {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
      ...options,
    })

    await browser.close()

    return new NextResponse(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="converted.pdf"',
        },
      })
  } catch (error) {
    console.error("HTML to PDF conversion error:", error)
    return NextResponse.json({ error: "Failed to convert HTML to PDF" }, { status: 500 })
  }
}
