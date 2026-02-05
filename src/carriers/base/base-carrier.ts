import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  CarrierAPIError,
  NetworkError,
  RateLimitError,
  AuthenticationError,
} from '../../domain/errors';
import { ICarrier, ICarrierAuth } from './carrier.interface';

/**
 * Abstract base class providing common functionality for all carriers
 * Handles HTTP client setup, error transformation, and retry logic
 */
export abstract class BaseCarrier implements ICarrier {
  protected readonly httpClient: AxiosInstance;

  constructor(
    public readonly name: string,
    protected readonly auth: ICarrierAuth,
    baseURL: string,
    timeout: number = 30000
  ) {
    this.httpClient = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.httpClient.interceptors.request.use(async (config) => {
      const token = await this.auth.getToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        return Promise.reject(this.transformError(error));
      }
    );
  }

  /**
   * Transform axios errors into our domain errors
   */
  protected transformError(error: AxiosError): Error {
    // Network/timeout errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new NetworkError('Request timeout', { originalError: error.message });
    }

    if (!error.response) {
      return new NetworkError('Network error - no response received', {
        originalError: error.message,
      });
    }

    const { status, data } = error.response;

    // Rate limiting
    if (status === 429) {
      const retryAfter = error.response.headers['retry-after']
        ? parseInt(error.response.headers['retry-after'], 10)
        : undefined;
      return new RateLimitError('Rate limit exceeded', retryAfter);
    }

    // Authentication errors
    if (status === 401 || status === 403) {
      // Invalidate token on auth failure
      this.auth.invalidateToken().catch(() => {
        /* ignore */
      });
      return new AuthenticationError('Authentication failed', data);
    }

    // Other API errors
    const message = this.extractErrorMessage(data);
    return new CarrierAPIError(message, status, undefined, data);
  }

  /**
   * Extract error message from carrier response
   * Override this in carrier-specific implementations if needed
   */
  protected extractErrorMessage(data: unknown): string {
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      return (obj.message || obj.error || obj.errorDescription || 'Unknown error') as string;
    }
    return 'Unknown error occurred';
  }

  /**
   * Abstract methods that must be implemented by carrier-specific classes
   */
  abstract getRates(request: import('../../domain').RateRequest): Promise<import('../../domain').RateResponse>;
  abstract healthCheck(): Promise<boolean>;
}
