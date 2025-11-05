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
  // vestingDate?: string;
  // vestingInstrument?: string;
}

interface SearchResult {
  filedDate: string;
  documentNumber: string;
  documentType: string;
  grantor: string;
  grantee: string,
  amount?: number
}

interface TitleReportData {
  orderNumber: string;
  searchDate: string;
  effectiveDate: string;
  property: PropertyInfo;
  currentOwner: Owner;
  deedChain: SearchResult[];
  searchResults: SearchResult[];
  openMortgages: SearchResult[];
  exceptions: SearchResult[];
  judgments: SearchResult[];
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
          <Text style={styles.label}>Legal Description:</Text>
          <Text style={styles.value}>{data.property.legalDescription}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>County:</Text>
          <Text style={styles.value}>{data.property.county}</Text>
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
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee}</Text>
          </View>
          <View style={{ width: 120, overflow: 'hidden', paddingLeft: 5 }}>
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee}</Text>
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
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee}</Text>
          </View>
          <View style={{ width: 120, overflow: 'hidden', paddingLeft: 5 }}>
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee}</Text>
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
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee}</Text>
          </View>
          <View style={{ width: 120, overflow: 'hidden', paddingLeft: 5 }}>
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee}</Text>
          </View>
        </View>
        ))}
      </View>

      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>JUDGEMENTS</Text>
        {data.judgments.map((document, index) => (
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
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee}</Text>
          </View>
          <View style={{ width: 120, overflow: 'hidden', paddingLeft: 5 }}>
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee}</Text>
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

const TitleReportTemplate: React.FC<{ data: TitleReportData }> = ({ data }) => (
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
          <Text style={styles.label}>Legal Description:</Text>
          <Text style={styles.value}>{data.property.legalDescription}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>County:</Text>
          <Text style={styles.value}>{data.property.county}</Text>
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
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantor}</Text>
          </View>
          <View style={{ width: 120, overflow: 'hidden', paddingLeft: 5 }}>
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee}</Text>
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
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantor}</Text>
          </View>
          <View style={{ width: 120, overflow: 'hidden', paddingLeft: 5 }}>
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee}</Text>
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
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantor}</Text>
          </View>
          <View style={{ width: 120, overflow: 'hidden', paddingLeft: 5 }}>
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee}</Text>
          </View>
        </View>
        ))}
      </View>

      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>JUDGEMENTS</Text>
        {data.judgments.map((document, index) => (
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
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantor}</Text>
          </View>
          <View style={{ width: 120, overflow: 'hidden', paddingLeft: 5 }}>
            <Text style={{ flexWrap: 'nowrap', textOverflow: 'ellipsis', }}>{document.grantee}</Text>
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
  const doc = <TitleReport data={data} />;
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

export const exampleData: TitleReportData = {
  orderNumber: "25-0842",
  searchDate: "2025-11-05",
  effectiveDate: "2025-11-04",
  
  property: {
    propertyAddress: "1247 Maple Grove Avenue, Owasso, OK 74055",
    legalDescription: "Lot 18, Block 3, MEADOWBROOK ESTATES ADDITION, City of Owasso, Osage County, State of Oklahoma, according to the recorded plat thereof.",
    county: "Osage County"
  },
  
  currentOwner: {
    name: "Sarah Michelle Johnson and Robert James Johnson, Husband and Wife"
  },
  deedChain: [],
  searchResults: [
    {
      filedDate: "2023-03-15",
      documentNumber: "2023-001847",
      documentType: "WARRANTY DEED",
      grantor: "Michael David Thompson and Lisa Ann Thompson",
      grantee: "Sarah Michelle Johnson and Robert James Johnson"
    },
    {
      filedDate: "2023-03-15",
      documentNumber: "2023-001848",
      documentType: "DEED OF TRUST",
      grantor: "Sarah Michelle Johnson and Robert James Johnson",
      grantee: "First National Bank of Tulsa"
    },
    {
      filedDate: "2024-06-22",
      documentNumber: "2024-003421",
      documentType: "RELEASE OF LIEN",
      grantor: "ABC Construction Company",
      grantee: "Sarah Michelle Johnson and Robert James Johnson"
    },
    {
      filedDate: "2018-09-10",
      documentNumber: "2018-005692",
      documentType: "WARRANTY DEED",
      grantor: "Meadowbrook Development LLC",
      grantee: "Michael David Thompson and Lisa Ann Thompson"
    }
  ],
  
  openMortgages: [
    {
      filedDate: "2023-03-15",
      documentNumber: "2023-001848",
      documentType: "DEED OF TRUST",
      grantor: "Sarah Michelle Johnson and Robert James Johnson",
      grantee: "First National Bank of Tulsa"
    }
  ],
  
  exceptions: [
    {
      filedDate: "2018-05-20",
      documentNumber: "2018-002847",
      documentType: "UTILITY EASEMENTS",
      grantor: "Meadowbrook Development LLC",
      grantee: "Oklahoma Gas & Electric Company"
    },
    {
      filedDate: "2018-05-20",
      documentNumber: "2018-002848",
      documentType: "DRAINAGE EASEMENT",
      grantor: "Meadowbrook Development LLC",
      grantee: "City of Owasso"
    },
    {
      filedDate: "2017-12-01",
      documentNumber: "2017-008934",
      documentType: "Declaration of Covenants, Conditions and Restrictions",
      grantor: "Meadowbrook Development LLC",
      grantee: "Meadowbrook Estates Homeowners Association"
    }
  ],
  
  judgments: []
};


const styles2 = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    paddingBottom: 50,
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
      <Page size="LETTER" style={styles2.page}>
        {/* Header */}
        <View style={styles2.header}>
          <Text style={styles2.title}>TITLE REPORT</Text>
          <Text style={styles2.subtitle}>
            Order Number: {data.orderNumber} |
            Date Searched: {data.searchDate} | Effective Date: {data.effectiveDate}
          </Text>
        </View>

        {/* Property Information */}
        <View style={styles2.sectionHeader}>
          <Text>PROPERTY INFORMATION</Text>
        </View>

        <View style={{ marginTop: 10 }}>
        <View style={styles2.row}>
          <Text style={styles2.label}>Street Address:</Text>
          <Text style={styles2.value}>{data.property.propertyAddress}</Text>
        </View>

        <View style={styles2.row}>
          <Text style={styles2.label}>Legal Description:</Text>
          <Text style={styles2.value}>{data.property.legalDescription}</Text>
        </View>

        <View style={styles2.row}>
          <Text style={styles2.label}>County:</Text>
          <Text style={styles2.value}>{data.property.county}</Text>
        </View>
        </View>

        {/* Ownership Information */}
        <View style={styles2.sectionHeader}>
          <Text>OWNERSHIP INFORMATION</Text>
        </View>
        <View style={{ marginTop: 10 }}>
        <View style={styles2.row}>
        <Text style={styles2.label}>{"Owner's Name(s):"}</Text>
          <Text style={styles2.value}>{data.currentOwner.name}</Text>
        </View>
        {/* <View style={styles2.row}>
          <Text style={styles2.label}>Date Acquired:</Text>
          <Text style={styles2.value}>XX-XX-XXXX</Text>
        </View>
        <View style={styles2.row}>
          <Text style={styles2.label}>Recording Number:</Text>
          <Text style={styles2.value}>XX-XX-XXXX</Text>
        </View> */}
        </View>
        {/* Deed Chain */}
        <View style={styles2.sectionHeader}>
          <Text>DEED CHAIN</Text>
        </View>

        {data.deedChain.length == 0 && (
          <Text style={styles2.instrumentHeader}>
           No deeds were found.           
          </Text>
        )}

        {data.deedChain && data.deedChain.map((deed, index) => (
          <View key={index} wrap={false}>
            <Text style={styles2.instrumentHeader}>
            {deed.documentType}
            </Text>
            <View style={styles2.row}>
              <Text style={styles2.label}>Date Recorded:</Text>
              <Text style={styles2.value}>{formatDate(deed.filedDate)}</Text>
            </View>

            <View style={styles2.row}>
              <Text style={styles2.label}>Recording Number:</Text>
              <Text style={styles2.value}>{deed.documentNumber}</Text>
            </View>

            <View style={styles2.row}>
              <Text style={styles2.label}>Grantor(s):</Text>
              <Text style={styles2.value}>{deed.grantor}</Text>
            </View>

            <View style={styles2.row}>
              <Text style={styles2.label}>Grantee(s):</Text>
              <Text style={styles2.value}>{deed.grantee}</Text>
            </View>

            {/* {deed.notes && (
              <View style={styles2.row}>
                <Text style={styles2.label}>Notes:</Text>
                <Text style={styles2.notes}>{deed.notes}</Text>
              </View>
            )} */}
          </View>
        ))}

        {/* Mortgages and Deeds of Trust */}
        <View wrap={false}>
        <View style={styles2.sectionHeader}>
          <Text>MORTGAGES AND DEEDS OF TRUST</Text>
        </View>

        {data.openMortgages.length == 0 && (
          <Text style={styles2.instrumentHeader}>
           NONE FOUND         
          </Text>
        )}

        {data.openMortgages && data.openMortgages.map((mortgage, index) => (
          <View key={index} wrap={false}>
            <Text style={styles2.instrumentHeader}>
              {mortgage.documentType}
            </Text>

            <View style={styles2.row}>
              <Text style={styles2.label}>Date Recorded:</Text>
              <Text style={styles2.value}>{formatDate(mortgage.filedDate)}</Text>
            </View>

            <View style={styles2.row}>
              <Text style={styles2.label}>Recording Number:</Text>
              <Text style={styles2.value}>{mortgage.documentNumber}</Text>
            </View>

            <View style={styles2.row}>
              <Text style={styles2.label}>Mortgagor(s):</Text>
              <Text style={styles2.value}>{mortgage.grantor}</Text>
            </View>

            <View style={styles2.row}>
              <Text style={styles2.label}>Mortgagee(s):</Text>
              <Text style={styles2.value}>{mortgage.grantee}</Text>
            </View>

           {mortgage.amount && (
              <View style={styles2.row}>
                <Text style={styles2.label}>Amount:</Text>
                <Text style={styles2.value}>{formatCurrency(mortgage.amount)}</Text>
              </View>
            )}

          </View>
       
        ))}
        </View>


        {/* Exceptions */}
        <View wrap={false}>
          <View style={styles2.sectionHeader}>
            <Text>EXCEPTIONS</Text>
          </View>

          {data.exceptions.length == 0 && (
            <Text style={styles2.instrumentHeader}>
            NONE FOUND           
            </Text>
          )}

          {data.exceptions && data.exceptions.map((document, index) => (
            <View key={index} wrap={false}>
              <Text style={styles2.instrumentHeader}>
                {document.documentType}
              </Text>

              <View style={styles2.row}>
                <Text style={styles2.label}>Date Recorded:</Text>
                <Text style={styles2.value}>{formatDate(document.filedDate)}</Text>
              </View>

              <View style={styles2.row}>
                <Text style={styles2.label}>Recording Number:</Text>
                <Text style={styles2.value}>{document.documentNumber}</Text>
              </View>

              <View style={styles2.row}>
                <Text style={styles2.label}>Grantor(s):</Text>
                <Text style={styles2.value}>{document.grantor}</Text>
              </View>

              <View style={styles2.row}>
                <Text style={styles2.label}>Grantee(s):</Text>
                <Text style={styles2.value}>{document.grantee}</Text>
              </View>

            </View>
        
          ))}
        </View>

        {/* Judgments */}
        <View wrap={false}>
          <View style={styles2.sectionHeader}>
            <Text>JUDGMENTS</Text>
          </View>

          {data.judgments.length == 0 && (
            <Text style={styles2.instrumentHeader}>
            NONE FOUND          
            </Text>
          )}

          {data.judgments && data.judgments.map((document, index) => (
            <View key={index} wrap={false}>
              <Text style={styles2.instrumentHeader}>
                {document.documentType}
              </Text>

              <View style={styles2.row}>
                <Text style={styles2.label}>Date Recorded:</Text>
                <Text style={styles2.value}>{formatDate(document.filedDate)}</Text>
              </View>

              <View style={styles2.row}>
                <Text style={styles2.label}>Recording Number:</Text>
                <Text style={styles2.value}>{document.documentNumber}</Text>
              </View>

              <View style={styles2.row}>
                <Text style={styles2.label}>Grantor(s):</Text>
                <Text style={styles2.value}>{document.grantor}</Text>
              </View>

              <View style={styles2.row}>
                <Text style={styles2.label}>Grantee(s):</Text>
                <Text style={styles2.value}>{document.grantee}</Text>
              </View>

              {document.amount && (
              <View style={styles2.row}>
                <Text style={styles2.label}>Amount:</Text>
                <Text style={styles2.value}>{formatCurrency(document.amount)}</Text>
              </View>
            )}

            </View>
        
          ))}
        </View>
      {/* Footer */}
      <View style={styles2.footer} fixed>
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

  function formatCurrency(amount: number): string {
    const usdFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    });
    
    return usdFormatter.format(amount);
  }