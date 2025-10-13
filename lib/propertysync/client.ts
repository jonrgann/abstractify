// Import types from a local file (assuming the types are the same)
import * as T from "../types"
const DEFAULT_BASE_URL = "https://api.propertysync.com/";

export class PropertySyncClient {
  private authToken: string | null = null;
  public readonly baseUrl: string;

  constructor(baseURL: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseURL;
  }

  private async fetch<T>(
    path: string,
    options: RequestInit = {},
    responseType: "json" | "arraybuffer" = "json"
  ): Promise<T> {
      // Remove leading slash if present to prevent URL constructor from treating it as absolute
    const url = new URL(path, this.baseUrl).toString();
    const headers = new Headers(options.headers || {});

    // Set default headers if not already set
    if (!headers.has("Content-Type") && options.method !== "GET") {
      headers.set("Content-Type", "application/json");
    }
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    // Add auth token if available and not a login request
    if (this.authToken && !path.endsWith("/login")) {
      headers.set("Authorization", `Bearer ${this.authToken}`);
    }

    const fetchOptions: RequestInit = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        const errorResponse: T.PropertySyncError = {
          message: response.statusText,
          status: response.status,
          data: await response.json().catch(() => ({}))
        };
        console.error("PropertySync API Error:", errorResponse);
        throw errorResponse;
      }

      if (responseType === "arraybuffer") {
        return await response.arrayBuffer() as unknown as T;
      }
      
      return await response.json() as T;
    } catch (error) {
      if (error instanceof Error) {
        const errorResponse: T.PropertySyncError = {
          message: error.message,
          status: undefined,
          data: undefined
        };
        console.error("PropertySync API Error:", errorResponse);
        throw errorResponse;
      }
      throw error;
    }
  }

  /**
   * Sets the authentication token manually. Useful if the token is obtained elsewhere.
   * @param token The bearer token.
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clears the authentication token.
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Checks if the client has an authentication token set.
   */
  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  // --- Authentication ---

  /**
   * Authenticates with the API to get a bearer token.
   * @param credentials User email and password.
   * @returns The login response containing the token.
   */
  async login(credentials: T.LoginCredentials): Promise<T.LoginResponse> {
    const response = await this.fetch<T.LoginResponse>("/v1/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });

    if (response.token) {
      this.authToken = response.token;
    }
    return response;
  }

  // --- Document Groups ---

  /**
   * Retrieves details about a specific document group.
   * @param documentGroupId The UUID of the document group.
   * @returns Details of the document group.
   */
  async getDocumentGroupDetails(documentGroupId: string): Promise<T.DocumentGroupDetails> {
    return await this.fetch<T.DocumentGroupDetails>(`/v1/indexing/document-groups/${documentGroupId}`);
  }

  // --- Auto Completes ---

  /**
   * Retrieves a list of autocomplete values for a document group.
   * @param documentGroupId The UUID of the document group.
   * @param params Optional filters for type and search query.
   * @returns An array of autocomplete objects.
   */
  async getAutoCompletes(documentGroupId: string, params?: T.AutoCompleteFilterParams): Promise<T.AutoComplete[]> {
    const queryParams = params ? new URLSearchParams(params as any).toString() : "";
    const endpoint = `/v1/indexing/document-groups/${documentGroupId}/auto-completes/${queryParams ? '?' + queryParams : ''}`;
    return await this.fetch<T.AutoComplete[]>(endpoint);
  }

  // --- Land Validations ---

  /**
   * Retrieves a list of land validation values for a document group.
   * @param documentGroupId The UUID of the document group.
   * @param params Optional filters for type.
   * @returns An array of land validation objects.
   */
  async getLandValidations(documentGroupId: string, params?: T.LandValidationFilterParams): Promise<T.LandValidation[]> {
    const queryParams = params ? new URLSearchParams(params as any).toString() : "";
    const endpoint = `/v1/indexing/document-groups/${documentGroupId}/land-validations/${queryParams ? '?' + queryParams : ''}`;
    return await this.fetch<T.LandValidation[]>(endpoint);
  }
  
    /**
   * Retrieves plat validations using identifiers for a document group.
   * @param documentGroupId The UUID of the document group.
   * @param identifiers Object containing identifier key-value pairs (e.g., { addition: "value" }).
   * @param currentValidationId Optional current validation ID parameter.
   * @returns An array of plat validation objects.
   */
    async getPlatValidations(documentGroupId: string, identifiers: Record<string, string>, currentValidationId?: string): Promise<T.LandValidation[]> {
      const queryParams = currentValidationId ? `?currentValidationId=${encodeURIComponent(currentValidationId)}` : "";
      
      // This endpoint uses a different base URL
      const fullUrl = `https://indexing-api.cloud.propertysync.com/indexing/document-groups/${documentGroupId}/land-validation-identifiers${queryParams}`;
      const headers = new Headers();
      
      // Set default headers
      headers.set("Content-Type", "application/json");
      headers.set("Accept", "application/json");
      
      // Add auth token if available
      if (this.authToken) {
        headers.set("Authorization", `Bearer ${this.authToken}`);
      }
  
      const fetchOptions: RequestInit = {
        method: "POST",
        headers,
        body: JSON.stringify({ identifiers })
      };
  
      try {
        const response = await fetch(fullUrl, fetchOptions);
        if (!response.ok) {
          const errorResponse: T.PropertySyncError = {
            message: response.statusText,
            status: response.status,
            data: await response.json().catch(() => ({}))
          };
          console.error("PropertySync API Error:", errorResponse);
          throw errorResponse;
        }
        
        return await response.json() as T.LandValidation[];
      } catch (error) {
        if (error instanceof Error) {
          const errorResponse: T.PropertySyncError = {
            message: error.message,
            status: undefined,
            data: undefined
          };
          console.error("PropertySync API Error:", errorResponse);
          throw errorResponse;
        }
        throw error;
      }
    }

  // --- Searches ---

  /**
   * Initiates a document search within a specific document group.
   * @param documentGroupId The UUID of the document group.
   * @param body The search parameters.
   * @returns The search response containing the search ID.
   */
  async searchDocuments(documentGroupId: string, body: T.SearchRequestBody): Promise<T.SearchResponse> {
    return await this.fetch<T.SearchResponse>(`/v1/search/document-groups/${documentGroupId}/searches`, {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  /**
   * Retrieves the document IDs resulting from a specific search.
   * @param documentGroupId The UUID of the document group.
   * @param searchId The ID of the search previously initiated.
   * @returns An array of document UUIDs.
   */
  async getSearchResults(documentGroupId: string, searchId: string): Promise<string[]> {
    return await this.fetch<string[]>(`/v1/search/document-groups/${documentGroupId}/searches/${searchId}/document-ids`);
  }

  async retrieveResults(documentGroupId: string, searchId: string): Promise<T.SearchResults> {
    return await this.fetch(`/v1/search/document-groups/${documentGroupId}/searches/${searchId}/results`);
  }

  // --- Document Assets ---

  /**
   * Lists available assets (e.g., PDF, raw images) for a specific document.
   * @param documentGroupId The UUID of the document group.
   * @param documentId The UUID of the document.
   * @returns An object listing available asset types and their IDs.
   */
  async listDocumentAssets(documentGroupId: string, documentId: string): Promise<T.DocumentAssetList> {
    return await this.fetch<T.DocumentAssetList>(`/v1/indexing/document-groups/${documentGroupId}/documents/${documentId}/assets`);
  }

  /**
   * Retrieves the raw binary data for a specific document asset.
   * @param documentGroupId The UUID of the document group.
   * @param documentId The UUID of the document.
   * @param assetId The UUID of the asset.
   * @returns The raw asset data as ArrayBuffer.
   */
  async getDocumentAsset(documentGroupId: string, documentId: string, assetId: string): Promise<ArrayBuffer> {
    return await this.fetch<ArrayBuffer>(
      `/v1/indexing/document-groups/${documentGroupId}/documents/${documentId}/assets/${assetId}`,
      {},
      "arraybuffer"
    );
  }

  // --- Document Details ---

  /**
   * Retrieves the detailed index information for a specific document.
   * @param documentGroupId The UUID of the document group.
   * @param documentId The UUID of the document.
   * @returns The document details object.
   */
  async getDocumentDetails(documentGroupId: string, documentId: string): Promise<T.DocumentDetails> {
    return await this.fetch<T.DocumentDetails>(`/v1/indexing/document-groups/${documentGroupId}/documents/${documentId}`);
  }

  // --- Orders ---

  /**
   * Creates a new order associated with a specific company and document group.
   * @param documentGroupId The UUID of the document group.
   * @param companyId The ID of the company.
   * @param body The order creation details (title and initial search ID).
   * @returns The details of the newly created order.
   */
  async createOrder(documentGroupId: string, companyId: string, body: T.CreateOrderRequest): Promise<T.Order> {
    return await this.fetch<T.Order>(`/v1/search/document-groups/${documentGroupId}/companies/${companyId}/orders`, {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  /**
   * Lists all orders for a specific company within a document group.
   * @param documentGroupId The UUID of the document group.
   * @param companyId The ID of the company.
   * @returns An array of order objects.
   */
  async listOrders(documentGroupId: string, companyId: string): Promise<T.Order[]> {
    return await this.fetch<T.Order[]>(`/v1/search/document-groups/${documentGroupId}/companies/${companyId}/orders`);
  }

  /**
   * Retrieves details for a specific order.
   * @param documentGroupId The UUID of the document group.
   * @param companyId The ID of the company.
   * @param orderId The ID of the order.
   * @returns The details of the specified order.
   */
  async getOrderDetails(documentGroupId: string, companyId: string, orderId: string): Promise<T.Order> {
    return await this.fetch<T.Order>(`/v1/search/document-groups/${documentGroupId}/companies/${companyId}/orders/${orderId}`);
  }

  /**
   * Adds a search result (tab) to an existing order.
   * @param documentGroupId The UUID of the document group.
   * @param companyId The ID of the company.
   * @param orderId The ID of the order to modify.
   * @param body Details of the search to add (search ID and optional title).
   * @returns The updated order details.
   */
  async addSearchToOrder(documentGroupId: string, companyId: string, orderId: string, body: T.AddSearchToOrderRequest): Promise<void> {
    await this.fetch<void>(`/v1/search/document-groups/${documentGroupId}/companies/${companyId}/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  }

  /**
   * Closes an existing order.
   * @param documentGroupId The UUID of the document group.
   * @param companyId The ID of the company.
   * @param orderId The ID of the order to close.
   * @returns The details of the closed order.
   */
  async closeOrder(documentGroupId: string, companyId: string, orderId: string): Promise<T.Order> {
    return await this.fetch<T.Order>(`/v1/search/document-groups/${documentGroupId}/companies/${companyId}/orders/${orderId}/close`, {
      method: "POST"
    });
  }

  /**
   * Re-opens a previously closed order.
   * @param documentGroupId The UUID of the document group.
   * @param companyId The ID of the company.
   * @param orderId The ID of the order to re-open.
   * @returns The details of the re-opened order.
   */
  async reopenOrder(documentGroupId: string, companyId: string, orderId: string): Promise<T.Order> {
    return await this.fetch<T.Order>(`/v1/search/document-groups/${documentGroupId}/companies/${companyId}/orders/${orderId}/re-open`, {
      method: "POST"
    });
  }

  // --- Batches ---

  /**
   * Creates a new document batch.
   * @param documentGroupId The UUID of the document group.
   * @param body The batch creation details (name and optional search ID).
   * @returns The response containing the ID of the newly created batch.
   */
  async createBatch(documentGroupId: string, body: T.CreateBatchRequest): Promise<T.BatchCreationResponse> {
    return await this.fetch<T.BatchCreationResponse>(`/v1/indexing/document-groups/${documentGroupId}/batches`, {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  /**
   * Updates an existing batch (e.g., rename, add/update documents).
   * @param documentGroupId The UUID of the document group.
   * @param batchId The ID of the batch to update.
   * @param body The update data (new name, documents, imageRoot).
   * @returns void (API response not specified).
   */
  async updateBatch(documentGroupId: string, batchId: string, body: T.UpdateBatchRequest): Promise<void> {
    await this.fetch<void>(`/v1/indexing/document-groups/${documentGroupId}/batches/${batchId}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  }

  /**
   * Retrieves details for a single batch.
   * @param documentGroupId The UUID of the document group.
   * @param batchId The ID of the batch.
   * @returns The details of the batch.
   */
  async getBatchDetails(documentGroupId: string, batchId: string): Promise<T.BatchDetails> {
    return await this.fetch<T.BatchDetails>(`/v1/indexing/document-groups/${documentGroupId}/batches/${batchId}`);
  }

  /**
   * Retrieves a list of all batches within a document group.
   * @param documentGroupId The UUID of the document group.
   * @returns An array of batch detail objects.
   */
  async listBatches(documentGroupId: string): Promise<T.BatchDetails[]> {
    return await this.fetch<T.BatchDetails[]>(`/v1/indexing/document-groups/${documentGroupId}/batches`);
  }

  /**
   * Deletes a specific batch.
   * @param documentGroupId The UUID of the document group.
   * @param batchId The ID of the batch to delete.
   * @returns void (API response not specified).
   */
  async deleteBatch(documentGroupId: string, batchId: string): Promise<void> {
    await this.fetch<void>(`/v1/indexing/document-groups/${documentGroupId}/batches/${batchId}`, {
      method: "DELETE"
    });
  }

  /**
   * Queues documents within a batch to be processed and saved to the live plant.
   * @param documentGroupId The UUID of the document group.
   * @param body Details specifying the batch ID and export target.
   * @returns void (API response not specified).
   */
  async exportBatchDocuments(documentGroupId: string, body: T.ExportBatchRequest): Promise<void> {
    await this.fetch<void>(`/v1/indexing/document-groups/${documentGroupId}/queue-process-documents`, {
      method: "POST",
      body: JSON.stringify(body)
    });
  }
}