
export async function generateTitleReportEmail(data: any) {

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Title Report is Ready!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 60px 20px;">
                <table width="540" cellpadding="0" cellspacing="0" border="0">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding-bottom: 20px;">
                            <h1 style="margin: 0; color: #000000; font-size: 24px; font-weight: 600;">Your Title Report is Ready!</h1>
                        </td>
                    </tr>
                    
                    <!-- Introduction -->
                    <tr>
                        <td style="padding-bottom: 32px;">
                            <p style="margin: 0; color: #666666; font-size: 15px; line-height: 1.6;">
                                We've completed research on your property.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Property Information -->
                    <tr>
                        <td style="padding-bottom: 24px;">
                            <p style="margin: 0 0 4px 0; color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Property Address</p>
                            <p style="margin: 0; color: #000000; font-size: 15px; line-height: 1.5;">
                               ${data.propertyAddress}
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding-bottom: 32px;">
                            <p style="margin: 0 0 4px 0; color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Legal Description</p>
                            <p style="margin: 0; color: #000000; font-size: 15px; line-height: 1.5;">
                            ${data.legalDescription}
                            </p>
                        </td>
                    </tr>

                    <!-- Current Owner -->
                    <tr>
                        <td style="padding-bottom: 16px;">
                            <p style="margin: 0 0 4px 0; color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Current Owner</p>
                            <p style="margin: 0; color: #000000; font-size: 15px;">${data.vestingInfo.name}</p>
                        </td>
                    </tr>
                    
                    <!-- Divider -->
                    <tr>
                        <td style="padding-bottom: 32px;">
                            <div style="height: 1px; background-color: #e5e5e5;"></div>
                        </td>
                    </tr>
                                        
                    <!-- Download Button -->
                    <tr>
                        <td style="padding-bottom: 32px;">
                            <a href="${data.reportURL}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; color-scheme: light">Download Report</a>
                        </td>
                    </tr>
                    
                    <!-- Footer Disclaimer -->
                    <tr>
                        <td style="padding-top: 32px; border-top: 1px solid #e5e5e5;">
                            <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                                This title report is provided for informational purposes only and does not constitute legal advice. The information is based on public records available at the time of search. This report should be reviewed by a qualified attorney before making any real estate decisions.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`

}