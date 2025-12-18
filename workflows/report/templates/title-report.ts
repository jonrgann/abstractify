import jsPDF from "jspdf";

interface PropertyInfo {
  propertyAddress: string;
  legalDescription: string;
  county: string;
}

interface Owner {
  name: string;
  recordingNumber?: string;
  recordingDate?: string;
}

interface SearchResult {
  filedDate: string;
  documentNumber: string;
  documentType: string;
  grantors: string[];
  grantees: string[];
  amount?: string;
}

interface TitleReportData {
  orderNumber: string;
  searchDate: string;
  effectiveDate: string;
  property: PropertyInfo;
  currentOwner: Owner;
  deedChain: SearchResult[];
  chain24Month: SearchResult[];
  searchResults: SearchResult[];
  openMortgages: SearchResult[];
  exceptions: SearchResult[];
  judgments: SearchResult[];
}

export function generateTitleReportPDF(data: TitleReportData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to check if we need a new page
  const checkPageBreak = (neededSpace: number): void => {
    if (yPosition + neededSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Helper function to add section header
  const addSectionHeader = (title: string): void => {
    checkPageBreak(15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, yPosition);
    yPosition += 8;
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;
  };

  // Helper function to add text with label
  const addLabelValue = (label: string, value: string, indent: number = 0): void => {
    checkPageBreak(8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', margin + indent, yPosition);
    doc.setFont('helvetica', 'normal');
    
    const labelWidth = doc.getTextWidth(label + ': ');
    const maxWidth = pageWidth - margin * 2 - labelWidth - indent;
    const lines = doc.splitTextToSize(value, maxWidth);
    
    doc.text(lines, margin + indent + labelWidth, yPosition);
    yPosition += lines.length * 5;
  };

  // Title Header
  doc.setFillColor(41, 98, 255);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('TITLE REPORT', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order #${data.orderNumber}`, pageWidth / 2, 28, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  yPosition = 45;

  // Report Information Section
  addSectionHeader('REPORT INFORMATION');
  addLabelValue('Search Date', data.searchDate);
  addLabelValue('Effective Date', data.effectiveDate);
  yPosition += 5;

  // Property Information Section
  addSectionHeader('PROPERTY INFORMATION');
  addLabelValue('Property Address', data.property.propertyAddress);
  addLabelValue('County', data.property.county);
  addLabelValue('Legal Description', data.property.legalDescription);
  yPosition += 5;

  // Current Owner Section
  addSectionHeader('CURRENT OWNER');
  addLabelValue('Name', data.currentOwner.name);
  if (data.currentOwner.recordingNumber) {
    addLabelValue('Recording Number', data.currentOwner.recordingNumber);
  }
  if (data.currentOwner.recordingDate) {
    addLabelValue('Recording Date', data.currentOwner.recordingDate);
  }
  yPosition += 5;

  // Helper function to create a table for search results
  const createSearchResultsTable = (
    title: string,
    results: SearchResult[],
    showAmount: boolean = false
  ): void => {
    if (results.length === 0) {
      checkPageBreak(15);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('None', margin + 5, yPosition);
      yPosition += 8;
      return;
    }

    const tableData = results.map(result => {
      const row = [
        result.filedDate,
        result.documentType,
        result.documentNumber,
        result.grantors.join(', '),
        result.grantees.join(', ')
      ];
      if (showAmount) {
        row.push(result.amount || 'N/A');
      }
      return row;
    });

    const headers = ['Filed Date', 'Document Type', 'Doc Number', 'Grantors', 'Grantees'];
    if (showAmount) {
      headers.push('Amount');
    }

    checkPageBreak(20);

    (doc as any).autoTable({
      startY: yPosition,
      head: [headers],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 98, 255],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: showAmount ? 28 : 32 },
        2: { cellWidth: 25 },
        3: { cellWidth: showAmount ? 32 : 38 },
        4: { cellWidth: showAmount ? 32 : 38 },
        ...(showAmount && { 5: { cellWidth: 22, halign: 'right' } }),
      },
      didDrawPage: function (data: any) {
        yPosition = data.cursor.y + 5;
      }
    });
  };

  // Deed Chain Section
  addSectionHeader('DEED CHAIN');
  createSearchResultsTable('Deed Chain', data.deedChain);
  yPosition += 5;

  // 24-Month Chain Section
  addSectionHeader('24-MONTH CHAIN OF TITLE');
  createSearchResultsTable('24-Month Chain', data.chain24Month);
  yPosition += 5;

  // Open Mortgages Section
  addSectionHeader('OPEN MORTGAGES');
  createSearchResultsTable('Open Mortgages', data.openMortgages, true);
  yPosition += 5;

  // Judgments Section
  addSectionHeader('JUDGMENTS');
  createSearchResultsTable('Judgments', data.judgments, true);
  yPosition += 5;

  // Exceptions Section
  addSectionHeader('EXCEPTIONS TO TITLE');
  createSearchResultsTable('Exceptions', data.exceptions);
  yPosition += 5;

  // All Search Results Section
  addSectionHeader('ALL SEARCH RESULTS');
  createSearchResultsTable('All Results', data.searchResults, true);

  // Add footer to all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      margin,
      pageHeight - 10
    );
  }

  return doc;
}

// Example usage function
export function downloadTitleReport(data: TitleReportData, filename?: string): void {
  const pdf = generateTitleReportPDF(data);
  const defaultFilename = `Title_Report_${data.orderNumber}_${Date.now()}.pdf`;
  pdf.save(filename || defaultFilename);
}

// Function to get PDF as blob (useful for uploading or previewing)
export function getTitleReportBlob(data: TitleReportData): Blob {
  const pdf = generateTitleReportPDF(data);
  return pdf.output('blob');
}

// Function to get PDF as base64 string
export function getTitleReportBase64(data: TitleReportData): string {
  const pdf = generateTitleReportPDF(data);
  return pdf.output('dataurlstring');
}