import { z } from 'zod';

export const WeightUnitSchema = z.enum(['LBS', 'KG']);
export type WeightUnit = z.infer<typeof WeightUnitSchema>;

export const DimensionUnitSchema = z.enum(['IN', 'CM']);
export type DimensionUnit = z.infer<typeof DimensionUnitSchema>;

export const PackageDimensionsSchema = z.object({
  length: z.number().positive('Length must be positive'),
  width: z.number().positive('Width must be positive'),
  height: z.number().positive('Height must be positive'),
  unit: DimensionUnitSchema.default('IN'),
});

export type PackageDimensions = z.infer<typeof PackageDimensionsSchema>;

export const PackageWeightSchema = z.object({
  value: z.number().positive('Weight must be positive'),
  unit: WeightUnitSchema.default('LBS'),
});

export type PackageWeight = z.infer<typeof PackageWeightSchema>;

export const PackageSchema = z.object({
  weight: PackageWeightSchema,
  dimensions: PackageDimensionsSchema,
  description: z.string().optional(),
  value: z.number().positive().optional(),
});

export type Package = z.infer<typeof PackageSchema>;

export function validatePackage(pkg: unknown): Package {
  return PackageSchema.parse(pkg);
}
