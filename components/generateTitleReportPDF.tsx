import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import { AlignCenter } from 'lucide-react';

// Define types for the title report data
interface PropertyInfo {
  propertyAddress: string;
  legalDescription: string;
  county: string;
}

interface Owner {
  name: string;
  recordingNumber?: string;
  recordingDate?: string;
  // vestingInstrument?: string;
}

interface SearchResult {
  filedDate: string;
  documentNumber: string;
  documentType: string;
  grantors: string[];
  grantees: string[],
  amount?: string,
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

/**
 * Generates a Title Report PDF and returns it as a Blob
 * @param data - The title report data
 * @returns Promise<Blob> - The generated PDF as a Blob
 */
export async function generateTitleReportPDF(
  data: TitleReportData
): Promise<Blob> {
    "use step"
  const doc = <TitleReport data={data} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

export async function generateTitleReportBase64(
  data: TitleReportData
): Promise<string> {
  "use step"
  const doc = <TitleReport data={data} />;
  const pdfBlob = await pdf(doc).toBlob();
  const pdfBuffer = await pdfBlob.arrayBuffer();
  const base64String = Buffer.from(pdfBuffer).toString('base64');
  console.log(base64String)
  return base64String;
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
    "use step"
  const blob = await generateTitleReportPDF(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    paddingBottom: 70,
  },
  header: {
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
  },
  sectionHeader: {
    backgroundColor: '#ec003f',
    color: 'white',
    padding: 6,
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center'
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '30%',
    textAlign: 'right',
    paddingRight: 10,
    fontSize: 9,
  },
  value: {
    width: '70%',
    fontSize: 10,
    fontWeight: 'bold',
  },
  instrumentHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    backgroundColor: "#F8F8F8",
    padding: 5
  },
  notes: {
    fontSize: 9,
    fontStyle: 'italic',
    marginLeft: '30%',
    marginTop: 3,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginVertical: 10,
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
});



const TitleReport: React.FC<{ data: TitleReportData }> = ({ data }) => (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>TITLE REPORT</Text>
          <Text style={styles.subtitle}>
            Order Number: {data.orderNumber} |
            Date Searched: {data.searchDate} | Effective Date: {data.effectiveDate}
          </Text>
        </View>

        {/* Property Information */}
        <View style={styles.sectionHeader}>
          <Text>PROPERTY INFORMATION</Text>
        </View>

        <View style={{ marginTop: 10 }}>
        <View style={styles.row}>
          <Text style={styles.label}>Street Address:</Text>
          <Text style={styles.value}>{data.property.propertyAddress}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Legal Description:</Text>
          <Text style={styles.value}>{data.property.legalDescription}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>County:</Text>
          <Text style={styles.value}>{data.property.county}</Text>
        </View>
        </View>

        {/* Ownership Information */}
        <View style={styles.sectionHeader}>
          <Text>OWNERSHIP INFORMATION</Text>
        </View>
        <View style={{ marginTop: 10 }}>
        <View style={styles.row}>
        <Text style={styles.label}>{"Owner's Name(s):"}</Text>
          <Text style={styles.value}>{data.currentOwner.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date Acquired:</Text>
          <Text style={styles.value}>{formatDate(data.currentOwner.recordingDate ?? '')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Recording Number:</Text>
          <Text style={styles.value}>{data.currentOwner.recordingNumber}</Text>
        </View>
        </View>

        {/* 24 Month Chain */}
        <View style={styles.sectionHeader}>
          <Text>24 MONTH CHAIN REPORT</Text>
        </View>

        {data.chain24Month.length == 0 && (
          <Text style={styles.instrumentHeader}>
           NONE FOUND         
          </Text>
        )}

{data.chain24Month && data.chain24Month.map((deed, index) => (
            <View key={index} wrap={false}>
            <Text style={styles.instrumentHeader}>
            {deed.documentType}
            </Text>
            <View style={styles.row}>
              <Text style={styles.label}>Grantor(s):</Text>
              <Text style={styles.value}>{deed.grantors.join(", ")}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Grantee(s):</Text>
              <Text style={styles.value}>{deed.grantees.join(", ")}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Recording Date:</Text>
              <Text style={styles.value}>{formatDate(deed.filedDate)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Recording Number:</Text>
              <Text style={styles.value}>{deed.documentNumber}</Text>
            </View>

            {/* {deed.notes && (
              <View style={styles.row}>
                <Text style={styles.label}>Notes:</Text>
                <Text style={styles.notes}>{deed.notes}</Text>
              </View>
            )} */}
          </View>
        ))}
        
        {/* Deed Chain */}
        <View style={styles.sectionHeader}>
          <Text>CHAIN OF TITLE</Text>
        </View>

        {data.deedChain.length == 0 && (
          <Text style={styles.instrumentHeader}>
           NONE FOUND         
          </Text>
        )}

        {data.deedChain && data.deedChain.map((deed, index) => (
            <View key={index} wrap={false}>
            <Text style={styles.instrumentHeader}>
            {deed.documentType}
            </Text>
            <View style={styles.row}>
              <Text style={styles.label}>Grantor(s):</Text>
              <Text style={styles.value}>{deed.grantors.join(", ")}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Grantee(s):</Text>
              <Text style={styles.value}>{deed.grantees.join(", ")}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Recording Date:</Text>
              <Text style={styles.value}>{formatDate(deed.filedDate)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Recording Number:</Text>
              <Text style={styles.value}>{deed.documentNumber}</Text>
            </View>

            {/* {deed.notes && (
              <View style={styles.row}>
                <Text style={styles.label}>Notes:</Text>
                <Text style={styles.notes}>{deed.notes}</Text>
              </View>
            )} */}
          </View>
        ))}

        {/* Mortgages and Deeds of Trust */}
        <View wrap={false}>
        <View style={styles.sectionHeader}>
          <Text>MORTGAGES AND DEEDS OF TRUST</Text>
        </View>

        {data.openMortgages.length == 0 && (
          <Text style={styles.instrumentHeader}>
           NONE FOUND         
          </Text>
        )}

        {data.openMortgages && data.openMortgages.map((mortgage, index) => (
            <View key={index} wrap={false}>
            <Text style={styles.instrumentHeader}>
              {mortgage.documentType}
            </Text>
            <View style={styles.row}>
              <Text style={styles.label}>Mortgagor(s):</Text>
              <Text style={styles.value}>{mortgage.grantors.join(", ")}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Mortgagee(s):</Text>
              <Text style={styles.value}>{mortgage.grantees.join(", ")}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Recording Date:</Text>
              <Text style={styles.value}>{formatDate(mortgage.filedDate)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Recording Number:</Text>
              <Text style={styles.value}>{mortgage.documentNumber}</Text>
            </View>

           {mortgage.amount && (
              <View style={styles.row}>
                <Text style={styles.label}>Amount:</Text>
                <Text style={styles.value}>{formatCurrency(mortgage.amount)}</Text>
              </View>
            )}

          </View>
       
        ))}
        </View>


        {/* Exceptions */}
        <View >
          <View style={styles.sectionHeader}>
            <Text>EXCEPTIONS</Text>
          </View>

          {data.exceptions.length == 0 && (
            <Text style={styles.instrumentHeader}>
            NONE FOUND           
            </Text>
          )}

          {data.exceptions && data.exceptions.map((document, index) => (
            <View key={index} wrap={false}>
              <Text style={styles.instrumentHeader}>
                {document.documentType}
              </Text>
              <View style={styles.row}>
                <Text style={styles.label}>Grantor(s):</Text>
                <Text style={styles.value}>{document.grantors.join(", ")}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Grantee(s):</Text>
                <Text style={styles.value}>{document.grantees.join(", ")}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Recording Date:</Text>
                <Text style={styles.value}>{formatDate(document.filedDate)}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Recording Number:</Text>
                <Text style={styles.value}>{document.documentNumber}</Text>
              </View>

            </View>
        
          ))}
        </View>

        {/* Judgments */}
        <View >
          <View style={styles.sectionHeader}>
            <Text>JUDGMENTS</Text>
          </View>

          {data.judgments.length == 0 && (
            <Text style={styles.instrumentHeader}>
            NONE FOUND          
            </Text>
          )}

          {data.judgments && data.judgments.map((document, index) => (
            <View key={index} wrap={false}>
              <Text style={styles.instrumentHeader}>
                {document.documentType}
              </Text>
              <View style={styles.row}>
                <Text style={styles.label}>Grantor(s):</Text>
                <Text style={styles.value}>{document.grantors.join(", ")}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Grantee(s):</Text>
                <Text style={styles.value}>{document.grantees.join(", ")}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Recording Date:</Text>
                <Text style={styles.value}>{formatDate(document.filedDate)}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Recording Number:</Text>
                <Text style={styles.value}>{document.documentNumber}</Text>
              </View>

              {document.amount && (
              <View style={styles.row}>
                <Text style={styles.label}>Amount:</Text>
                <Text style={styles.value}>{formatCurrency(document.amount)}</Text>
              </View>
            )}

            </View>
        
          ))}
        </View>
      {/* Footer */}
      <View style={styles.footer} fixed>
        <Text>This is a preliminary title report and does not constitute a commitment to issue title insurance.</Text>
        <Text style={{ marginTop: 5 }} render={({ pageNumber, totalPages}) => ( `Page ${pageNumber} of ${totalPages}`)}/>
      </View>
      </Page>
    </Document>
  );


  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return date.toLocaleDateString('en-US', options);
  }

  function formatCurrency(amount: string): string {
    const usdFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    });
    
    return usdFormatter.format(Number(amount));
  }