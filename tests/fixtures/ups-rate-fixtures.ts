/**
 * Mock UPS Rate Response fixtures
 * Based on actual UPS Rating API documentation payloads
 */

/**
 * Successful rate response with multiple service levels
 */
export const mockSuccessfulRateResponse = {
  RateResponse: {
    Response: {
      ResponseStatus: {
        Code: '1',
        Description: 'Success',
      },
      TransactionReference: {
        CustomerContext: 'Rating Request',
      },
    },
    RatedShipment: [
      {
        Service: {
          Code: '03',
          Description: 'UPS Ground',
        },
        BillingWeight: {
          UnitOfMeasurement: {
            Code: 'LBS',
          },
          Weight: '5.0',
        },
        TransportationCharges: {
          CurrencyCode: 'USD',
          MonetaryValue: '12.45',
        },
        ServiceOptionsCharges: {
          CurrencyCode: 'USD',
          MonetaryValue: '0.00',
        },
        TotalCharges: {
          CurrencyCode: 'USD',
          MonetaryValue: '12.45',
        },
        NegotiatedRateCharges: {
          TotalCharge: {
            CurrencyCode: 'USD',
            MonetaryValue: '10.89',
          },
        },
        GuaranteedDelivery: {
          BusinessDaysInTransit: '3',
        },
        TimeInTransit: {
          ServiceSummary: {
            Service: {
              Description: 'UPS Ground',
            },
            EstimatedArrival: {
              Arrival: {
                Date: '20240125',
                Time: '120000',
              },
            },
            BusinessDaysInTransit: '3',
          },
        },
      },
      {
        Service: {
          Code: '02',
          Description: 'UPS 2nd Day Air',
        },
        BillingWeight: {
          UnitOfMeasurement: {
            Code: 'LBS',
          },
          Weight: '5.0',
        },
        TransportationCharges: {
          CurrencyCode: 'USD',
          MonetaryValue: '25.67',
        },
        ServiceOptionsCharges: {
          CurrencyCode: 'USD',
          MonetaryValue: '0.00',
        },
        TotalCharges: {
          CurrencyCode: 'USD',
          MonetaryValue: '25.67',
        },
        NegotiatedRateCharges: {
          TotalCharge: {
            CurrencyCode: 'USD',
            MonetaryValue: '22.34',
          },
        },
        GuaranteedDelivery: {
          BusinessDaysInTransit: '2',
        },
        TimeInTransit: {
          ServiceSummary: {
            Service: {
              Description: 'UPS 2nd Day Air',
            },
            EstimatedArrival: {
              Arrival: {
                Date: '20240123',
                Time: '120000',
              },
            },
            BusinessDaysInTransit: '2',
          },
        },
      },
      {
        Service: {
          Code: '01',
          Description: 'UPS Next Day Air',
        },
        BillingWeight: {
          UnitOfMeasurement: {
            Code: 'LBS',
          },
          Weight: '5.0',
        },
        TransportationCharges: {
          CurrencyCode: 'USD',
          MonetaryValue: '45.89',
        },
        ServiceOptionsCharges: {
          CurrencyCode: 'USD',
          MonetaryValue: '0.00',
        },
        TotalCharges: {
          CurrencyCode: 'USD',
          MonetaryValue: '45.89',
        },
        NegotiatedRateCharges: {
          TotalCharge: {
            CurrencyCode: 'USD',
            MonetaryValue: '39.99',
          },
        },
        GuaranteedDelivery: {
          BusinessDaysInTransit: '1',
        },
        TimeInTransit: {
          ServiceSummary: {
            Service: {
              Description: 'UPS Next Day Air',
            },
            EstimatedArrival: {
              Arrival: {
                Date: '20240122',
                Time: '103000',
              },
            },
            BusinessDaysInTransit: '1',
          },
        },
      },
    ],
  },
};

/**
 * Rate response for a single service level
 */
export const mockSingleServiceRateResponse = {
  RateResponse: {
    Response: {
      ResponseStatus: {
        Code: '1',
        Description: 'Success',
      },
    },
    RatedShipment: [
      {
        Service: {
          Code: '03',
          Description: 'UPS Ground',
        },
        TotalCharges: {
          CurrencyCode: 'USD',
          MonetaryValue: '12.45',
        },
        GuaranteedDelivery: {
          BusinessDaysInTransit: '3',
        },
      },
    ],
  },
};

/**
 * Error response - invalid address
 */
export const mockInvalidAddressError = {
  response: {
    errors: [
      {
        code: '250003',
        message: 'Invalid Address',
      },
    ],
  },
};

/**
 * Error response - unauthorized
 */
export const mockUnauthorizedError = {
  response: {
    errors: [
      {
        code: '250001',
        message: 'Invalid Authentication Information',
      },
    ],
  },
};
