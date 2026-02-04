import { z } from 'zod';

/**
 * Weight units supported
 */
export const WeightUnitSchema = z.enum(['LBS', 'KG']);
export type WeightUnit = z.infer<typeof WeightUnitSchema>;

/**
 * Dimension units supported
 */
export const DimensionUnitSchema = z.enum(['IN', 'CM']);
export type DimensionUnit = z.infer<typeof DimensionUnitSchema>;

/**
 * Package dimensions schema
 */
export const PackageDimensionsSchema = z.object({
  length: z.number().positive('Length must be positive'),
  width: z.number().positive('Width must be positive'),
  height: z.number().positive('Height must be positive'),
  unit: DimensionUnitSchema.default('IN'),
});

export type PackageDimensions = z.infer<typeof PackageDimensionsSchema>;

/**
 * Package weight schema
 */
export const PackageWeightSchema = z.object({
  value: z.number().positive('Weight must be positive'),
  unit: WeightUnitSchema.default('LBS'),
});

export type PackageWeight = z.infer<typeof PackageWeightSchema>;

/**
 * Complete package schema
 */
export const PackageSchema = z.object({
  weight: PackageWeightSchema,
  dimensions: PackageDimensionsSchema,
  description: z.string().optional(),
  value: z.number().positive().optional(), // Declared value for insurance
});

export type Package = z.infer<typeof PackageSchema>;

/**
 * Validates a package object
 */
export function validatePackage(pkg: unknown): Package {
  return PackageSchema.parse(pkg);
}
