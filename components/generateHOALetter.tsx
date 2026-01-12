import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Link,
  Image,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import { AlignCenter } from 'lucide-react';

/**
 * Generates a Title Report PDF and returns it as a Blob
 * @param data - The title report data
 * @returns Promise<Blob> - The generated PDF as a Blob
 */
export async function generateHOAReportPDF(
  data: HOAData
): Promise<Blob> {

  const doc = <HOADocument data={data} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

export async function generateHOAReportBase64(
  data: HOAData
): Promise<string> {
  const doc = <HOADocument data={data} />;
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
export async function downloadHOAReportPDF(
  data: HOAData,
  filename: string = 'title-report.pdf'
): Promise<void> {
  const blob = await generateHOAReportPDF(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}


/**
 * Represents a single HOA document/filing
 */
export interface HOADocument {
    /** The display name of the document */
    name: string;
    /** The URL or path to the document */
    url: string;
  }
  
  /**
   * Complete HOA property and management information
   */
  export interface HOAData {
    /** The name of the property or subdivision */
    propertyName: string;
    /** The official HOA name */
    hoaName: string;
    /** HOA dues information (amount and frequency) */
    dues: string;
    /** Name of the management company */
    managementCompany: string;
    /** Physical or mailing address of the management company */
    address: string;
    /** Contact phone number */
    phoneNumber: string;
    /** Contact email address */
    emailAddress: string;
    /** Array of subdivision filings and restriction documents */
    documents: HOADocument[];
  }
  
  /**
   * Props for the HOADocument component
   */
  export interface HOADocumentProps {
    /** The HOA data to render in the PDF */
    data: HOAData;
  }
  
  /**
   * Optional: Extended HOA data with additional fields
   */
  export interface ExtendedHOAData extends HOAData {
    /** Optional property ID or parcel number */
    propertyId?: string;
    /** Optional subdivision phase */
    phase?: string;
    /** Optional lot number */
    lotNumber?: string;
    /** Optional special assessments information */
    specialAssessments?: string;
    /** Optional additional notes */
    notes?: string;
  }
  
  /**
   * Type guard to check if an object is valid HOAData
   */
  export function isValidHOAData(obj: any): obj is HOAData {
    return (
      typeof obj === 'object' &&
      typeof obj.propertyName === 'string' &&
      typeof obj.hoaName === 'string' &&
      typeof obj.dues === 'string' &&
      typeof obj.managementCompany === 'string' &&
      typeof obj.address === 'string' &&
      typeof obj.phoneNumber === 'string' &&
      typeof obj.emailAddress === 'string' &&
      Array.isArray(obj.documents) &&
      obj.documents.every((doc: any) => 
        typeof doc.name === 'string' && 
        typeof doc.url === 'string'
      )
    );
  }
  
  /**
   * Utility type for partial HOA data (useful for forms)
   */
  export type PartialHOAData = Partial<HOAData>;
  
  /**
   * Utility type for HOA data with required documents
   */
  export type HOADataWithDocuments = Omit<Partial<HOAData>, 'documents'> & {
    documents: HOADocument[];
  };

  const styles = StyleSheet.create({
    page: {
      paddingHorizontal: 60,
      paddingTop: 20,
      paddingBottom: 120,
      fontSize: 11,
      fontFamily: 'Times-Roman',
      lineHeight: 1.5,
    },
    logo:{
      width: 250,
      height: 50,
      marginBottom:10,
    },
    divider: {
      borderBottomColor: '#cb9e5d',
      borderBottomWidth: 2,
      marginBottom: 10, // Add some space below the line
      marginTop: 10,   // Add some space above the line
      width: '100%',   // Ensure the line spans the full width of its container
    },
    title: {
      fontSize: 12,
      fontFamily: 'Times-Bold',
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: 'Times-Bold',
      marginTop: 10,
      marginBottom: 4,
    },
    paragraph: {
      marginBottom: 10,
      textAlign: 'justify',
      fontFamily: 'Times-Roman',
    },
    labelValue: {
      fontFamily: 'Times-Roman',
    },
    label: {
      fontFamily: 'Times-Bold',
    },
    linkItem: {
      marginLeft: 0,
      fontFamily: 'Times-Roman',
    },
    link: {
      color: '#0000EE',
      textDecoration: 'underline',
      fontFamily: 'Times-Roman',
    },
    linkIcon: {
      width: 12,
      height: 12,
      marginRight: 5,
    },
    disclaimer: {
      position: 'absolute',
      bottom: 30, 
      left: 0,
      right: 0, 
      paddingHorizontal: 60,     // Add this
      fontSize: 9,
      color: '#666666',
      lineHeight: 1.4,
      textAlign: 'justify',
      fontFamily: 'Times-Roman',
    },
  });
  
  // HOA Document Component
  const HOADocument: React.FC<HOADocumentProps> = ({ data }) => (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image style={styles.logo} src="https://lbndwiqgqqpzjwkhbdip.supabase.co/storage/v1/object/public/uploads/logo.png"/>
        <View style={styles.divider}></View>
        {/* Title */}
        <View style={{...styles.labelValue, marginBottom: 10}}>
          <Text>
            <Text style={styles.title}>Property Name: </Text>
            {data.propertyName}
          </Text>
        </View>
        
        {/* Introduction Paragraph */}
        <Text style={styles.paragraph}>
          The above referenced property is located within a community that has recorded subdivision
          restrictions. For your convenience we have included the following links to access current HOA
          contact details and recorded property restrictions:
        </Text>
  
        {/* HOA Contact & Management Information */}
        <Text style={styles.sectionTitle}>HOA Contact & Management Information</Text>
        
        <View style={styles.labelValue}>
          <Text>
            <Text style={styles.label}>HOA Name: </Text>
            {data.hoaName}
          </Text>
        </View>
  
        <View style={styles.labelValue}>
          <Text>
            <Text style={styles.label}>Dues: </Text>
            {data.dues}
          </Text>
        </View>
  
        <View style={styles.labelValue}>
          <Text>
            <Text style={styles.label}>Management Company: </Text>
            {data.managementCompany}
          </Text>
        </View>
  
        <View style={styles.labelValue}>
          <Text>
            <Text style={styles.label}>Address: </Text>
            {data.address}
          </Text>
        </View>
  
        <View style={styles.labelValue}>
          <Text>
            <Text style={styles.label}>Phone Number: </Text>
            {data.phoneNumber}
          </Text>
        </View>
  
        <View style={styles.labelValue}>
          <Text>
            <Text style={styles.label}>Email Address: </Text>
            {data.emailAddress}
          </Text>
        </View>
  
        {/* Subdivision Filings & Restrictions */}
        <Text style={styles.sectionTitle}>Subdivision Filings & Restrictions</Text>
        
        {data.documents.map((doc: HOADocument, index: number) => (
          <View key={index} style={styles.linkItem}>
            <Link src={doc.url} style={styles.link}>
              <Text>{doc.name}</Text>
            </Link>
          </View>
        ))}
  
        {/* Additional Information */}
        <View wrap={false}>
        <Text style={[styles.paragraph, { marginTop: 15 }]}>
          {`All links provided are verified and safe to access. Please refer to these resources for the most accurate and up-to-date information regarding the association and the property's governing documents.`}
        </Text>
  
        <Text style={styles.paragraph}>
          If you have any questions regarding this attachment or need assistance locating additional
          documents, please contact our office.
        </Text>
        </View>
  
  
        {/* Disclaimer */}
        <Text style={styles.disclaimer} fixed>
         {disclaimer}
        </Text>
      </Page>
    </Document>
  );
  
  // Example usage with sample data
  // export const sampleData: HOAData = {
  //   propertyName: "Eagle's Landing (ASC)",
  //   hoaName: "Eagle's Landing (ASC)",
  //   dues: "No Information",
  //   managementCompany: "c/o Magnolia Management Services",
  //   address: "PO Box 87334, Baton Rouge, LA 70879",
  //   phoneNumber: "(225)286-7546",
  //   emailAddress: "info@magnolialab.com",
  //   documents: [
  //     {
  //       name: "PLAT - 2nd filing, ph 2B & 3rd filing, ph 3B (941267).pdf",
  //       url: "#"
  //     },
  //     {
  //       name: "RESTRICTIONS - (833467).pdf",
  //       url: "#"
  //     },
  //     {
  //       name: "RESTRICTIONS - 1st amend (847352).pdf",
  //       url: "#"
  //     },
  //     {
  //       name: "RESTRICTIONS - 2nd amend (903101).pdf",
  //       url: "#"
  //     },
  //     {
  //       name: "RESTRICTIONS - 3rd amend (930422).pdf",
  //       url: "#"
  //     },
  //     {
  //       name: "RESTRICTIONS - 4th amend (944144).pdf",
  //       url: "#"
  //     },
  //     {
  //       name: "RESTRICTIONS - 5th amend (980359).pdf",
  //       url: "#"
  //     },
  //     {
  //       name: "RESTRICTIONS - 6th amend (1102713).pdf",
  //       url: "#"
  //     }
  //   ]
  // };

  const disclaimer = "This attached Homeowner's Association (HOA) informational packet is provided as a courtesy and convenience. This packet is for informational purposes only and may not be complete. Any additional information which is included is not warranted in any fashion and is provided for convenience and informational purposes only. This packet is not and shall not be considered to be a legal opinion, survey, title opinion letter, a title examination report, title guarantee, a title commitment, a title binder, or a policy of title insurance. The covenants, conditions and/or restrictions are sourced directly from the public records of the Clerk and Recorder in and for the parish where the property is located. These documents may contain unlawful and unenforceable provisions under current state and/or federal law including the Fair Housing Act and the ADA and therefore it is not for the parish and its affiliates to determine their legality. Documents are the property of the Texas and/or applicable Title & Abstract Co., and are merely reproduced public records."
  
  // Export the component
  export default HOADocument;

