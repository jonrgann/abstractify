import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';

// Define types for the title report data
interface PropertyInfo {
  propertyAddress: string;
  legalDescription: string;
  county: string;
}

interface Owner {
  name: string;
  // vestingDate?: string;
  // vestingInstrument?: string;
}

interface SearchResult {
  filedDate: string;
  documentNumber: string;
  documentType: string;
  grantor: string;
  grantee: string,
}

interface TitleReportData {
  orderNumber: string;
  searchDate: string;
  effectiveDate: string;
  property: PropertyInfo;
  currentOwner: Owner;
  searchResults: SearchResult[];
  openMortgages: SearchResult[];
  exceptions: SearchResult[];
}

// Create styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 11,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingHorizontal:5,
  },
  label: {
    width: 140,
  },
  value: {
    flex: 1,
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#ddd',
    padding:5
  },
  tableHeader: {
    backgroundColor: '#e0e0e0',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  col1: {
    width: 10,
  },
  col2: {
    width: 10,
  },
  col3: {
    width: 20,
  },
  col4: {
    width: 50,
  },
  col5: {
    width: 50,
  },
  truncate:{
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    width: 100
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTop: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
  exception: {
    marginBottom: 6,
    paddingLeft: 15,
  },
});

// Create the PDF Document component
const TitleReportDocument: React.FC<{ data: TitleReportData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>TITLE REPORT</Text>
        <Text style={styles.subtitle}>Preliminary Title Report</Text>
      </View>

      {/* Report Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>REPORT INFORMATION</Text>
        <View style={styles.row}>
          <Text style={styles.label}>File Number:</Text>
          <Text style={styles.value}>{data.orderNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Search Date:</Text>
          <Text style={styles.value}>{data.searchDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Effective Date:</Text>
          <Text style={styles.value}>{data.effectiveDate}</Text>
        </View>
      </View>

      {/* Property Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PROPERTY INFORMATION</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{data.property.propertyAddress}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>County:</Text>
          <Text style={styles.value}>{data.property.county}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Legal Description:</Text>
          <Text style={styles.value}>{data.property.legalDescription}</Text>
        </View>
      </View>

      {/* Current Owner */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CURRENT OWNER</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{data.currentOwner.name}</Text>
        </View>
      </View>

      {/* Documents */}
      <View style={styles.section} >
        <Text style={styles.sectionTitle}>RECORDINGS</Text>
        {data.searchResults.map((document, index) => (
          <View style={styles.tableRow} key={index}>
          <View style={{ width: 80, overflow: 'hidden' }}>
            <Text>{document.documentNumber}</Text>
          </View>
          <View style={{ width: 80, overflow: 'hidden' }}>
            <Text>{document.filedDate}</Text>
          </View>
          <View style={{ width: 100, overflow: 'hidden' }}>
            <Text>{document.documentType}</Text>
          </View>
          <View style={{ width: 120, overflow: 'hidden', paddingLeft: 5 }}>
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee.substring(0, 30)}</Text>
          </View>
          <View style={{ width: 120, overflow: 'hidden', paddingLeft: 5 }}>
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee.substring(0, 30)}</Text>
          </View>
        </View>
        ))}
      </View>


        <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>OPEN MORTGAGES</Text>
        {data.openMortgages.map((document, index) => (
          <View style={styles.tableRow} key={index}>
          <View style={{ width: 80, overflow: 'hidden' }}>
            <Text>{document.documentNumber}</Text>
          </View>
          <View style={{ width: 80, overflow: 'hidden' }}>
            <Text>{document.filedDate}</Text>
          </View>
          <View style={{ width: 100, overflow: 'hidden' }}>
            <Text>{document.documentType}</Text>
          </View>
          <View style={{ width: 120, overflow: 'hidden', paddingLeft: 5 }}>
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee.substring(0, 30)}</Text>
          </View>
          <View style={{ width: 120, overflow: 'hidden', paddingLeft: 5 }}>
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee.substring(0, 30)}</Text>
          </View>
        </View>
        ))}
      </View>

      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>EXCEPTIONS</Text>
        {data.exceptions.map((document, index) => (
          <View style={styles.tableRow} key={index}>
          <View style={{ width: 80, overflow: 'hidden' }}>
            <Text>{document.documentNumber}</Text>
          </View>
          <View style={{ width: 80, overflow: 'hidden' }}>
            <Text>{document.filedDate}</Text>
          </View>
          <View style={{ width: 100, overflow: 'hidden' }}>
            <Text>{document.documentType}</Text>
          </View>
          <View style={{ width: 120, overflow: 'hidden', paddingLeft: 5 }}>
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee.substring(0, 30)}</Text>
          </View>
          <View style={{ width: 120, overflow: 'hidden', paddingLeft: 5 }}>
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee.substring(0, 30)}</Text>
          </View>
        </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>This is a preliminary title report and does not constitute a commitment to issue title insurance.</Text>
        <Text>Page 1 of 1</Text>
      </View>
    </Page>
  </Document>
);

/**
 * Generates a Title Report PDF and returns it as a Blob
 * @param data - The title report data
 * @returns Promise<Blob> - The generated PDF as a Blob
 */
export async function generateTitleReportPDF(
  data: TitleReportData
): Promise<Blob> {
  const doc = <TitleReportDocument data={data} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

/**
 * Generates a Title Report PDF and triggers a download
 * @param data - The title report data
 * @param filename - Optional filename for the download (default: 'title-report.pdf')
 */
export async function downloadTitleReportPDF(
  data: TitleReportData,
  filename: string = 'title-report.pdf'
): Promise<void> {
  const blob = await generateTitleReportPDF(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
