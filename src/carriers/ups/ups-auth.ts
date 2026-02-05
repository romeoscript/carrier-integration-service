import axios, { AxiosInstance } from 'axios';
import { ICarrierAuth } from '../base';
import { AuthenticationError } from '../../domain/errors';

/**
 * OAuth token response from UPS
 */
interface UPSTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
  issued_at: string;
}

/**
 * Cached token with expiry tracking
 */
interface CachedToken {
  token: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

/**
 * UPS OAuth 2.0 client credentials authentication
 * Handles token acquisition, caching, and automatic refresh
 */
export class UPSAuth implements ICarrierAuth {
  private cachedToken: CachedToken | null = null;
  private tokenRefreshPromise: Promise<string> | null = null;
  private readonly httpClient: AxiosInstance;

  // Add 5 minute buffer before actual expiry to avoid edge cases
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

  /**
   * Get a valid access token
   * Returns cached token if still valid, otherwise fetches a new one
   */
  async getToken(): Promise<string> {
    // Return cached token if still valid
    if (this.cachedToken && this.isTokenValid(this.cachedToken)) {
      return this.cachedToken.token;
    }

    // If a refresh is already in progress, wait for it
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    // Start new token refresh
    this.tokenRefreshPromise = this.fetchNewToken();

    try {
      const token = await this.tokenRefreshPromise;
      return token;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  /**
   * Invalidate the current token and force a refresh on next request
   */
  async invalidateToken(): Promise<void> {
    this.cachedToken = null;
  }

  /**
   * Check if a cached token is still valid
   */
  private isTokenValid(cached: CachedToken): boolean {
    return Date.now() < cached.expiresAt;
  }

  /**
   * Fetch a new access token from UPS OAuth endpoint
   */
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

      // Cache the token with expiry time
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
