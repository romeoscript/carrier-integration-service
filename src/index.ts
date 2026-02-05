/**
 * Carrier Integration Service
 * 
 * A modular, extensible service for integrating with shipping carriers
 * to fetch rates, purchase labels, track shipments, and more.
 * 
 * @example
 * ```typescript
 * import { CarrierService, createUPSCarrier, config } from 'carrier-integration-service';
 * 
 * const service = new CarrierService();
 * const upsCarrier = createUPSCarrier(config);
 * service.registerCarrier(upsCarrier);
 * 
 * const rates = await service.getRates('UPS', {
 *   origin: { ... },
 *   destination: { ... },
 *   packages: [{ ... }]
 * });
 * ```
 */

// Export domain models and types
export * from './domain';

// Export configuration
export { loadConfig, config, type Config } from './config';

// Export base interfaces for extensibility
export { ICarrier, ICarrierAuth } from './carriers/base';

// Export carrier implementations
export { createUPSCarrier, UPSCarrier } from './carriers/ups';

// Export main service
export { CarrierService } from './services';

// TODO: Export additional carriers as they are implemented
// export { createFedExCarrier, FedExCarrier } from './carriers/fedex';
// export { createUSPSCarrier, USPSCarrier } from './carriers/usps';
