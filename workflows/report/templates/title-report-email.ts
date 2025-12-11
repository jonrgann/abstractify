
export async function generateTitleReportEmail(data: any) {

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Title Report is Ready</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background-color: #004e89;
            padding: 20px;
            text-align: right;
            color: #ffffff;
        }
        .header img {
            float: left;
            height: 40px;
        }
        .header-text {
            line-height: 1.4;
            font-size: 14px;
        }
        .banner {
            background-color: #e8f0f5;
            padding: 40px 20px;
            text-align: center;
        }
        .banner h1 {
            color: #004e89;
            margin: 0 0 15px 0;
            font-size: 28px;
        }
        .banner p {
            color: #333333;
            margin: 0;
            font-size: 16px;
        }
        .content {
            padding: 30px 40px;
            color: #333333;
            line-height: 1.6;
        }
        .section-title {
            color: #004e89;
            font-size: 20px;
            font-weight: bold;
            margin: 25px 0 15px 0;
        }
        .property-details {
            margin: 15px 0;
        }
        .detail-row {
            margin: 10px 0;
        }
        .detail-label {
            font-weight: bold;
            display: inline-block;
            min-width: 160px;
        }
        .detail-value {
            display: inline;
            color: #555555;
        }
        ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        li {
            margin: 5px 0;
        }
        .footer {
            background-color: #f8f8f8;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666666;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="header-text">
                <strong>[Company Name]</strong><br>
                [Company Phone]
            </div>
        </div>

        <!-- Banner -->
        <div class="banner">
            <h1>Your Title Report is Ready!</h1>
            <p>We've completed research on your property.</p>
        </div>

        <!-- Content -->
        <div class="content">
            <p>Dear [Recipient Name],</p>
            
            <p>Please find below a summary of the title report for the property located at:</p>

            <div class="section-title">Property Details</div>
            <div class="property-details">
                <div class="detail-row">
                    <span class="detail-label">Property Address:</span>
                    <span class="detail-value">${data.propertyAddress}]<br>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Legal Description:</span>
                    <span class="detail-value">${data.legalDescription}</span>
                </div>
            </div>

            <div class="section-title">Current Owner(s)</div>
            <p>The current record owner(s) of the property appear to be:</p>
            <ul>
                <li>[Owner Name 1]</li>
                <li>[Owner Name 2, if applicable]</li>
            </ul>

            <div class="section-title">Title Examination Results</div>
            <p>[Summary of title examination findings, including any liens, encumbrances, or issues discovered]</p>

            <div class="section-title">Next Steps</div>
            <p>[Information about next steps, such as reviewing the full report, scheduling a closing, or addressing any title issues]</p>

            <p>If you have any questions about this title report, please don't hesitate to contact us at [Company Phone] or reply to this email.</p>

            <p>Best regards,<br>
            <strong>[Your Name]</strong><br>
            [Your Title]<br>
            [Company Name]</p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>&copy; 2025 [Company Name]. All rights reserved.</p>
            <p>[Company Address] | [Company Phone] | [Company Email]</p>
        </div>
    </div>
</body>
</html>`

}