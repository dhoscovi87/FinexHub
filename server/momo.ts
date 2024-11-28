import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import https from 'https';

// WARNING: This is a development-only configuration to handle self-signed certificates
// In production, proper SSL certificate verification should be enabled
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Configure SSL agent for requests
const agent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production'
});

const BASE_URL = 'https://sandbox.momodeveloper.mtn.com';
const API_ENDPOINTS = {
  token: `${BASE_URL}/collection/token`,
  apiUser: `${BASE_URL}/v1_0/apiuser`,
  requestToPay: `${BASE_URL}/collection/v1_0/requesttopay`,
  disbursement: `${BASE_URL}/disbursement/v1_0/transfer`,
};
const TOKEN_VALIDITY_DURATION = 3600; // 1 hour in seconds

interface ApiUserResponse {
  providerCallbackHost: string;
  targetEnvironment: string;
}

interface ApiKeyResponse {
  apiKey: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface RequestToPayResponse {
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  reason?: {
    code: string;
    message: string;
  };
}

interface TransferResponse {
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  reason?: {
    code: string;
    message: string;
  };
}

class MoMoError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'MoMoError';
  }
}

export class MoMoAPI {
  private subscriptionKey: string;
  private apiUser: string | null = null;
  private apiKey: string | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Public method to verify token validity
   * @returns A promise that resolves to true if token is valid, or throws an error if validation fails
   */
  public async verifyToken(): Promise<boolean> {
    try {
      await this.getToken();
      return true;
    } catch (error) {
      if (error instanceof MoMoError) {
        throw error;
      }
      throw new MoMoError('Token verification failed', error instanceof Error ? error.cause as number : undefined);
    }
  }

  constructor() {
    const key = process.env.MTN_MOMO_SUBSCRIPTION_KEY;
    if (!key) {
      throw new Error('MTN_MOMO_SUBSCRIPTION_KEY is not set');
    }
    this.subscriptionKey = key;
  }

  /**
   * Generate a new UUID for X-Reference-Id
   */
  generateUUID(): string {
    return uuidv4();
  }

  /**
   * Create a new API user
   */
  async createApiUser(referenceId: string, callbackHost: string): Promise<void> {
    try {
      const response = await fetch(API_ENDPOINTS.apiUser, {
        method: 'POST',
        agent,
        headers: {
          'X-Reference-Id': referenceId,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ providerCallbackHost: callbackHost })
      });

      console.log('API User creation response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const error = await response.text();
        throw new MoMoError(`Failed to create API user: ${error}`, response.status);
      }

      if (response.status !== 201) {
        throw new MoMoError('Failed to create API user: Unexpected status code', response.status);
      }

      this.apiUser = referenceId;
    } catch (error) {
      if (error instanceof MoMoError) {
        throw error;
      }
      throw new MoMoError(`Failed to create API user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create API key for an existing API user
   */
  async createApiKey(apiUserId: string): Promise<string> {
    try {
      const response = await fetch(`${API_ENDPOINTS.apiUser}/${apiUserId}/apikey`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new MoMoError(`Failed to create API key: ${error}`, response.status);
      }

      const data: ApiKeyResponse = await response.json();
      this.apiKey = data.apiKey;
      return data.apiKey;
    } catch (error) {
      if (error instanceof MoMoError) {
        throw error;
      }
      throw new MoMoError(`Failed to create API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get API user details
   */
  async getApiUserDetails(apiUserId: string): Promise<ApiUserResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.apiUser}/${apiUserId}`, {
        method: 'GET',
        agent,
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new MoMoError(`Failed to get API user details: ${error}`, response.status);
      }

      return response.json();
    } catch (error) {
      if (error instanceof MoMoError) {
        throw error;
      }
      throw new MoMoError(`Failed to get API user details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get OAuth token
   */
  private async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.apiUser || !this.apiKey) {
      throw new MoMoError('API user and key must be set before getting token');
    }

    try {
      console.log('Requesting new access token...');
      console.log('Request URL:', API_ENDPOINTS.token);
      
      const auth = Buffer.from(`${this.apiUser}:${this.apiKey}`).toString('base64');
      // Log authorization header format without credentials
      console.log('Authorization header format: Basic [credentials]');
      
      const response = await fetch(API_ENDPOINTS.token, {
        method: 'POST',
        agent,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'X-Target-Environment': 'sandbox',
        }
      });

      console.log('Token request response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        let parsedError;
        try {
          parsedError = JSON.parse(errorText);
        } catch {
          parsedError = { message: errorText };
        }

        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          error: parsedError,
          endpoint: API_ENDPOINTS.token,
          responseBody: errorText,
          requestHeaders: {
            'Authorization': 'Basic [hidden]',
            'Ocp-Apim-Subscription-Key': '[hidden]',
            'X-Target-Environment': 'sandbox'
          }
        };

        console.error('Token request failed:', JSON.stringify(errorDetails, null, 2));

        // Enhanced error handling based on status codes
        switch (response.status) {
          case 401:
            throw new MoMoError('Authentication failed. Please check API credentials.', response.status);
          case 403:
            throw new MoMoError('Access forbidden. Please verify subscription key and permissions.', response.status);
          case 404:
            throw new MoMoError('Token endpoint not found. Please verify API configuration.', response.status);
          default:
            throw new MoMoError(
              `Failed to get token: ${parsedError.message || errorText}`,
              response.status
            );
        }
      }

      const data: TokenResponse = await response.json();
      console.log('Token request successful, expires in:', data.expires_in, 'seconds');
      
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      return this.accessToken;
    } catch (error) {
      if (error instanceof MoMoError) {
        throw error;
      }
      console.error('Unexpected error during token request:', error);
      throw new MoMoError(`Failed to get token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Request to pay (Collection)
   */
  async requestToPay(
    amount: number,
    currency: string,
    phoneNumber: string,
    note: string
  ): Promise<string> {
    const token = await this.getToken();
    const referenceId = this.generateUUID();

    try {
      const response = await fetch(API_ENDPOINTS.requestToPay, {
        method: 'POST',
        agent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': 'sandbox',
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.subscriptionKey
        },
        body: JSON.stringify({
          amount,
          currency,
          externalId: referenceId,
          payer: {
            partyIdType: 'MSISDN',
            partyId: phoneNumber
          },
          payerMessage: note,
          payeeNote: note
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new MoMoError(`Failed to request payment: ${error}`, response.status);
      }

      return referenceId;
    } catch (error) {
      if (error instanceof MoMoError) {
        throw error;
      }
      throw new MoMoError(`Failed to request payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check payment status
   */
  async getPaymentStatus(referenceId: string): Promise<RequestToPayResponse> {
    const token = await this.getToken();

    try {
      const response = await fetch(`${API_ENDPOINTS.requestToPay}/${referenceId}`, {
        method: 'GET',
        agent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': 'sandbox',
          'Ocp-Apim-Subscription-Key': this.subscriptionKey
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new MoMoError(`Failed to get payment status: ${error}`, response.status);
      }

      return response.json();
    } catch (error) {
      if (error instanceof MoMoError) {
        throw error;
      }
      throw new MoMoError(`Failed to get payment status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transfer money (Disbursement)
   */
  async transfer(
    amount: number,
    currency: string,
    phoneNumber: string,
    note: string
  ): Promise<string> {
    const token = await this.getToken();
    const referenceId = this.generateUUID();

    try {
      const response = await fetch(API_ENDPOINTS.disbursement, {
        method: 'POST',
        agent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': 'sandbox',
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.subscriptionKey
        },
        body: JSON.stringify({
          amount,
          currency,
          externalId: referenceId,
          payee: {
            partyIdType: 'MSISDN',
            partyId: phoneNumber
          },
          payerMessage: note,
          payeeNote: note
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new MoMoError(`Failed to transfer: ${error}`, response.status);
      }

      return referenceId;
    } catch (error) {
      if (error instanceof MoMoError) {
        throw error;
      }
      throw new MoMoError(`Failed to transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check transfer status
   */
  async getTransferStatus(referenceId: string): Promise<TransferResponse> {
    const token = await this.getToken();

    try {
      const response = await fetch(`${API_ENDPOINTS.disbursement}/${referenceId}`, {
        method: 'GET',
        agent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': 'sandbox',
          'Ocp-Apim-Subscription-Key': this.subscriptionKey
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new MoMoError(`Failed to get transfer status: ${error}`, response.status);
      }

      return response.json();
    } catch (error) {
      if (error instanceof MoMoError) {
        throw error;
      }
      throw new MoMoError(`Failed to get transfer status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export a singleton instance
export const momoApi = new MoMoAPI();
