import { v4 as uuidv4 } from 'uuid';

const BASE_URL = 'https://sandbox.momodeveloper.mtn.com';
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
      const response = await fetch(`${BASE_URL}/apiuser`, {
        method: 'POST',
        headers: {
          'X-Reference-Id': referenceId,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ providerCallbackHost: callbackHost })
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
      const response = await fetch(`${BASE_URL}/apiuser/${apiUserId}/apikey`, {
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
      const response = await fetch(`${BASE_URL}/apiuser/${apiUserId}`, {
        method: 'GET',
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
      const auth = Buffer.from(`${this.apiUser}:${this.apiKey}`).toString('base64');
      const response = await fetch(`${BASE_URL}/collection/token/`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new MoMoError(`Failed to get token: ${error}`, response.status);
      }

      const data: TokenResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      return this.accessToken;
    } catch (error) {
      if (error instanceof MoMoError) {
        throw error;
      }
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
      const response = await fetch(`${BASE_URL}/collection/v1_0/requesttopay`, {
        method: 'POST',
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
      const response = await fetch(`${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`, {
        method: 'GET',
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
      const response = await fetch(`${BASE_URL}/disbursement/v1_0/transfer`, {
        method: 'POST',
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
      const response = await fetch(`${BASE_URL}/disbursement/v1_0/transfer/${referenceId}`, {
        method: 'GET',
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
