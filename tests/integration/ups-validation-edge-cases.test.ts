import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import { UPSCarrier, UPSAuth } from '../../src/carriers/ups';
import { ValidationError } from '../../src/domain';
import { mockTokenResponse, validRateRequest } from '../fixtures';

describe('UPS Validation Edge Cases', () => {
  const clientId = 'test_client';
  const clientSecret = 'test_secret';
  const accountNumber = 'test_account';
  const oauthUrl = 'https://wwwcie.ups.com/security/v1/oauth/token';
  const baseURL = 'https://wwwcie.ups.com/api';

  let upsCarrier: UPSCarrier;
  let upsAuth: UPSAuth;

  beforeEach(() => {
    upsAuth = new UPSAuth(clientId, clientSecret, oauthUrl);
    upsCarrier = new UPSCarrier(accountNumber, upsAuth, baseURL);
    nock.cleanAll();

    // Mock OAuth token request
    nock('https://wwwcie.ups.com')
      .post('/security/v1/oauth/token')
      .reply(200, mockTokenResponse)
      .persist();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Missing Response Fields', () => {
    it('should throw ValidationError when RateResponse is missing', async () => {
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(200, {});

      await expect(upsCarrier.getRates(validRateRequest)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when RatedShipment array is empty', async () => {
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(200, {
          RateResponse: {
            Response: {
              ResponseStatus: { Code: '1', Description: 'Success' },
            },
            RatedShipment: [],
          },
        });

      const err = await upsCarrier.getRates(validRateRequest).then(() => null, (e) => e);
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as Error).message).toMatch(
        /Invalid UPS Rate API response structure|At least one rated shipment is required/
      );
    });

    it('should throw ValidationError when TotalCharges is missing', async () => {
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(200, {
          RateResponse: {
            Response: {
              ResponseStatus: { Code: '1', Description: 'Success' },
            },
            RatedShipment: [
              {
                Service: { Code: '03' },
                // TotalCharges missing
              },
            ],
          },
        });

      await expect(upsCarrier.getRates(validRateRequest)).rejects.toThrow(ValidationError);
    });
  });

  describe('Invalid Number Formats', () => {
    it('should throw ValidationError when MonetaryValue is not numeric', async () => {
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(200, {
          RateResponse: {
            Response: {
              ResponseStatus: { Code: '1', Description: 'Success' },
            },
            RatedShipment: [
              {
                Service: { Code: '03', Description: 'Ground' },
                TotalCharges: {
                  CurrencyCode: 'USD',
                  MonetaryValue: 'invalid_number',
                },
              },
            ],
          },
        });

      await expect(upsCarrier.getRates(validRateRequest)).rejects.toThrow(ValidationError);
    });

    it('should handle invalid BusinessDaysInTransit gracefully', async () => {
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(200, {
          RateResponse: {
            Response: {
              ResponseStatus: { Code: '1', Description: 'Success' },
            },
            RatedShipment: [
              {
                Service: { Code: '03', Description: 'Ground' },
                TotalCharges: {
                  CurrencyCode: 'USD',
                  MonetaryValue: '10.50',
                },
                GuaranteedDelivery: {
                  BusinessDaysInTransit: 'abc', // Invalid
                },
              },
            ],
          },
        });

      // Should not throw - transit days parsing is optional
      const response = await upsCarrier.getRates(validRateRequest);
      expect(response.quotes[0].transitDays).toBeUndefined();
    });
  });

  describe('Invalid Service Codes', () => {
    it('should throw ValidationError for unknown service code', async () => {
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(200, {
          RateResponse: {
            Response: {
              ResponseStatus: { Code: '1', Description: 'Success' },
            },
            RatedShipment: [
              {
                Service: { Code: 'INVALID_CODE', Description: 'Unknown' },
                TotalCharges: {
                  CurrencyCode: 'USD',
                  MonetaryValue: '10.50',
                },
              },
            ],
          },
        })
        .persist();

      await expect(upsCarrier.getRates(validRateRequest)).rejects.toThrow(ValidationError);
      await expect(upsCarrier.getRates(validRateRequest)).rejects.toThrow('Unknown UPS service code');
    });
  });

  describe('Malformed OAuth Responses', () => {
    it('should throw ValidationError when access_token is missing', async () => {
      nock.cleanAll();
      nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .reply(200, {
          token_type: 'Bearer',
          expires_in: 14400,
          issued_at: '1234567890',
          // access_token missing
        });

      await expect(upsAuth.getToken()).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when expires_in is not a number', async () => {
      nock.cleanAll();
      nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .reply(200, {
          access_token: 'token',
          token_type: 'Bearer',
          expires_in: 'not_a_number',
          issued_at: '1234567890',
        });

      await expect(upsAuth.getToken()).rejects.toThrow(ValidationError);
    });
  });

  describe('Partial Optional Chaining Scenarios', () => {
    it('should handle NegotiatedRateCharges present but TotalCharge missing', async () => {
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(200, {
          RateResponse: {
            Response: {
              ResponseStatus: { Code: '1', Description: 'Success' },
            },
            RatedShipment: [
              {
                Service: { Code: '03', Description: 'Ground' },
                NegotiatedRateCharges: {}, // Present but no TotalCharge
                TotalCharges: {
                  CurrencyCode: 'USD',
                  MonetaryValue: '10.50',
                },
              },
            ],
          },
        });

      // Should fall back to TotalCharges
      const response = await upsCarrier.getRates(validRateRequest);
      expect(response.quotes[0].totalCharge).toBe(10.5);
    });
  });

  describe('Date Format Edge Cases', () => {
    it('should handle invalid date formats gracefully', async () => {
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(200, {
          RateResponse: {
            Response: {
              ResponseStatus: { Code: '1', Description: 'Success' },
            },
            RatedShipment: [
              {
                Service: { Code: '03', Description: 'Ground' },
                TotalCharges: {
                  CurrencyCode: 'USD',
                  MonetaryValue: '10.50',
                },
                TimeInTransit: {
                  ServiceSummary: {
                    Service: { Description: 'Ground' },
                    EstimatedArrival: {
                      Arrival: {
                        Date: '2024125', // Invalid format (7 chars)
                        Time: '120000',
                      },
                    },
                  },
                },
              },
            ],
          },
        });

      // Should not throw - date parsing is optional
      const response = await upsCarrier.getRates(validRateRequest);
      expect(response.quotes[0].estimatedDeliveryDate).toBeUndefined();
    });
  });
});
