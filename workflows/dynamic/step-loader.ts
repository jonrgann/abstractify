import { FatalError } from 'workflow';

// Map of available step functions with their dynamic imports
const STEP_FUNCTIONS_MAP: Record<string, () => Promise<any>> = {
  'getPropertySyncBearerToken': () => import('@/workflows/steps/login-propertysync').then(m => m.getPropertySyncBearerToken),
  'searchPropertySync': () => import('@/workflows/steps/search').then(m => m.searchPropertySync),
  'extractOrderInfo': () => import('@/workflows/steps/extract-order-info').then(m => m.extractOrderInfo),
  'getSubdivisions': () => import('@/workflows/steps/get-subdivisions').then(m => m.getSubdivisions),
  'generateSearchQueries': () => import('@/workflows/steps/generate-search-queries').then(m => m.generateSearchQueries),
  'selectSubdivision': () => import('@/workflows/steps/select-subdivision').then(m => m.selectSubdivision),
  'retrieveResults': () => import('@/workflows/steps/retrieve-results').then(m => m.retrieveResults),
  'retrieveDocumentIds': () => import('@/workflows/steps/retrieve-document-ids').then(m => m.retrieveDocumentIds),
  'getDocumentDetails': () => import('@/workflows/steps/get-document-details').then(m => m.getDocumentDetails),
  'getPlantDetails': () => import('@/workflows/steps/get-plant-details').then(m => m.getPlantDetails),
  'getVestingInfo': () => import('@/workflows/steps/get-vesting-info').then(m => m.getVestingInfo),
  'generatePDF': () => import('@/workflows/steps/generate-pdf').then(m => m.generatePDF),
  'generateHTML': () => import('@/workflows/steps/generate-html').then(m => m.generateHTML),
  'uploadToSupabase': () => import('@/workflows/steps/upload-file').then(m => m.uploadToSupabase),
  'sendEmail': () => import('@/workflows/steps/send-email').then(m => m.sendEmail),
};

// Parameter signatures for each step function (positional order matters)
const STEP_SIGNATURES: Record<string, string[]> = {
  'getPropertySyncBearerToken': [],
  'searchPropertySync': ['documentGroupId', 'token', 'query'],
  'uploadToSupabase': ['file', 'options'],
  'extractOrderInfo': ['url'],
  'getSubdivisions': ['documentGroupId', 'token'],
  'generateSearchQueries': ['legalDescription'],
  'selectSubdivision': ['additionName', 'subdivisionList'],
  'retrieveResults': ['documentGroupId', 'token', 'searchId'],
  'retrieveDocumentIds': ['documentGroupId', 'token', 'searchId'],
  'getDocumentDetails': ['documentGroupId', 'token', 'documentId'],
  'getPlantDetails': ['documentGroupId', 'token'],
  'getVestingInfo': ['deed'],
  'generatePDF': ['report'],
  'generateHTML': ['data'],
  'sendEmail': ['fromEmail', 'toEmail', 'subject', 'html']
};

export async function loadStepFunction(stepFunctionName: string): Promise<Function> {
  const loader = STEP_FUNCTIONS_MAP[stepFunctionName];

  if (!loader) {
    throw new FatalError(
      `Step function '${stepFunctionName}' not found. Available functions: ${Object.keys(STEP_FUNCTIONS_MAP).join(', ')}`
    );
  }

  try {
    return await loader();
  } catch (error) {
    throw new FatalError(`Failed to load step function '${stepFunctionName}': ${error}`);
  }
}

export function convertParamsToArgs(
  stepFunction: string,
  params: Record<string, any>
): any[] {
  const signature = STEP_SIGNATURES[stepFunction];

  if (!signature) {
    throw new FatalError(`Unknown step function: ${stepFunction}`);
  }

  // Convert named params to positional args based on signature
  return signature.map(paramName => params[paramName]);
}

export function getAvailableSteps(): string[] {
  return Object.keys(STEP_FUNCTIONS_MAP);
}
