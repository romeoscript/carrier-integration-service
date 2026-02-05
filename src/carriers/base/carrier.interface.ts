import { RateRequest, RateResponse } from '../../domain';

export interface ICarrier {
  readonly name: string;
  getRates(request: RateRequest): Promise<RateResponse>;
  healthCheck(): Promise<boolean>;
}

export interface ICarrierAuth {
  getToken(): Promise<string>;
  invalidateToken(): Promise<void>;
}
