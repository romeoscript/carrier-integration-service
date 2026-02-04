import { z } from 'zod';
import { AddressSchema } from './address';
import { PackageSchema } from './package';

/**
 * Service level options
 */
export const ServiceLevelSchema = z.enum([
  'GROUND',
  'EXPRESS',
  'EXPRESS_SAVER',
  'NEXT_DAY_AIR',
  'NEXT_DAY_AIR_EARLY',
  '2ND_DAY_AIR',
  '3_DAY_SELECT',
  'STANDARD',
]);

export type ServiceLevel = z.infer<typeof ServiceLevelSchema>;

/**
 * Rate request schema
 */
export const RateRequestSchema = z.object({
  origin: AddressSchema,
  destination: AddressSchema,
  packages: z.array(PackageSchema).min(1, 'At least one package is required'),
  serviceLevel: ServiceLevelSchema.optional(), // If not provided, return all available services
  pickupDate: z.string().datetime().optional(), // ISO 8601 format
});

export type RateRequest = z.infer<typeof RateRequestSchema>;

/**
 * Individual rate quote from a carrier
 */
export const RateQuoteSchema = z.object({
  carrier: z.string(), // e.g., 'UPS', 'FedEx'
  serviceLevel: ServiceLevelSchema,
  serviceName: z.string(), // Human-readable name
  totalCharge: z.number().nonnegative(),
  currency: z.string().length(3).default('USD'),
  estimatedDeliveryDate: z.string().optional(), // ISO 8601 format
  transitDays: z.number().int().nonnegative().optional(),
  guaranteedDelivery: z.boolean().optional(),
});

export type RateQuote = z.infer<typeof RateQuoteSchema>;

/**
 * Response containing multiple rate quotes
 */
export const RateResponseSchema = z.object({
  quotes: z.array(RateQuoteSchema),
  requestId: z.string().optional(), // For tracking/debugging
});

export type RateResponse = z.infer<typeof RateResponseSchema>;

/**
 * Validates a rate request
 */
export function validateRateRequest(request: unknown): RateRequest {
  return RateRequestSchema.parse(request);
}
