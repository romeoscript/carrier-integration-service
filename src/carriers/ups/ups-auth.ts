import axios, { AxiosInstance } from 'axios';
import { ICarrierAuth } from '../base';
import { AuthenticationError } from '../../domain/errors';

interface UPSTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  issued_at: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

export class UPSAuth implements ICarrierAuth {
  private cachedToken: CachedToken | null = null;
  private tokenRefreshPromise: Promise<string> | null = null;
  private readonly httpClient: AxiosInstance;

  // Buffer before actual expiry to avoid race conditions with in-flight requests
  private readonly EXPIRY_BUFFER_MS = 5 * 60 * 1000;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly oauthUrl: string
  ) {
    this.httpClient = axios.create({
      timeout: 10000,
    });
  }

  async getToken(): Promise<string> {
    if (this.cachedToken && this.isTokenValid(this.cachedToken)) {
      return this.cachedToken.token;
    }

    // Deduplicate concurrent refresh requests - if a refresh is in progress, wait for it
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this.fetchNewToken();

    try {
      const token = await this.tokenRefreshPromise;
      return token;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  async invalidateToken(): Promise<void> {
    this.cachedToken = null;
  }

  private isTokenValid(cached: CachedToken): boolean {
    return Date.now() < cached.expiresAt;
  }

  private async fetchNewToken(): Promise<string> {
    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await this.httpClient.post<UPSTokenResponse>(
        this.oauthUrl,
        new URLSearchParams({
          grant_type: 'client_credentials',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      const { access_token, expires_in } = response.data;
      const expiresAt = Date.now() + expires_in * 1000 - this.EXPIRY_BUFFER_MS;
      this.cachedToken = {
        token: access_token,
        expiresAt,
      };

      return access_token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.error_description || 'Failed to obtain OAuth token';
        throw new AuthenticationError(message, error.response?.data);
      }
      throw new AuthenticationError('Failed to obtain OAuth token', error);
    }
  }
}
