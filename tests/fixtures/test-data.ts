import { RateRequest, Address, Package } from '../../src/domain';

/**
 * Valid test addresses
 */
export const validOriginAddress: Address = {
  street1: '123 Warehouse St',
  city: 'Los Angeles',
  state: 'CA',
  postalCode: '90001',
  country: 'US',
  residential: false,
};

export const validDestinationAddress: Address = {
  street1: '456 Customer Ave',
  street2: 'Apt 2B',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'US',
  residential: true,
};

/**
 * Valid test package
 */
export const validPackage: Package = {
  weight: {
    value: 5,
    unit: 'LBS',
  },
  dimensions: {
    length: 12,
    width: 10,
    height: 8,
    unit: 'IN',
  },
  description: 'Test package',
  value: 100,
};

/**
 * Valid rate request
 */
export const validRateRequest: RateRequest = {
  origin: validOriginAddress,
  destination: validDestinationAddress,
  packages: [validPackage],
};

/**
 * Rate request with specific service level
 */
export const validRateRequestWithService: RateRequest = {
  origin: validOriginAddress,
  destination: validDestinationAddress,
  packages: [validPackage],
  serviceLevel: 'GROUND',
};

/**
 * Rate request with multiple packages
 */
export const validMultiPackageRequest: RateRequest = {
  origin: validOriginAddress,
  destination: validDestinationAddress,
  packages: [
    validPackage,
    {
      weight: { value: 3, unit: 'LBS' },
      dimensions: { length: 8, width: 6, height: 4, unit: 'IN' },
    },
  ],
};
