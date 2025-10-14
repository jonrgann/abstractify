export interface Document {
    documentId: string;
    documentNumber: string;
    filedDate: string;
    documentType: string;
    grantor: string;
    grantee: string;
    legal: string;
  }

  export const DEED_TYPES = [
    'WARRANTY DEED',
    'QUITCLAIM DEED',
    'SPECIAL WARRANTY DEED',
    'DEED',
    'BARGAIN AND SALE DEED',
    'GRANT DEED',
    'TRUSTEE DEED',
    'EXECUTOR DEED',
    'ADMINISTRATOR DEED',
    'SHERIFF DEED',
    'TAX DEED',
    'GIFT DEED',
    'TRANSFER ON DEATH DEED',
    'LIFE ESTATE DEED',
  ] as const;

  export const MORTGAGE_TYPES = [
    'MORTGAGE',
    'DEED OF TRUST',
    'SECURITY DEED',
    'MORTGAGE DEED',
    'ASSIGNMENT OF MORTGAGE',
    'MODIFICATION OF MORTGAGE',
    'SUBORDINATION AGREEMENT',
    'CONSOLIDATION AGREEMENT',
    'ASSUMPTION AGREEMENT',
    'WRAP-AROUND MORTGAGE',
    'REVERSE MORTGAGE',
    'CHATTEL MORTGAGE',
    'BLANKET MORTGAGE',
    'OPEN-END MORTGAGE',
    'CONSTRUCTION MORTGAGE',
  ] as const

  export const RELEASE_TYPES = [
    'RELEASE',
    'PARTIAL',
    'SATISFACTION',
  ] as const
  
  export function sortByFiledDate(documents: Document[]): Document[] {
    return documents.sort((a, b) => {
      const dateA = new Date(a.filedDate);
      const dateB = new Date(b.filedDate);
      return dateA.getTime() - dateB.getTime();
    });
  }
  
  // You can add more sorting functions here
  export function sortByFiledDateDescending(documents: Document[]): Document[] {
    return documents.sort((a, b) => {
      const dateA = new Date(a.filedDate);
      const dateB = new Date(b.filedDate);
      return dateB.getTime() - dateA.getTime();
    });
  }


  export function filterByDeeds(documents: Document[]): Document[] {
    return documents.filter(doc => 
      DEED_TYPES.some(deedType => 
        doc.documentType.toUpperCase().includes(deedType)
      )
    );
  }
  
  // Optional: More flexible function that accepts custom deed types
  export function filterByDocumentTypes(
    documents: Document[], 
    types: string[]
  ): Document[] {
    return documents.filter(doc =>
      types.some(type =>
        doc.documentType.toUpperCase().includes(type.toUpperCase())
      )
    );
  }

  export function getMostRecentDeed(documents: Document[]): Document | null {
    const deeds = filterByDeeds(documents);
    
    if (deeds.length === 0) {
      return null;
    }
    
    const sortedDeeds = sortByFiledDateDescending(deeds);
    return sortedDeeds[0];
  }

  // Optional: Get the N most recent deeds
export function getMostRecentDeeds(
    documents: Document[], 
    count: number = 5
  ): Document[] {
    const deeds = filterByDeeds(documents);
    const sortedDeeds = sortByFiledDateDescending(deeds);
    return sortedDeeds.slice(0, count);
  }