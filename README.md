# Carrier Integration Service

A production-ready, extensible TypeScript service for integrating with shipping carriers (UPS, FedEx, USPS, DHL, etc.) to fetch rates, purchase labels, track shipments, and more.

## Overview

This service provides a clean, type-safe abstraction layer over carrier APIs, enabling seamless integration with multiple shipping providers through a unified interface. Currently implements UPS Rating API with a modular architecture that makes adding new carriers straightforward.

## Features

- ✅ **Type-Safe**: Comprehensive TypeScript types with runtime validation using Zod
- ✅ **Extensible Architecture**: Add new carriers without modifying existing code
- ✅ **OAuth 2.0 Authentication**: Automatic token management with caching and refresh
- ✅ **Error Handling**: Structured error types for different failure modes
- ✅ **Rate Shopping**: Fetch and compare rates across multiple carriers
- ✅ **Integration Tested**: Comprehensive test coverage with mocked API responses
- ✅ **Production Ready**: Configuration management, logging, and health checks

## Quick Start

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and fill in your UPS credentials:

```bash
cp .env.example .env
```

Required environment variables:
```env
UPS_CLIENT_ID=your_client_id
UPS_CLIENT_SECRET=your_client_secret
UPS_ACCOUNT_NUMBER=your_account_number
UPS_API_BASE_URL=https://wwwcie.ups.com/api
UPS_OAUTH_URL=https://wwwcie.ups.com/security/v1/oauth/token
```

### Usage

```typescript
import { CarrierService, createUPSCarrier, config } from './src';

// Create service and register carriers
const service = new CarrierService();
const upsCarrier = createUPSCarrier(config);
service.registerCarrier(upsCarrier);

// Fetch rates
const rates = await service.getRates('UPS', {
  origin: {
    street1: '123 Warehouse St',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90001',
    country: 'US',
  },
  destination: {
    street1: '456 Customer Ave',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  },
  packages: [{
    weight: { value: 5, unit: 'LBS' },
    dimensions: { length: 12, width: 10, height: 8, unit: 'IN' },
  }],
});

console.log(rates.quotes);
```

## Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Project Structure

```
src/
├── config/              # Environment configuration with validation
├── domain/              # Domain models, types, and validation schemas
│   ├── address.ts
│   ├── package.ts
│   ├── rate.ts
│   └── errors.ts
├── carriers/            # Carrier implementations
│   ├── base/           # Abstract base classes and interfaces
│   │   ├── carrier.interface.ts
│   │   └── base-carrier.ts
│   └── ups/            # UPS-specific implementation
│       ├── ups-auth.ts
│       ├── ups-carrier.ts
│       ├── ups-mapper.ts
│       ├── ups-types.ts
│       └── ups-factory.ts
├── services/           # Service orchestration layer
│   └── carrier-service.ts
└── index.ts           # Public API exports

tests/
├── fixtures/          # Mock API responses and test data
└── integration/       # End-to-end integration tests
```

## Architecture & Design Decisions

### 1. Separation of Concerns

**Domain Models**: All business logic types (`Address`, `Package`, `RateRequest`, `RateQuote`) are defined independently of any carrier's API format. This creates a clean boundary between internal and external representations.

**Carrier Abstraction**: The `ICarrier` interface defines the contract all carriers must implement. The `BaseCarrier` abstract class provides common HTTP client setup, error transformation, and auth token injection.

**Mappers**: Each carrier has dedicated mapper functions (`ups-mapper.ts`) that transform between our domain models and the carrier's API format. This keeps transformation logic isolated and testable.

### 2. Extensibility

Adding a new carrier requires:

1. Implement the `ICarrier` interface (or extend `BaseCarrier`)
2. Create carrier-specific types based on their API docs
3. Write mappers to/from domain models
4. Implement authentication (if not OAuth 2.0)
5. Export via a factory function

**Example**: Adding FedEx would look like:

```typescript
// src/carriers/fedex/fedex-carrier.ts
export class FedExCarrier extends BaseCarrier {
  async getRates(request: RateRequest): Promise<RateResponse> {
    // FedEx-specific implementation
  }
}

// src/carriers/fedex/fedex-factory.ts
export function createFedExCarrier(config: Config): FedExCarrier {
  // Factory logic
}
```

The existing UPS code remains untouched.

### 3. Type Safety & Validation

**Compile-time**: TypeScript provides full type checking across the codebase
**Runtime**: Zod schemas validate all input data before making API calls

```typescript
// Type and validator from same source
export const AddressSchema = z.object({ ... });
export type Address = z.infer<typeof AddressSchema>;
```

This ensures data integrity at both development and runtime.

### 4. Authentication Management

**OAuth 2.0 Flow**: `UPSAuth` class handles:
- Token acquisition via client credentials
- Caching with expiry tracking (5-minute buffer)
- Automatic refresh on expiry
- Concurrent request deduplication
- Manual invalidation on 401 errors

The auth layer is completely transparent to callers—they never need to think about tokens.

### 5. Error Handling

Structured error hierarchy:
- `AuthenticationError` (401/403)
- `ValidationError` (400)
- `RateLimitError` (429) with retry-after header
- `NetworkError` (timeouts, connection failures)
- `CarrierAPIError` (other API errors)
- `ConfigurationError` (missing/invalid config)

All errors extend `CarrierError` with consistent structure:
```typescript
{
  message: string;
  code: string;
  statusCode?: number;
  details?: unknown;
}
```

### 6. Configuration

Environment variables are:
- Loaded via `dotenv`
- Validated at startup using Zod schemas
- Type-safe throughout the application
- Never hardcoded

Missing or invalid configuration fails fast with clear error messages.

### 7. Testing Strategy

**Integration Tests**: Test the full request/response flow with stubbed HTTP calls using `nock`. This verifies:
- Request payload construction
- Response parsing and normalization
- Auth token lifecycle (acquisition, caching, refresh)
- Error scenarios (4xx, 5xx, timeouts, malformed responses)

**Fixtures**: Mock responses based on actual UPS API documentation ensure realistic testing.

## API Reference

### CarrierService

```typescript
class CarrierService {
  registerCarrier(carrier: ICarrier): void
  getCarrier(name: string): ICarrier | undefined
  getRates(carrierName: string, request: RateRequest): Promise<RateResponse>
  getAllRates(request: RateRequest): Promise<RateResponse>
  healthCheck(): Promise<Record<string, boolean>>
}
```

### Domain Types

```typescript
interface RateRequest {
  origin: Address;
  destination: Address;
  packages: Package[];
  serviceLevel?: ServiceLevel;
  pickupDate?: string; // ISO 8601
}

interface RateQuote {
  carrier: string;
  serviceLevel: ServiceLevel;
  serviceName: string;
  totalCharge: number;
  currency: string;
  estimatedDeliveryDate?: string;
  transitDays?: number;
  guaranteedDelivery?: boolean;
}
```

## What Would Be Improved With More Time

### High Priority

1. **Additional Carriers**: Implement FedEx, USPS, and DHL integrations following the same pattern
2. **Additional Operations**: 
   - Label purchase/generation
   - Shipment tracking
   - Address validation
   - Pickup scheduling
3. **Retry Logic**: Implement exponential backoff for transient failures
4. **Rate Limiting**: Add client-side rate limiting to respect carrier quotas
5. **Caching**: Cache rate quotes for identical requests within a time window
6. **Logging**: Add structured logging (Winston/Pino) with correlation IDs

### Medium Priority

7. **Webhooks**: Handle carrier callback events (delivery confirmations, exceptions)
8. **Batch Operations**: Support bulk rate requests
9. **Metrics**: Add OpenTelemetry instrumentation for observability
10. **Circuit Breaker**: Implement circuit breaker pattern for failing carriers
11. **Configuration Profiles**: Support multiple carrier accounts (sandbox vs production)

### Nice to Have

12. **CLI Tool**: Simple command-line interface for testing
13. **SDK Generation**: Auto-generate client SDKs for other languages
14. **GraphQL API**: Optionally expose via GraphQL for frontend consumption
15. **Multi-region Support**: Handle region-specific carrier endpoints
16. **Cost Optimization**: Smart carrier selection based on price vs speed preferences

## UPS API Reference

- [UPS Rating API Documentation](https://developer.ups.com/tag/Rating?loc=en_US)
- [UPS OAuth 2.0 Guide](https://developer.ups.com/api/reference/oauth/authorization)

## Contributing

To add a new carrier:

1. Create a new directory under `src/carriers/{carrier-name}/`
2. Implement `ICarrier` interface
3. Add type definitions based on carrier's API docs
4. Create mappers for domain model transformation
5. Write integration tests with mocked responses
6. Export via factory function
7. Update this README

## License

MIT

## Contact

For questions or issues, contact: jack@cybership.io
