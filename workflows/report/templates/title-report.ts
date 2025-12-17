export async function generateTitleReportHTML(data: any) {

    return `<!DOCTYPE html>
<html lang="en">
<body style="margin: 40; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        
        <!-- Header Section -->
        <tr>
            <td style="padding-bottom: 32px; border-bottom: 2px solid #000000;">
                <h1 style="margin: 0 0 16px 0; color: #000000; font-size: 28px; font-weight: 700;">Title Report</h1>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
                    <tr>
                        <td style="color: #666666; padding: 4px 0;">File Number:</td>
                        <td style="color: #000000; padding: 4px 0; font-weight: 500;">${data.orderNumber}</td>
                    </tr>
                    <tr>
                        <td style="color: #666666; padding: 4px 0;">Search Date:</td>
                        <td style="color: #000000; padding: 4px 0; font-weight: 500;">${data.searchDate}</td>
                    </tr>
                    <tr>
                        <td style="color: #666666; padding: 4px 0;">Effective Date:</td>
                        <td style="color: #000000; padding: 4px 0; font-weight: 500;">${data.effectiveDate}</td>
                    </tr>
                </table>
            </td>
        </tr>
        
        <!-- Spacing -->
        <tr>
            <td style="padding-bottom: 24px;"></td>
        </tr>
                      
        <!-- Property Information -->
        <tr>
            <td style="padding-bottom: 24px;">
                <p style="margin: 0 0 4px 0; color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Property Address</p>
                <p style="margin: 0; color: #000000; font-size: 15px; line-height: 1.5;">
                   ${data.property.propertyAddress}
                </p>
            </td>
        </tr>
        
        <tr>
            <td style="padding-bottom: 32px;">
                <p style="margin: 0 0 4px 0; color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Legal Description</p>
                <p style="margin: 0; color: #000000; font-size: 15px; line-height: 1.5;">
                ${data.property.legalDescription}
                </p>
            </td>
        </tr>

        <!-- Current Owner -->
        <tr>
            <td style="padding-bottom: 16px;">
                <p style="margin: 0 0 4px 0; color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Current Owner</p>
                <p style="margin: 0; color: #000000; font-size: 15px;">${data.currentOwner.name}</p>
            </td>
        </tr>
        
        <!-- Divider -->
        <tr>
            <td style="padding-bottom: 32px;">
                <div style="height: 1px; background-color: #e5e5e5;"></div>
            </td>
        </tr>

        <!-- 24 Month Chain -->
        <tr>
            <td style="padding-bottom: 24px;">
                <p style="margin: 0 0 16px 0; color: #000000; font-size: 16px; font-weight: 600;">24 Month Chain</p>
                ${data.chain24Month && data.chain24Month.length > 0 ? data.chain24Month.map((deed: any) => `
                    <div style="margin-bottom: 20px; padding: 16px; background-color: #f9f9f9; border-left: 3px solid #000000;">
                        <p style="margin: 0 0 8px 0; color: #000000; font-size: 14px; font-weight: 500;">${deed.documentType}</p>
                        <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.6;">
                            <tr>
                                <td style="color: #666666; padding: 2px 0;">Recording Number:</td>
                                <td style="color: #000000; padding: 2px 0;">${deed.documentNumber}</td>
                            </tr>
                            <tr>
                                <td style="color: #666666; padding: 2px 0;">Recording Date:</td>
                                <td style="color: #000000; padding: 2px 0;">${deed.filedDate}</td>
                            </tr>
                            <tr>
                                <td style="color: #666666; padding: 2px 0; vertical-align: top;">Grantors:</td>
                                <td style="color: #000000; padding: 2px 0;">${deed.grantors}</td>
                            </tr>
                            <tr>
                                <td style="color: #666666; padding: 2px 0; vertical-align: top;">Grantees:</td>
                                <td style="color: #000000; padding: 2px 0;">${deed.grantees}</td>
                            </tr>
                        </table>
                    </div>
                `).join('') : '<p style="margin: 0; color: #666666; font-size: 14px; font-style: italic;">No deeds recorded in the last 24 months</p>'}
            </td>
        </tr>

        <!-- Divider -->
        <tr>
            <td style="padding-bottom: 32px;">
                <div style="height: 1px; background-color: #e5e5e5;"></div>
            </td>
        </tr>

        <!-- Deed Chain -->
        <tr>
            <td style="padding-bottom: 24px;">
                <p style="margin: 0 0 16px 0; color: #000000; font-size: 16px; font-weight: 600;">Deed Chain</p>
                ${data.deedChain && data.deedChain.length > 0 ? data.deedChain.map((deed: any) => `
                    <div style="margin-bottom: 20px; padding: 16px; background-color: #f9f9f9; border-left: 3px solid #000000;">
                        <p style="margin: 0 0 8px 0; color: #000000; font-size: 14px; font-weight: 500;">${deed.documentType}</p>
                        <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.6;">
                            <tr>
                                <td style="color: #666666; padding: 2px 0;">Recording Number:</td>
                                <td style="color: #000000; padding: 2px 0;">${deed.documentNumber}</td>
                            </tr>
                            <tr>
                                <td style="color: #666666; padding: 2px 0;">Recording Date:</td>
                                <td style="color: #000000; padding: 2px 0;">${deed.filedDate}</td>
                            </tr>
                            <tr>
                                <td style="color: #666666; padding: 2px 0; vertical-align: top;">Grantors:</td>
                                <td style="color: #000000; padding: 2px 0;">${deed.grantors}</td>
                            </tr>
                            <tr>
                                <td style="color: #666666; padding: 2px 0; vertical-align: top;">Grantees:</td>
                                <td style="color: #000000; padding: 2px 0;">${deed.grantees}</td>
                            </tr>
                        </table>
                    </div>
                `).join('') : '<p style="margin: 0; color: #666666; font-size: 14px; font-style: italic;">No deed records available</p>'}
            </td>
        </tr>

        <!-- Divider -->
        <tr>
            <td style="padding-bottom: 32px;">
                <div style="height: 1px; background-color: #e5e5e5;"></div>
            </td>
        </tr>

        <!-- Mortgages -->
        <tr>
            <td style="padding-bottom: 24px;">
                <p style="margin: 0 0 16px 0; color: #000000; font-size: 16px; font-weight: 600;">Mortgages</p>
                ${data.mortgages && data.mortgages.length > 0 ? data.mortgages.map((mortgage: any) => `
                    <div style="margin-bottom: 20px; padding: 16px; background-color: #f9f9f9; border-left: 3px solid #000000;">
                        <p style="margin: 0 0 8px 0; color: #000000; font-size: 14px; font-weight: 500;">${mortgage.documentType}</p>
                        <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.6;">
                            <tr>
                                <td style="color: #666666; padding: 2px 0;">Recording Number:</td>
                                <td style="color: #000000; padding: 2px 0;">${mortgage.documentNumber}</td>
                            </tr>
                            <tr>
                                <td style="color: #666666; padding: 2px 0;">Recording Date:</td>
                                <td style="color: #000000; padding: 2px 0;">${mortgage.filedDate}</td>
                            </tr>
                            <tr>
                                <td style="color: #666666; padding: 2px 0; vertical-align: top;">Grantors:</td>
                                <td style="color: #000000; padding: 2px 0;">${mortgage.grantors}</td>
                            </tr>
                            <tr>
                                <td style="color: #666666; padding: 2px 0; vertical-align: top;">Grantees:</td>
                                <td style="color: #000000; padding: 2px 0;">${mortgage.grantees}</td>
                            </tr>
                        </table>
                    </div>
                `).join('') : '<p style="margin: 0; color: #666666; font-size: 14px; font-style: italic;">No open mortgages found.</p>'}
            </td>
        </tr>

        <!-- Divider -->
        <tr>
            <td style="padding-bottom: 32px;">
                <div style="height: 1px; background-color: #e5e5e5;"></div>
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
</body>
</html>`

}