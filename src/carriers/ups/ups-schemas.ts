import { z } from 'zod';

/**
 * Schema for UPS OAuth token response
 * Validates the structure returned from UPS OAuth endpoint
 */
export const UPSTokenResponseSchema = z.object({
  access_token: z.string().min(1, 'Access token cannot be empty'),
  token_type: z.string(),
  expires_in: z.number().positive('Expires in must be positive'),
  issued_at: z.string(),
});

export type UPSTokenResponse = z.infer<typeof UPSTokenResponseSchema>;

/**
 * Schema for UPS Address in API responses (for address validation when needed)
 */
export const UPSAddressSchema = z.object({
  AddressLine: z.array(z.string()).optional(),
  City: z.string(),
  StateProvinceCode: z.string(),
  PostalCode: z.string(),
  CountryCode: z.string(),
  ResidentialAddressIndicator: z.string().optional(),
});

/**
 * Schema for monetary values from UPS
 */
const MonetaryValueSchema = z.object({
  CurrencyCode: z.string().length(3, 'Currency code must be 3 characters'),
  MonetaryValue: z.string().regex(/^\d+\.?\d*$/, 'MonetaryValue must be a valid number string'),
});

/**
 * Schema for UPS service
 */
const UPSServiceSchema = z.object({
  Code: z.string().min(1, 'Service code is required'),
  Description: z.string().optional(),
});

/**
 * Schema for guaranteed delivery info
 */
const GuaranteedDeliverySchema = z.object({
  BusinessDaysInTransit: z.string().optional(),
});

/**
 * Schema for time in transit details
 */
const TimeInTransitSchema = z.object({
  ServiceSummary: z.object({
    Service: z.object({
      Description: z.string(),
    }),
    EstimatedArrival: z.object({
      Arrival: z.object({
        Date: z.string().optional(),
        Time: z.string().optional(),
      }),
    }).optional(),
    BusinessDaysInTransit: z.string().optional(),
  }),
});

/**
 * Schema for a single rated shipment from UPS
 */
const UPSRatedShipmentSchema = z.object({
  Service: UPSServiceSchema,
  RatedShipmentAlert: z.array(z.object({
    Code: z.string(),
    Description: z.string(),
  })).optional(),
  BillingWeight: z.object({
    UnitOfMeasurement: z.object({
      Code: z.string(),
    }),
    Weight: z.string(),
  }).optional(),
  TransportationCharges: MonetaryValueSchema.optional(),
  ServiceOptionsCharges: MonetaryValueSchema.optional(),
  TotalCharges: MonetaryValueSchema,
  NegotiatedRateCharges: z.object({
    TotalCharge: MonetaryValueSchema.optional(),
  }).optional(),
  GuaranteedDelivery: GuaranteedDeliverySchema.optional(),
  TimeInTransit: TimeInTransitSchema.optional(),
});

/**
 * Complete schema for UPS Rate API response
 */
export const UPSRateResponseSchema = z.object({
  RateResponse: z.object({
    Response: z.object({
      ResponseStatus: z.object({
        Code: z.string(),
        Description: z.string(),
      }),
      TransactionReference: z.object({
        CustomerContext: z.string().optional(),
      }).optional(),
    }),
    RatedShipment: z.array(UPSRatedShipmentSchema).min(1, 'At least one rated shipment is required'),
  }),
});

export type ValidatedUPSRateResponse = z.infer<typeof UPSRateResponseSchema>;
export type ValidatedUPSRatedShipment = z.infer<typeof UPSRatedShipmentSchema>;

/**
 * Schema for UPS error responses
 */
export const UPSErrorResponseSchema = z.object({
  response: z.object({
    errors: z.array(z.object({
      code: z.string(),
      message: z.string(),
    })),
  }),
});