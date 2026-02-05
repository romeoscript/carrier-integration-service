import { z } from 'zod';
import { AddressSchema } from './address';
import { PackageSchema } from './package';

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

export const RateRequestSchema = z.object({
  origin: AddressSchema,
  destination: AddressSchema,
  packages: z.array(PackageSchema).min(1, 'At least one package is required'),
  serviceLevel: ServiceLevelSchema.optional(),
  pickupDate: z.string().datetime().optional(),
});

export type RateRequest = z.infer<typeof RateRequestSchema>;

export const RateQuoteSchema = z.object({
  carrier: z.string(),
  serviceLevel: ServiceLevelSchema,
  serviceName: z.string(),
  totalCharge: z.number().nonnegative(),
  currency: z.string().length(3).default('USD'),
  estimatedDeliveryDate: z.string().optional(),
  transitDays: z.number().int().nonnegative().optional(),
  guaranteedDelivery: z.boolean().optional(),
});

export type RateQuote = z.infer<typeof RateQuoteSchema>;

export const RateResponseSchema = z.object({
  quotes: z.array(RateQuoteSchema),
  requestId: z.string().optional(),
});

export type RateResponse = z.infer<typeof RateResponseSchema>;

export function validateRateRequest(request: unknown): RateRequest {
  return RateRequestSchema.parse(request);
}
