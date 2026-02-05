import { BaseCarrier } from '../base';
import { RateRequest, RateResponse, validateRateRequest } from '../../domain';
import { UPSAuth } from './ups-auth';
import { UPSRateResponse } from './ups-types';
import { mapRateRequestToUPS, mapUPSRatedShipmentToQuote } from './ups-mapper';

/**
 * UPS carrier implementation
 * Handles rate shopping via UPS Rating API
 */
export class UPSCarrier extends BaseCarrier {
  constructor(
    private readonly accountNumber: string,
    auth: UPSAuth,
    baseURL: string
  ) {
    super('UPS', auth, baseURL);
  }

  /**
   * Fetch shipping rates from UPS
   */
  async getRates(request: RateRequest): Promise<RateResponse> {
    // Validate request before making API call
    const validatedRequest = validateRateRequest(request);

    // Transform to UPS format
    const upsRequest = mapRateRequestToUPS(validatedRequest, this.accountNumber);

    // Make API call
    // UPS Rating API endpoint: POST /api/rating/{version}/Rate
    const response = await this.httpClient.post<UPSRateResponse>('/rating/v1/Rate', upsRequest);

    // Transform response to our domain format
    const ratedShipments = response.data.RateResponse.RatedShipment;
    const quotes = ratedShipments.map(mapUPSRatedShipmentToQuote);

    return {
      quotes,
      requestId: response.data.RateResponse.Response.TransactionReference?.CustomerContext,
    };
  }

  /**
   * Health check to verify UPS API is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to get a valid auth token
      await this.auth.getToken();
      return true;
    } catch (error) {
      return false;
    }
  }
}
