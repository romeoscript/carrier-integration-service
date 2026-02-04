/**
 * Base error class for carrier integration errors
 */
export class CarrierError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'CarrierError';
    Object.setPrototypeOf(this, CarrierError.prototype);
  }
}

/**
 * Authentication/authorization errors
 */
export class AuthenticationError extends CarrierError {
  constructor(message: string, details?: unknown) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Validation errors for request data
 */
export class ValidationError extends CarrierError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends CarrierError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, { retryAfter });
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Network/timeout errors
 */
export class NetworkError extends CarrierError {
  constructor(message: string, details?: unknown) {
    super(message, 'NETWORK_ERROR', 503, details);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Errors from carrier API responses
 */
export class CarrierAPIError extends CarrierError {
  constructor(
    message: string,
    statusCode: number,
    public readonly carrierCode?: string,
    details?: unknown
  ) {
    super(message, 'CARRIER_API_ERROR', statusCode, details);
    this.name = 'CarrierAPIError';
    Object.setPrototypeOf(this, CarrierAPIError.prototype);
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends CarrierError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}
