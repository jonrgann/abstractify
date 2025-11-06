export interface Document {
    documentId: string;
    documentNumber: string;
    filedDate: string;
    documentType: string;
    grantors: string[];
    grantees: string[];
    related?: any;
    amount?: string
  }
  
  
  export interface NameObject {
    nameLast: string | null;
    nameType: string | null;
    nameFirst: string | null;
    nameMiddle: string | null;
  }
  
  export interface TitlePeriod {
    name: string;
    startDate: string;
    endDate: string | null; // null means they still hold title
    acquiredBy: string; // documentNumber where they acquired title
    conveyedBy: string | null; // documentNumber where they conveyed title (null if still in title)
  }
  
  export function formatFullName(name: NameObject): string {
  const parts = [
    name.nameFirst,
    name.nameMiddle,
    name.nameLast
  ].filter(part => part !== null && part !== undefined && part.trim() !== '');
  
  return parts.join(' ');
  }

  export function createNameSearchQuery(name: NameObject): string {
    const parts: string[] = [];
    
    if (name.nameFirst) {
      parts.push(name.nameFirst);
    }
    
    if (name.nameLast) {
      parts.push(name.nameLast);
    }
    
    return parts.join(' ').trim();
  }
  
  
  export const DEED_TYPES = [
    'SPECIAL WD',
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
        doc.documentType.toUpperCase() === deedType
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
        doc.documentType.toUpperCase() === type.toUpperCase()
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
  
  
  
  /**
   * Determines which names are still in title by processing deed documents in chronological order.
   * 
   * Logic:
   * - Grantees receive title (added to current owners)
   * - Grantors convey title (removed from current owners)
   * - Documents are processed in order by filedDate
   * 
   * @param documents - Array of deed documents to process
   * @returns Array of formatted names currently in title
   */
  export function determineNamesInTitle(documents: Document[]): string[] {
    // Filter documents by deeds transfering ownership
    const deeds = filterByDeeds(documents);
    // Sort documents by filed date (oldest first)
    const sortedDocs = [...deeds].sort((a, b) => 
        new Date(a.filedDate).getTime() - new Date(b.filedDate).getTime()
    );
  
    // Track current owners using a Set for efficient lookups
    const currentOwners = new Set<string>();

    // Seed initial owners from first deed's grantors
    if (sortedDocs.length > 0) {
      for (const grantor of sortedDocs[0].grantors) {
          const name =grantor;
          if (name) currentOwners.add(name);
      }
    }
  
    // Process each document in chronological order
    for (const doc of sortedDocs) {
        // Add grantees (they're receiving title)
        for (const grantee of doc.grantees) {
            const granteeName = grantee// formatFullName(grantee);
            if (granteeName) {
                currentOwners.add(granteeName);
            }
        }
        // Remove grantors (they're conveying their interest away)
        for (const grantor of doc.grantors) {
            const grantorName = grantor; //formatFullName(grantor);
            if (grantorName) {
                console.log(`removing grantor: ${grantorName}`)
                currentOwners.delete(grantorName);
            }
        }
    }
  
    // Return sorted array of current owners
    return Array.from(currentOwners).sort();
    
  }

  /**
 * Determines which names are still in title by processing deed documents in chronological order.
 * 
 * @param documents - Array of deed documents to process
 * @returns Array of formatted names currently in title
 */
export function determineNamesInTitleFromChain(documents: Document[]): TitlePeriod[] {
  const chainOfTitle = createChainOfTitle(documents);
  
  // Filter for names that still hold title (endDate is null)
  return chainOfTitle
    .filter(period => period.endDate === null).sort();
}
  
  /**
   * Creates a chain of title showing when each person held title to the property.
   * 
   * @param documents - Array of deed documents to process
   * @returns Array of title periods for each person who has held title
   */
  export function createChainOfTitle(documents: Document[]): TitlePeriod[] {
    // Filter documents by deeds transfering ownership
    const deeds = filterByDeeds(documents);
    // Sort documents by filed date (oldest first)
    const sortedDocs = [...deeds].sort((a, b) => 
      new Date(a.filedDate).getTime() - new Date(b.filedDate).getTime()
    );
  
    // Track title periods for each name
    const titlePeriods = new Map<string, TitlePeriod>();
    
    // Track who currently holds title
    const currentOwners = new Set<string>();
  
    // Process each document in chronological order
    for (const doc of sortedDocs) {
      // First, remove grantors (they're conveying their interest away)
      for (const grantor of doc.grantors) {
        const grantorName = grantor; //formatFullName(grantor);
        if (grantorName) {
          // If grantor is not in our records, they must have held title before our earliest document
          if (!titlePeriods.has(grantorName)) {
            titlePeriods.set(grantorName, {
              name: grantorName,
              startDate: '', // or could use earliest doc date
              endDate: doc.filedDate,
              acquiredBy: '',
              conveyedBy: doc.documentNumber
            });
          } else if (currentOwners.has(grantorName)) {
            currentOwners.delete(grantorName);
            
            // Update the title period to set the end date
            const period = titlePeriods.get(grantorName);
            if (period && period.endDate === null) {
              period.endDate = doc.filedDate;
              period.conveyedBy = doc.documentNumber;
            }
          }
        }
      }
  
      // Then, add grantees (they're receiving title)
      for (const grantee of doc.grantees) {
        const granteeName = grantee;// formatFullName(grantee);
        if (granteeName) {
          currentOwners.add(granteeName);
          
          // Create or update title period for this grantee
          if (!titlePeriods.has(granteeName)) {
            titlePeriods.set(granteeName, {
              name: granteeName,
              startDate: doc.filedDate,
              endDate: null,
              acquiredBy: doc.documentNumber,
              conveyedBy: null
            });
          } else {
            // If they previously held title and conveyed it, create a new period
            const existingPeriod = titlePeriods.get(granteeName)!;
            if (existingPeriod.endDate !== null) {
              // They're reacquiring title - we need to handle multiple periods
              // For now, we'll update the map key to include an index
              let index = 2;
              let uniqueKey = `${granteeName}_${index}`;
              while (titlePeriods.has(uniqueKey)) {
                index++;
                uniqueKey = `${granteeName}_${index}`;
              }
              titlePeriods.set(uniqueKey, {
                name: granteeName,
                startDate: doc.filedDate,
                endDate: null,
                acquiredBy: doc.documentNumber,
                conveyedBy: null
              });
            }
          }
        }
      }
    }
  
    // Convert to array and sort by start date
    return Array.from(titlePeriods.values()).sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }
  
  export interface TitleGap {
    type: 'gap' | 'unknown_origin' | 'overlap';
    description: string;
    startDate: string;
    endDate: string;
    previousOwner?: string;
    nextOwner?: string;
    documentNumber?: string;
  }
  
  /**
   * Identifies gaps and issues in the chain of title.
   * 
   * Detects:
   * - Gaps: Periods where no one held title
   * - Unknown origins: Grantors who conveyed title without acquisition records
   * - Overlaps: Multiple people holding title simultaneously (potential issue)
   * 
   * @param documents - Array of deed documents to process
   * @returns Array of title gaps and issues found
   */
  export function findTitleGaps(documents: Document[]): TitleGap[] {
    const chainOfTitle = createChainOfTitle(documents);
    const gaps: TitleGap[] = [];
    
    // Check for unknown origins (people who granted without receiving)
    for (const period of chainOfTitle) {
      if (period.startDate === 'UNKNOWN') {
        gaps.push({
          type: 'unknown_origin',
          description: `${period.name} conveyed title without a record of acquisition`,
          startDate: 'UNKNOWN',
          endDate: period.endDate || 'present',
          previousOwner: period.name,
          documentNumber: period.conveyedBy || undefined
        });
      }
    }
    
    // Sort periods by start date to check for gaps
    const sortedPeriods = chainOfTitle
      .filter(p => p.startDate !== 'UNKNOWN')
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    // Check for time gaps between consecutive ownership periods
    for (let i = 0; i < sortedPeriods.length - 1; i++) {
      const current = sortedPeriods[i];
      const next = sortedPeriods[i + 1];
      
      // If current owner has an end date, check if there's a gap before next owner
      if (current.endDate) {
        const currentEndTime = new Date(current.endDate).getTime();
        const nextStartTime = new Date(next.startDate).getTime();
        
        // If next owner started after current owner ended, there's a gap
        if (nextStartTime > currentEndTime) {
          gaps.push({
            type: 'gap',
            description: `Gap in title between ${current.name} and ${next.name}`,
            startDate: current.endDate,
            endDate: next.startDate,
            previousOwner: current.name,
            nextOwner: next.name
          });
        }
        
        // If next owner started before current owner ended, there's an overlap
        if (nextStartTime < currentEndTime) {
          gaps.push({
            type: 'overlap',
            description: `Title overlap between ${current.name} and ${next.name}`,
            startDate: next.startDate,
            endDate: current.endDate,
            previousOwner: current.name,
            nextOwner: next.name
          });
        }
      }
    }
    
    // Check for multiple current owners (could be legitimate joint ownership or an issue)
    const currentOwners = chainOfTitle.filter(p => p.endDate === null);
    if (currentOwners.length > 2) {
      // More than 2 current owners might indicate an issue (though joint ownership is common)
      const ownerNames = currentOwners.map(o => o.name).join(', ');
      gaps.push({
        type: 'overlap',
        description: `Multiple parties currently hold title: ${ownerNames}`,
        startDate: currentOwners[currentOwners.length - 1].startDate,
        endDate: 'present'
      });
    }
    
    return gaps;
  }

  export function getLatestDeed(documents: Document[]){
    const deeds = filterByDeeds(documents);
    // Sort deeds by filedDate in descending order (latest first)
      const sortedDeeds = deeds.sort((a, b) => {
        const dateA = new Date(a.filedDate).getTime();
        const dateB = new Date(b.filedDate).getTime();
        return dateB - dateA; // descending order
      });
  
    return sortedDeeds[0];
  }

