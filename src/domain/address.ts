import { z } from 'zod';

export const AddressSchema = z.object({
  street1: z.string().min(1, 'Street address is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2-letter code').toUpperCase(),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code format'),
  country: z.string().length(2, 'Country must be 2-letter ISO code').toUpperCase().default('US'),
  residential: z.boolean().optional().default(false),
});

export type Address = z.infer<typeof AddressSchema>;

export function validateAddress(address: unknown): Address {
  return AddressSchema.parse(address);
}
