import { ValidationError } from '../../domain/errors';
import { ServiceLevel } from '../../domain';
import { UPS_SERVICE_CODES } from './ups-types';
import { UPSRateResponseSchema, UPSTokenResponseSchema, ValidatedUPSRateResponse, ValidatedUPSRatedShipment } from './ups-schemas';

/**
 * Validate and parse UPS OAuth token response
 */
export function validateTokenResponse(data: unknown): {
  accessToken: string;
  expiresIn: number;
} {
  try {
    const validated = UPSTokenResponseSchema.parse(data);
    return {
      accessToken: validated.access_token,
      expiresIn: validated.expires_in,
    };
  } catch (error) {
    throw new ValidationError('Invalid UPS OAuth token response', error);
  }
}

/**
 * Validate and parse UPS Rate API response
 */
export function validateRateResponse(data: unknown): ValidatedUPSRateResponse {
  try {
    return UPSRateResponseSchema.parse(data);
  } catch (error) {
    throw new ValidationError('Invalid UPS Rate API response structure', error);
  }
}

/**
 * Validate UPS service code and map to our ServiceLevel
 * Throws if the service code is unknown
 */
export function validateAndMapServiceLevel(serviceCode: string): ServiceLevel {
  const mappedLevel = UPS_SERVICE_CODES[serviceCode];
  
  if (!mappedLevel) {
    throw new ValidationError(`Unknown UPS service code: ${serviceCode}`);
  }

  // Define valid service levels to avoid casting
  const validServiceLevels: ServiceLevel[] = [
    'GROUND',
    'EXPRESS',
    'EXPRESS_SAVER',
    'NEXT_DAY_AIR',
    'NEXT_DAY_AIR_EARLY',
    '2ND_DAY_AIR',
    '3_DAY_SELECT',
    'STANDARD',
  ];

  if (!validServiceLevels.includes(mappedLevel as ServiceLevel)) {
    throw new ValidationError(`Mapped service level is invalid: ${mappedLevel}`);
  }

  return mappedLevel as ServiceLevel;
}

/**
 * Validate that a rated shipment has required charge information
 */
export function validateRatedShipmentCharges(shipment: ValidatedUPSRatedShipment): void {
  const hasNegotiatedCharges = shipment.NegotiatedRateCharges?.TotalCharge?.MonetaryValue;
  const hasRegularCharges = shipment.TotalCharges?.MonetaryValue;

  if (!hasNegotiatedCharges && !hasRegularCharges) {
    throw new ValidationError('Rated shipment missing both negotiated and regular charges');
  }
}