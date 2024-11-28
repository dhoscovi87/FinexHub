import { v4 as uuidv4 } from 'uuid';

const BASE_URL = 'https://sandbox.momodeveloper.mtn.com';

interface ApiUserResponse {
  providerCallbackHost: string;
  targetEnvironment: string;
}

interface ApiKeyResponse {
  apiKey: string;
}

class MoMoError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'MoMoError';
  }
}

export class MoMoAPI {
  private subscriptionKey: string;

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
}

// Export a singleton instance
export const momoApi = new MoMoAPI();
