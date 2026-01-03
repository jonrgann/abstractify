import { StepMetadata, StepCategory } from '../types/visual-workflow';

/**
 * Complete metadata for all available workflow steps
 * Grouped by category for palette display
 */
export const STEP_METADATA: Record<string, StepMetadata> = {
  // Authentication
  getPropertySyncBearerToken: {
    name: 'Login to PropertySync',
    description: 'Authenticate with PropertySync API and obtain bearer token',
    category: 'Authentication',
    functionName: 'getPropertySyncBearerToken',
    parameters: []
  },

  // Search Operations
  searchPropertySync: {
    name: 'Search PropertySync',
    description: 'Search for documents in PropertySync using query parameters',
    category: 'Search',
    functionName: 'searchPropertySync',
    parameters: [
      { name: 'documentGroupId', type: 'string', required: true, description: 'Document group/plant ID' },
      { name: 'token', type: 'string', required: true, description: 'Bearer token from authentication' },
      { name: 'query', type: 'object', required: true, description: 'Search query with queryParams and subdivisions' }
    ]
  },

  getSubdivisions: {
    name: 'Get Subdivisions',
    description: 'Retrieve list of available subdivisions from PropertySync',
    category: 'Search',
    functionName: 'getSubdivisions',
    parameters: [
      { name: 'documentGroupId', type: 'string', required: true, description: 'Document group/plant ID' },
      { name: 'token', type: 'string', required: true, description: 'Bearer token from authentication' }
    ]
  },

  generateSearchQueries: {
    name: 'Generate Search Queries',
    description: 'Generate search queries from legal description text',
    category: 'Search',
    functionName: 'generateSearchQueries',
    parameters: [
      { name: 'legalDescription', type: 'string', required: true, description: 'Legal description text to parse' }
    ]
  },

  selectSubdivision: {
    name: 'Select Subdivision',
    description: 'Match addition name to subdivision from list',
    category: 'Search',
    functionName: 'selectSubdivision',
    parameters: [
      { name: 'additionName', type: 'string', required: true, description: 'Name of the addition to find' },
      { name: 'subdivisionList', type: 'array', required: true, description: 'List of available subdivisions' }
    ]
  },

  // Results Retrieval
  retrieveResults: {
    name: 'Retrieve Search Results',
    description: 'Get search results from PropertySync search ID',
    category: 'Results',
    functionName: 'retrieveResults',
    parameters: [
      { name: 'documentGroupId', type: 'string', required: true, description: 'Document group/plant ID' },
      { name: 'token', type: 'string', required: true, description: 'Bearer token from authentication' },
      { name: 'searchId', type: 'string', required: true, description: 'Search ID from previous search' }
    ]
  },

  retrieveDocumentIds: {
    name: 'Retrieve Document IDs',
    description: 'Extract document IDs from search results',
    category: 'Results',
    functionName: 'retrieveDocumentIds',
    parameters: [
      { name: 'documentGroupId', type: 'string', required: true, description: 'Document group/plant ID' },
      { name: 'token', type: 'string', required: true, description: 'Bearer token from authentication' },
      { name: 'searchId', type: 'string', required: true, description: 'Search ID from previous search' }
    ]
  },

  getDocumentDetails: {
    name: 'Get Document Details',
    description: 'Fetch detailed information for a specific document',
    category: 'Results',
    functionName: 'getDocumentDetails',
    parameters: [
      { name: 'documentGroupId', type: 'string', required: true, description: 'Document group/plant ID' },
      { name: 'token', type: 'string', required: true, description: 'Bearer token from authentication' },
      { name: 'documentId', type: 'string', required: true, description: 'Document ID to retrieve' }
    ]
  },

  getPlantDetails: {
    name: 'Get Plant Details',
    description: 'Retrieve plant/document group metadata',
    category: 'Results',
    functionName: 'getPlantDetails',
    parameters: [
      { name: 'documentGroupId', type: 'string', required: true, description: 'Document group/plant ID' },
      { name: 'token', type: 'string', required: true, description: 'Bearer token from authentication' }
    ]
  },

  // Data Processing
  extractOrderInfo: {
    name: 'Extract Order Info',
    description: 'Extract order information from URL or document',
    category: 'Processing',
    functionName: 'extractOrderInfo',
    parameters: [
      { name: 'url', type: 'string', required: true, description: 'URL to extract order info from' }
    ]
  },

  getVestingInfo: {
    name: 'Get Vesting Info',
    description: 'Extract vesting information from deed document',
    category: 'Processing',
    functionName: 'getVestingInfo',
    parameters: [
      { name: 'deed', type: 'object', required: true, description: 'Deed document object' }
    ]
  },

  // Output Generation
  generateHTML: {
    name: 'Generate HTML',
    description: 'Generate HTML output from data',
    category: 'Output',
    functionName: 'generateHTML',
    parameters: [
      { name: 'data', type: 'object', required: true, description: 'Data to convert to HTML' }
    ]
  },

  generatePDF: {
    name: 'Generate PDF',
    description: 'Generate PDF report from data',
    category: 'Output',
    functionName: 'generatePDF',
    parameters: [
      { name: 'report', type: 'object', required: true, description: 'Report data to convert to PDF' }
    ]
  },

  uploadToSupabase: {
    name: 'Upload to Supabase',
    description: 'Upload file to Supabase storage',
    category: 'Output',
    functionName: 'uploadToSupabase',
    parameters: [
      { name: 'file', type: 'object', required: true, description: 'File object to upload (Buffer or path)' },
      { name: 'options', type: 'object', required: true, description: 'Upload options (bucket, path, contentType)' }
    ]
  },

  sendEmail: {
    name: 'Send Email',
    description: 'Send email notification',
    category: 'Output',
    functionName: 'sendEmail',
    parameters: [
      { name: 'fromEmail', type: 'string', required: true, description: 'Sender email address' },
      { name: 'toEmail', type: 'string', required: true, description: 'Recipient email address' },
      { name: 'subject', type: 'string', required: true, description: 'Email subject line' },
      { name: 'html', type: 'string', required: true, description: 'Email body HTML content' }
    ]
  }
};

/**
 * Get categorized steps for palette display
 */
export function getStepCategories(): StepCategory[] {
  const categories = new Map<string, StepMetadata[]>();

  // Group steps by category
  Object.values(STEP_METADATA).forEach(step => {
    if (!categories.has(step.category)) {
      categories.set(step.category, []);
    }
    categories.get(step.category)!.push(step);
  });

  // Convert to array format
  return Array.from(categories.entries()).map(([name, steps]) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    steps: steps.sort((a, b) => a.name.localeCompare(b.name))
  }));
}

/**
 * Get metadata for a specific step function
 */
export function getStepMetadata(functionName: string): StepMetadata | undefined {
  return STEP_METADATA[functionName];
}

/**
 * Get all available step function names
 */
export function getAvailableSteps(): string[] {
  return Object.keys(STEP_METADATA);
}

/**
 * Check if a step has required parameters
 */
export function hasRequiredParameters(functionName: string): boolean {
  const metadata = STEP_METADATA[functionName];
  return metadata ? metadata.parameters.some(p => p.required) : false;
}
