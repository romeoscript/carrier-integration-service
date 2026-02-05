import { Address, Package, RateRequest, RateQuote, ServiceLevel } from '../../domain';
import {
  UPSRateRequest,
  UPSRatedShipment,
  UPSAddress,
  UPSPackage,
  UPS_SERVICE_CODES,
  SERVICE_LEVEL_TO_UPS_CODE,
} from './ups-types';

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

export function mapUPSRatedShipmentToQuote(ratedShipment: UPSRatedShipment): RateQuote {
  // Prefer negotiated rates (account-specific discounts) over published rates
  const totalCharge =
    ratedShipment.NegotiatedRateCharges?.TotalCharge.MonetaryValue ||
    ratedShipment.TotalCharges.MonetaryValue;

  const currency =
    ratedShipment.NegotiatedRateCharges?.TotalCharge.CurrencyCode ||
    ratedShipment.TotalCharges.CurrencyCode;

  const serviceCode = ratedShipment.Service.Code;
  const serviceLevel = (UPS_SERVICE_CODES[serviceCode] || 'STANDARD') as ServiceLevel;

  let estimatedDeliveryDate: string | undefined;
  let transitDays: number | undefined;

  if (ratedShipment.TimeInTransit?.ServiceSummary?.EstimatedArrival?.Arrival) {
    const arrival = ratedShipment.TimeInTransit.ServiceSummary.EstimatedArrival.Arrival;
    const dateStr = arrival.Date;
    // UPS returns dates in YYYYMMDD format
    if (dateStr && dateStr.length === 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      estimatedDeliveryDate = `${year}-${month}-${day}`;
    }
  }

  if (ratedShipment.GuaranteedDelivery?.BusinessDaysInTransit) {
    transitDays = parseInt(ratedShipment.GuaranteedDelivery.BusinessDaysInTransit, 10);
  } else if (ratedShipment.TimeInTransit?.ServiceSummary?.BusinessDaysInTransit) {
    transitDays = parseInt(ratedShipment.TimeInTransit.ServiceSummary.BusinessDaysInTransit, 10);
  }

  return {
    carrier: 'UPS',
    serviceLevel,
    serviceName: ratedShipment.Service.Description || serviceLevel,
    totalCharge: parseFloat(totalCharge),
    currency,
    estimatedDeliveryDate,
    transitDays,
    guaranteedDelivery: !!ratedShipment.GuaranteedDelivery,
  };
}
