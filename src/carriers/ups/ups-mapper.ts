import { Address, Package, RateRequest, RateQuote } from '../../domain';
import {
  UPSRateRequest,
  UPSAddress,
  UPSPackage,
  SERVICE_LEVEL_TO_UPS_CODE,
} from './ups-types';
import { ValidatedUPSRatedShipment } from './ups-schemas';
import { validateAndMapServiceLevel, validateRatedShipmentCharges } from './ups-validator';
import {
  extractMonetaryValue,
  extractCurrency,
  safeParseInt,
  parseUPSDate,
} from './ups-parser';

export function mapAddressToUPS(address: Address): UPSAddress {
  const addressLines: string[] = [address.street1];
  if (address.street2) {
    addressLines.push(address.street2);
  }

  return {
    AddressLine: addressLines,
    City: address.city,
    StateProvinceCode: address.state,
    PostalCode: address.postalCode,
    CountryCode: address.country,
    ...(address.residential && { ResidentialAddressIndicator: '1' }),
  };
}

export function mapPackageToUPS(pkg: Package): UPSPackage {
  return {
    PackagingType: {
      Code: '02', // UPS code for "Customer Supplied Package"
      Description: 'Package',
    },
    Dimensions: {
      UnitOfMeasurement: {
        Code: pkg.dimensions.unit,
      },
      Length: pkg.dimensions.length.toString(),
      Width: pkg.dimensions.width.toString(),
      Height: pkg.dimensions.height.toString(),
    },
    PackageWeight: {
      UnitOfMeasurement: {
        Code: pkg.weight.unit === 'LBS' ? 'LBS' : 'KGS',
      },
      Weight: pkg.weight.value.toString(),
    },
    ...(pkg.value && {
      PackageServiceOptions: {
        DeclaredValue: {
          CurrencyCode: 'USD',
          MonetaryValue: pkg.value.toString(),
        },
      },
    }),
  };
}

export function mapRateRequestToUPS(
  request: RateRequest,
  accountNumber: string
): UPSRateRequest {
  return {
    RateRequest: {
      Request: {
        TransactionReference: {
          CustomerContext: 'Rating Request',
        },
      },
      Shipment: {
        ShipmentRatingOptions: {
          // Request account-specific discounted rates when available
          NegotiatedRatesIndicator: '1',
        },
        Shipper: {
          Name: 'Shipper',
          ShipperNumber: accountNumber,
          Address: mapAddressToUPS(request.origin),
        },
        ShipTo: {
          Name: 'Recipient',
          Address: mapAddressToUPS(request.destination),
        },
        ShipFrom: {
          Name: 'Shipper',
          Address: mapAddressToUPS(request.origin),
        },
        ...(request.serviceLevel && {
          Service: {
            Code: SERVICE_LEVEL_TO_UPS_CODE[request.serviceLevel] || '03',
            Description: request.serviceLevel,
          },
        }),
        Package: request.packages.map(mapPackageToUPS),
      },
    },
  };
}

/**
 * Transform UPS RatedShipment to our domain RateQuote
 * Now with proper validation and safe parsing
 */
export function mapUPSRatedShipmentToQuote(ratedShipment: ValidatedUPSRatedShipment): RateQuote {
  // Validate that shipment has required charges
  validateRatedShipmentCharges(ratedShipment);

  // Extract monetary values safely
  const totalCharge = extractMonetaryValue(
    ratedShipment.NegotiatedRateCharges,
    ratedShipment.TotalCharges,
    'totalCharge'
  );

  const currency = extractCurrency(
    ratedShipment.NegotiatedRateCharges,
    ratedShipment.TotalCharges
  );

  // Validate and map service code to our service level
  const serviceCode = ratedShipment.Service.Code;
  const serviceLevel = validateAndMapServiceLevel(serviceCode);

  // Extract delivery date if available
  let estimatedDeliveryDate: string | undefined;
  let transitDays: number | undefined;

  if (ratedShipment.TimeInTransit?.ServiceSummary?.EstimatedArrival?.Arrival?.Date) {
    try {
      estimatedDeliveryDate = parseUPSDate(
        ratedShipment.TimeInTransit.ServiceSummary.EstimatedArrival.Arrival.Date,
        'estimatedDeliveryDate'
      );
    } catch (error) {
      // Date parsing is optional, log but don't fail
      console.warn('Failed to parse delivery date:', error);
    }
  }

  // Extract transit days safely
  if (ratedShipment.GuaranteedDelivery?.BusinessDaysInTransit) {
    try {
      transitDays = safeParseInt(
        ratedShipment.GuaranteedDelivery.BusinessDaysInTransit,
        'transitDays'
      );
    } catch (error) {
      console.warn('Failed to parse guaranteed transit days:', error);
    }
  } else if (ratedShipment.TimeInTransit?.ServiceSummary?.BusinessDaysInTransit) {
    try {
      transitDays = safeParseInt(
        ratedShipment.TimeInTransit.ServiceSummary.BusinessDaysInTransit,
        'transitDays'
      );
    } catch (error) {
      console.warn('Failed to parse transit days:', error);
    }
  }

  return {
    carrier: 'UPS',
    serviceLevel,
    serviceName: ratedShipment.Service.Description || serviceLevel,
    totalCharge,
    currency,
    estimatedDeliveryDate,
    transitDays,
    guaranteedDelivery: !!ratedShipment.GuaranteedDelivery,
  };
}
