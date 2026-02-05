export interface UPSRateRequest {
  RateRequest: {
    Request: {
      TransactionReference?: {
        CustomerContext?: string;
      };
    };
    Shipment: {
      ShipmentRatingOptions?: {
        NegotiatedRatesIndicator?: string;
      };
      Shipper: {
        Name?: string;
        ShipperNumber: string;
        Address: UPSAddress;
      };
      ShipTo: {
        Name?: string;
        Address: UPSAddress;
      };
      ShipFrom?: {
        Name?: string;
        Address: UPSAddress;
      };
      Service?: {
        Code: string;
        Description?: string;
      };
      Package: UPSPackage[];
    };
  };
}

export interface UPSAddress {
  AddressLine?: string[];
  City: string;
  StateProvinceCode: string;
  PostalCode: string;
  CountryCode: string;
  ResidentialAddressIndicator?: string;
}

export interface UPSPackage {
  PackagingType: {
    Code: string;
    Description?: string;
  };
  Dimensions?: {
    UnitOfMeasurement: {
      Code: string;
    };
    Length: string;
    Width: string;
    Height: string;
  };
  PackageWeight: {
    UnitOfMeasurement: {
      Code: string;
    };
    Weight: string;
  };
  PackageServiceOptions?: {
    DeclaredValue?: {
      CurrencyCode: string;
      MonetaryValue: string;
    };
  };
}

export interface UPSRateResponse {
  RateResponse: {
    Response: {
      ResponseStatus: {
        Code: string;
        Description: string;
      };
      TransactionReference?: {
        CustomerContext?: string;
      };
    };
    RatedShipment: UPSRatedShipment[];
  };
}

export interface UPSRatedShipment {
  Service: {
    Code: string;
    Description?: string;
  };
  RatedShipmentAlert?: Array<{
    Code: string;
    Description: string;
  }>;
  BillingWeight?: {
    UnitOfMeasurement: {
      Code: string;
    };
    Weight: string;
  };
  TransportationCharges?: {
    CurrencyCode: string;
    MonetaryValue: string;
  };
  ServiceOptionsCharges?: {
    CurrencyCode: string;
    MonetaryValue: string;
  };
  TotalCharges: {
    CurrencyCode: string;
    MonetaryValue: string;
  };
  NegotiatedRateCharges?: {
    TotalCharge: {
      CurrencyCode: string;
      MonetaryValue: string;
    };
  };
  GuaranteedDelivery?: {
    BusinessDaysInTransit: string;
  };
  TimeInTransit?: {
    ServiceSummary: {
      Service: {
        Description: string;
      };
      EstimatedArrival: {
        Arrival: {
          Date: string;
          Time: string;
        };
      };
      BusinessDaysInTransit?: string;
    };
  };
}

export const UPS_SERVICE_CODES: Record<string, string> = {
  '03': 'GROUND',
  '12': 'NEXT_DAY_AIR',
  '01': 'NEXT_DAY_AIR',
  '14': 'NEXT_DAY_AIR_EARLY',
  '13': 'NEXT_DAY_AIR_SAVER',
  '02': '2ND_DAY_AIR',
  '59': '2ND_DAY_AIR',
  '11': 'STANDARD',
};

export const SERVICE_LEVEL_TO_UPS_CODE: Record<string, string> = {
  GROUND: '03',
  NEXT_DAY_AIR: '01',
  NEXT_DAY_AIR_EARLY: '14',
  '2ND_DAY_AIR': '02',
  STANDARD: '11',
  EXPRESS: '01',
  EXPRESS_SAVER: '13',
  '3_DAY_SELECT': '12',
};
