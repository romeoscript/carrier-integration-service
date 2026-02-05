import { BaseCarrier } from '../base';
import { RateRequest, RateResponse, validateRateRequest } from '../../domain';
import { UPSAuth } from './ups-auth';
import { UPSRateResponse } from './ups-types';
import { mapRateRequestToUPS, mapUPSRatedShipmentToQuote } from './ups-mapper';

export class UPSCarrier extends BaseCarrier {
  constructor(
    private readonly accountNumber: string,
    auth: UPSAuth,
    baseURL: string
  ) {
    super('UPS', auth, baseURL);
  }

  async getRates(request: RateRequest): Promise<RateResponse> {
    const validatedRequest = validateRateRequest(request);
    const upsRequest = mapRateRequestToUPS(validatedRequest, this.accountNumber);
    const response = await this.httpClient.post<UPSRateResponse>('/rating/v1/Rate', upsRequest);
    const ratedShipments = response.data.RateResponse.RatedShipment;
    const quotes = ratedShipments.map(mapUPSRatedShipmentToQuote);

    return {
      quotes,
      requestId: response.data.RateResponse.Response.TransactionReference?.CustomerContext,
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
