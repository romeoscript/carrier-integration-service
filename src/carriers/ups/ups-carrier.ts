import { BaseCarrier } from '../base';
import { RateRequest, RateResponse, validateRateRequest } from '../../domain';
import { UPSAuth } from './ups-auth';
import { mapRateRequestToUPS, mapUPSRatedShipmentToQuote } from './ups-mapper';
import { validateRateResponse } from './ups-validator';

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
    const response = await this.httpClient.post('/rating/v1/Rate', upsRequest);

    // Validate response structure before processing
    const validatedResponse = validateRateResponse(response.data);

    // Transform response to our domain format
    const ratedShipments = validatedResponse.RateResponse.RatedShipment;
    const quotes = ratedShipments.map(mapUPSRatedShipmentToQuote);

    return {
      quotes,
      requestId: validatedResponse.RateResponse.Response.TransactionReference?.CustomerContext,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.auth.getToken();
      return true;
    } catch (error) {
      return false;
    }
  }
}
