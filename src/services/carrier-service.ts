import { ICarrier } from '../carriers/base';
import { RateRequest, RateResponse, RateQuote } from '../domain';

export class CarrierService {
  private carriers: Map<string, ICarrier> = new Map();

  registerCarrier(carrier: ICarrier): void {
    this.carriers.set(carrier.name.toUpperCase(), carrier);
  }

  getCarrier(name: string): ICarrier | undefined {
    return this.carriers.get(name.toUpperCase());
  }

  getAvailableCarriers(): string[] {
    return Array.from(this.carriers.keys());
  }

  async getRates(carrierName: string, request: RateRequest): Promise<RateResponse> {
    const carrier = this.getCarrier(carrierName);
    if (!carrier) {
      throw new Error(`Carrier '${carrierName}' not found. Available: ${this.getAvailableCarriers().join(', ')}`);
    }

    return carrier.getRates(request);
  }

  async getAllRates(request: RateRequest): Promise<RateResponse> {
    const carriers = Array.from(this.carriers.values());

    if (carriers.length === 0) {
      throw new Error('No carriers registered');
    }

    // Fetch from all carriers in parallel - don't let one slow carrier block others
    const results = await Promise.allSettled(
      carriers.map((carrier) => carrier.getRates(request))
    );

    const allQuotes: RateQuote[] = [];
    const errors: Array<{ carrier: string; error: Error }> = [];

    results.forEach((result, index) => {
      const carrier = carriers[index];
      if (result.status === 'fulfilled') {
        allQuotes.push(...result.value.quotes);
      } else {
        errors.push({
          carrier: carrier.name,
          error: result.reason,
        });
      }
    });

    // Only throw if ALL carriers failed - partial results are still useful
    if (allQuotes.length === 0 && errors.length > 0) {
      throw errors[0].error;
    }

    allQuotes.sort((a, b) => a.totalCharge - b.totalCharge);

    return {
      quotes: allQuotes,
    };
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const carriers = Array.from(this.carriers.entries());
    const results = await Promise.allSettled(
      carriers.map(([_, carrier]) => carrier.healthCheck())
    );

    const health: Record<string, boolean> = {};
    carriers.forEach(([name], index) => {
      health[name] = results[index].status === 'fulfilled' && results[index].value === true;
    });

    return health;
  }
}
