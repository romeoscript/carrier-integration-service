import { ICarrier } from '../carriers/base';
import { RateRequest, RateResponse, RateQuote } from '../domain';

/**
 * Main service for interacting with shipping carriers
 * Provides a unified interface for fetching rates across multiple carriers
 */
export class CarrierService {
  private carriers: Map<string, ICarrier> = new Map();

  /**
   * Register a carrier
   */
  registerCarrier(carrier: ICarrier): void {
    this.carriers.set(carrier.name.toUpperCase(), carrier);
  }

  /**
   * Get a specific carrier by name
   */
  getCarrier(name: string): ICarrier | undefined {
    return this.carriers.get(name.toUpperCase());
  }

  /**
   * Get all registered carriers
   */
  getAvailableCarriers(): string[] {
    return Array.from(this.carriers.keys());
  }

  /**
   * Fetch rates from a specific carrier
   */
  async getRates(carrierName: string, request: RateRequest): Promise<RateResponse> {
    const carrier = this.getCarrier(carrierName);
    if (!carrier) {
      throw new Error(`Carrier '${carrierName}' not found. Available: ${this.getAvailableCarriers().join(', ')}`);
    }

    return carrier.getRates(request);
  }

  /**
   * Fetch rates from all registered carriers and combine results
   * Useful for rate shopping across multiple carriers
   */
  async getAllRates(request: RateRequest): Promise<RateResponse> {
    const carriers = Array.from(this.carriers.values());

    if (carriers.length === 0) {
      throw new Error('No carriers registered');
    }

    // Fetch rates from all carriers in parallel
    const results = await Promise.allSettled(
      carriers.map((carrier) => carrier.getRates(request))
    );

    // Combine successful results
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

    // If all carriers failed, throw the first error
    if (allQuotes.length === 0 && errors.length > 0) {
      throw errors[0].error;
    }

    // Sort quotes by price (lowest first)
    allQuotes.sort((a, b) => a.totalCharge - b.totalCharge);

    return {
      quotes: allQuotes,
    };
  }

  /**
   * Health check for all carriers
   */
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
