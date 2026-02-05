import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  CarrierAPIError,
  NetworkError,
  RateLimitError,
  AuthenticationError,
} from '../../domain/errors';
import { ICarrier, ICarrierAuth } from './carrier.interface';

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

    this.httpClient.interceptors.request.use(async (config) => {
      const token = await this.auth.getToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        return Promise.reject(this.transformError(error));
      }
    );
  }

  protected transformError(error: AxiosError): Error {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new NetworkError('Request timeout', { originalError: error.message });
    }

    if (!error.response) {
      return new NetworkError('Network error - no response received', {
        originalError: error.message,
      });
    }

    const { status, data } = error.response;

    if (status === 429) {
      const raw = error.response.headers['retry-after'];
      const n = typeof raw === 'string' ? parseInt(raw, 10) : NaN;
      const retryAfter = Number.isInteger(n) && n >= 0 ? n : undefined;
      return new RateLimitError('Rate limit exceeded', retryAfter);
    }

    if (status === 401 || status === 403) {
      // Force token refresh on next request - current token may have been revoked
      this.auth.invalidateToken().catch(() => {});
      return new AuthenticationError('Authentication failed', data);
    }

    const message = this.extractErrorMessage(data);
    return new CarrierAPIError(message, status, undefined, data);
  }

  protected extractErrorMessage(data: unknown): string {
    if (typeof data === 'string') return data;
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      const obj = data as Record<string, unknown>;
      const msg =
        (typeof obj.message === 'string' ? obj.message : undefined) ??
        (typeof obj.error === 'string' ? obj.error : undefined) ??
        (typeof obj.errorDescription === 'string' ? obj.errorDescription : undefined);
      if (msg !== undefined) return msg;
    }
    return 'Unknown error occurred';
  }

  abstract getRates(request: import('../../domain').RateRequest): Promise<import('../../domain').RateResponse>;
  abstract healthCheck(): Promise<boolean>;
}
