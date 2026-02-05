import { ValidationError } from '../../domain/errors';
import { ServiceLevel, ServiceLevelSchema } from '../../domain';
import { UPS_SERVICE_CODES } from './ups-types';
import { UPSRateResponseSchema, UPSTokenResponseSchema, ValidatedUPSRateResponse } from './ups-schemas';

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

export function validateRateResponse(data: unknown): ValidatedUPSRateResponse {
  try {
    return UPSRateResponseSchema.parse(data);
  } catch (error) {
    throw new ValidationError('Invalid UPS Rate API response structure', error);
  }
}

export function validateAndMapServiceLevel(serviceCode: string): ServiceLevel {
  const mappedLevel = UPS_SERVICE_CODES[serviceCode];

  if (!mappedLevel) {
    throw new ValidationError(`Unknown UPS service code: ${serviceCode}`);
  }

  const parsed = ServiceLevelSchema.safeParse(mappedLevel);
  if (!parsed.success) {
    throw new ValidationError(`Mapped service level is invalid: ${mappedLevel}`);
  }
  return parsed.data;
}