import { RateRequest, RateResponse } from '../../domain';

/**
 * Base interface that all carrier implementations must follow
 * This ensures consistency across different carriers (UPS, FedEx, USPS, etc.)
 */
export interface ICarrier {
  /**
   * Unique identifier for the carrier
   */
  readonly name: string;

  /**
   * Fetch shipping rates for a given request
   * @param request - The rate request with origin, destination, and package details
   * @returns Promise resolving to normalized rate quotes
   */
  getRates(request: RateRequest): Promise<RateResponse>;

  /**
   * Health check to verify carrier API connectivity
   * @returns Promise resolving to true if carrier is available
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Base interface for carrier authentication
 * Different carriers may use different auth mechanisms (OAuth, API keys, etc.)
 */
export interface ICarrierAuth {
  /**
   * Get a valid authentication token
   * Should handle caching, refresh, and expiry automatically
   */
  getToken(): Promise<string>;

  /**
   * Invalidate current token and force refresh
   */
  invalidateToken(): Promise<void>;
}
