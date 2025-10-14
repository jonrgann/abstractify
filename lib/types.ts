import { UIMessage, type LanguageModelUsage} from 'ai';
import { z } from "zod";

export interface WorkflowContext {
  orderInfo?: {
    orderNumber: string,
    sellers: string[],
    borrowers: string[],
    legalDescription: string,
  },
  propertySync?:{
    documentGroupId: string,
    companyId: string,
    orderId: string
  }
}

export interface WorkflowType {
  label: string;
  description?: string
  status: 'active' | 'pending' | 'complete' | 'failed';
  output?: any,
  text?: string,
  reasoning?: string,
  usage?: LanguageModelUsage
}

// Define your custom message type with data part schemas
export type MyUIMessage = UIMessage<
  never, // metadata type
  {
    workflowReadOrder: WorkflowType,
    workflowConnectPropertysync: WorkflowType,
    workflowGeneratePropertySearch: WorkflowType,
    workflowGenerateNameSearch: WorkflowType,
    workflowSearch: WorkflowType,
    workflowSummarize: WorkflowType,
    workflowVesting: WorkflowType,
    workflowResearchComplete: WorkflowType,
    workflowDocuments: WorkflowType,
    searchProperty: {
      input: string;
      output?: any;
      reasoning?: string;
      text?: string;
      status: 'loading' | 'success';
    },
    completedResearch:{
        output?: any;
        status: 'loading' | 'success';
      }
    classifyDocument:{
        input?: any;
        output?: any;
        reasoning?: string;
        usage?: any;
        status: 'loading' | 'success';
    },
    notification:{
      message:string
    },
    readFile:{
      input: string,
      reasoning?: string
      label:string,
      output?: any,
      status: 'loading' | 'complete' | 'error';
    },
    error:{
      message:string,
    },
    workflow:{
      input: string,
      reasoning?: string
      label:string,
      output?: any,
      status: 'loading' | 'complete' | 'error';
    }
    log:{
      id: string,
      message:string
      type?: "info" | "success" | "warning" | "error" 
      url?: string,
    }
  } // data parts type
>;

// General
export interface PropertySyncError {
    message: string;
    status?: number;
    data?: any;
  }
  
  // Authentication
  export interface LoginCredentials {
    email: string;
    password?: string; // Password might be sensitive, consider secure handling
  }
  
  export interface LoginResponse {
    token: string;
  }
  
  // Document Group
  export interface DocumentGroupDetails {
    id: string;
    createdAt: string; // ISO Date string
    updatedAt: string; // ISO Date string
    plantEffectiveDate: string | null; // Date string 'YYYY-MM-DD' or null
    autoCompletesSource: string;
    landValidationsSource: string;
    name: string;
    platInstrumentTypes: string[];
    importComplete: boolean;
  }
  
  // Auto Completes
  export interface AutoComplete {
    id: string;
    type: string;
    value: string;
  }
  
  export interface AutoCompleteFilterParams {
    type?: string;
    search?: string;
  }
  
  // Land Validations
  export interface LandValidation {
    id: string;
    json: any; // Structure varies greatly, using any for flexibility
    type: {
      id: string;
      name: string;
    };
  }
  
  export interface LandValidationFilterParams {
    type?: string;
  }
  
  // Search - Query Params Sub-Interfaces (Based on Documentation Examples)
  export interface RecordingInfo {
    bookType?: string | null;
    book?: string | null;
    page?: string | null;
    instrumentType?: string | null;
    instrumentPage?: string | null; // Not in main example, but possible
    instrumentNumber?: string | null;
    dateFrom?: string | null; // 'YYYY-MM-DD'
    dateTo?: string | null; // 'YYYY-MM-DD'
    fileNumber?: string | null;
    caseNumber?: string | null;
    noteNotContains?: string[]; // Added based on example
  }
  
  export interface Party {
    grantorName?: string | null;
    granteeName?: string | null;
    partyName?: string | null;
    phoneBookNames?: any | null; // Type unknown
    soundexSearch?: string | null; // "1" or null?
    useNicknames?: any | null; // Type unknown
    proximitySearch?: string | null; // "1" or null?
  }
  
  export interface Acreage {
    township?: string | null;
    range?: string | null;
    section?: string | null;
    quarter?: string | null;
    acreageComment?: string | null;
    govLot?: string | null;
    arb?: string | null;
    arbOrNull?: any | null; // Type unknown
    mineralSearch?: any | null; // Type unknown
  }
  
  export interface Subdivision {
    lot?: string | null;
    block?: string | null;
    unit?: string | null;
    addition?: string | null;
    additionDictionarySelected?: any | null; // Type unknown
    additionDictionaryAvailable?: any | null; // Type unknown
    additionDisplayValue?: any | null; // Type unknown
    subdivisionComment?: string | null;
    claim?: string | null;
    miningSurvey?: string | null;
    arb?: string | null;
    mineralSearch?: any | null; // Type unknown
  }
  
  export interface MarketSource {
    marketSource?: string | null;
    minConsideration?: string | null; // Assuming string for currency?
    maxConsideration?: string | null; // Assuming string for currency?
  }
  
  export interface Parcel {
    parcelNumber?: string | null;
  }
  
  export interface Address {
    address?: string | null; // Documentation example uses address1? Using 'address' based on main structure
    address1?: string | null; // From example
    address2?: string | null; // From example
    city?: string | null;
    state?: string | null;
    zipCode?: string | null; // Documentation example uses zip_code? Using zipCode based on main structure
    zip_code?: string | null; // From example
  }
  
  export interface Legal {
    fullTextLegal?: string | null;
    parcel?: string | null; // Parcel object or string? Assuming string
  }
  
  export interface CosSubdivision {
    lot?: string | null;
    block?: string | null;
    cos?: string | null;
    subdivisionComment?: string | null;
  }
  
  export interface EstateLegal {
    estate?: string | null;
    parcel?: string | null;
    quarter?: string | null;
  }
  
  export interface CondoLegal {
    condo?: string | null;
    unit?: string | null;
    building?: string | null;
  }
  
  // Main Search Query Params
  export interface SearchQueryParams {
    excludeRelatedDocuments?: number | string | null; // "1" or 1
    excludeOrders?: number | string | null; // "1" or 1
    giOnly?: any | null; // Type unknown
    enableQueryBefore?: any | null; // Type unknown
    queryBefore?: any | null; // Type unknown
    orderName?: string | null;
    exactLegalSearches?: any | null; // Type unknown
  
    recordingInfos?: RecordingInfo[];
    parties?: Party[];
    acreages?: Acreage[];
    subdivisions?: Subdivision[];
    marketSources?: MarketSource[];
    parcels?: Parcel[];
    addresses?: Address[];
    legals?: Legal[];
    cosSubdivisions?: CosSubdivision[];
    estateLegals?: EstateLegal[];
    condoLegals?: CondoLegal[];
    tags?: string[];
  }
  
  // Search
  export interface SearchRequestBody {
    title?: string;
    queryParams: SearchQueryParams;
  }
  
  export interface SearchResponse {
    id: string; // This is the searchId
    title: string;
  }
  
  // Document Assets
  export interface DocumentAssetInfo {
    id: string;
  }
  export interface DocumentAssetList {
    pdf?: DocumentAssetInfo;
    raw?: DocumentAssetInfo[];
  }
  
  // Document Details
  export interface DocumentDetails {
    id: string;
    image: any;
    json: any; // The structure varies significantly, using 'any' is practical here
    // You might want to define more specific types if you know the structure
    // for your specific document group.
  }
  
  // Orders
  export interface OrderSearchInfo {
    title: string;
    id: string; // searchId associated with the order
  }
  
  export interface Order {
    id: string;
    title: string;
    status: string; // e.g., "open_no_watches", "closed", "waiting_for_watches"
    createdAt: string; // ISO Date string or "YYYY-MM-DD HH:MM:SS"
    updatedAt: string; // ISO Date string or "YYYY-MM-DD HH:MM:SS"
    closedAt: string | null; // ISO Date string or "YYYY-MM-DD HH:MM:SS" or null
    falloutUpdatedTo: string | null; // ISO Date string or "YYYY-MM-DD HH:MM:SS" or null
    searches: OrderSearchInfo[] | null;
  }
  
  export interface CreateOrderRequest {
    title: string;
    searchID: string; // The ID from the initial search response
  }
  
  export interface AddSearchToOrderRequest {
    title?: string; // Optional title for the search tab
    searchID: string;
  }
  
  // Batches
  export interface CreateBatchRequest {
    name: string;
    searchId?: string; // Optional: ID of a search to pre-fill the batch
    documents: [any];
  }
  
  export interface BatchCreationResponse {
    id: string; // The batchId
  }
  
  // Represents a document within a batch structure
  export interface BatchDocument {
    id?: string; // Optional: PropertySync ID (for updates)
    imageUrl?: string; // Optional: URL for image import/update
    indexingRecordId?: string; // Optional: External system ID (for updates/syncing)
    json: any; // The core document data, structure varies
  }
  
  export interface UpdateBatchRequest {
    name?: string; // Optional: New name for the batch
    documents?: BatchDocument[]; // Optional: Documents to add/update in the batch
    imageRoot?: string; // Optional: Base URL for imageUrls in documents
  }
  
  export interface BatchDetails {
    id: string;
    documentGroupId: string;
    createdAt: string; // ISO Date string
    updatedAt: string; // ISO Date string
    name: string;
    createdBy: string;
    lastModifiedBy: string;
    lastModifiedAt: string; // "YYYY-MM-DD HH:MM:SS"
    numOfDocs: number;
    numOfCompletedDocs: number;
    recordedDate: string | null; // Assuming string date or null
    rawFileGroupType: string; // UUID?
  }
  
  export interface ExportBatchRequest {
    exportTo: "propertySync"; // Only documented value
    batchId: string;
  }
  
  // Auto Complete Batch Structure
  export interface AutoCompleteBatchItem {
    type: string;
    value: string;
  }
  export interface AutoCompleteBatchRequest {
    autocompletes: AutoCompleteBatchItem[];
  }
  
  // Land Validation Batch Structure
  export interface LandValidationBatchItem {
    id?: string; // Optional for updates
    json: any; // Core land validation data
    type: {
      id: string;
      name: string;
    };
  }
  export interface LandValidationBatchRequest {
    landvalidations: LandValidationBatchItem[];
  }

export const SubdivisionLegalSchema = z
  .object({
      lot: z
      .object({
          rangeMin: z.string(),
          rangeMax: z.string(),
      })
      .array(),
      block: z
      .object({
          rangeMin: z.string(),
          rangeMax: z.string(),
      })
      .array(),
      addition: z.string().nullable(),
  })
  .array();

export type SubdivisionLegalType = z.infer<typeof SubdivisionLegalSchema>; 

  // interface SubdivisionLegal{
  //   lot: [{ rangeMin: string, rangeMax: string }];
  //   block: [{ rangeMin: string, rangeMax: string }];
  //   addition: string | null
  // }

  // interface AcreageLegal{
  //   quarters: string | null;
  //   section: string | null;
  //   township: string | null;
  //   range: string | null;
  // }

  export interface SearchResultDocument {
    documentId: string;
    searchId: string;
    plantId: string;
    orderId: string;
    filedDate: string;
    isExpanded: boolean;
    isFallout: boolean;
    isFlagged: boolean;
    isFuzzyMatch: boolean;
    canBeInFinalChain: boolean;
    isInFinalChain: boolean;
    isStruckOut: boolean;
    hasImage: boolean;
    hasNote: boolean;
    note: string;
    bestGrantor: string;
    bestGrantee: string;
    legalHeader: string;
    documentNumber: string;
    bookType: string;
    bookNumber: string;
    pageNumber: string;
    documentType: string;
    pageNumberSort: string;
    bookNumberSort: string;
    documentNumberSort: string;
    isRelated: boolean;
    relatedToResultId: string | null;
    details: any;
    isNewAddition: number;
    firstAndLastName: string;
    falloutDate: string | null;
    documentNotes: string;
  }

  export interface Document {
    documentId: string;
    documentNumber: string;
    filedDate: string;
    documentType: string;
    grantor: string;
    grantee: string;
    legal: string;
  }
  
  export type SearchResults = SearchResultDocument[];