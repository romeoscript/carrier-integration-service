import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import { UPSCarrier, UPSAuth } from '../../src/carriers/ups';
import {
  ValidationError,
  AuthenticationError,
  RateLimitError,
  CarrierAPIError,
} from '../../src/domain';
import {
  mockTokenResponse,
  mockSuccessfulRateResponse,
  mockSingleServiceRateResponse,
  validRateRequest,
  validRateRequestWithService,
} from '../fixtures';

describe('UPSCarrier Integration Tests', () => {
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

    // Mock OAuth token request for all tests
    nock('https://wwwcie.ups.com')
      .post('/security/v1/oauth/token')
      .reply(200, mockTokenResponse)
      .persist();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Rate Shopping - Success Cases', () => {
    it('should successfully fetch rates for valid request', async () => {
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(200, mockSuccessfulRateResponse);

      const response = await upsCarrier.getRates(validRateRequest);

      expect(response.quotes).toBeDefined();
      expect(response.quotes.length).toBe(3);
      expect(response.quotes[0].carrier).toBe('UPS');
    });

    it('should correctly parse and normalize UPS rate response', async () => {
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(200, mockSuccessfulRateResponse);

      const response = await upsCarrier.getRates(validRateRequest);

      // Check first quote (Ground)
      const groundQuote = response.quotes.find((q) => q.serviceLevel === 'GROUND');
      expect(groundQuote).toBeDefined();
      expect(groundQuote?.totalCharge).toBe(10.89); // Negotiated rate
      expect(groundQuote?.currency).toBe('USD');
      expect(groundQuote?.transitDays).toBe(3);
      expect(groundQuote?.estimatedDeliveryDate).toBe('2024-01-25');
    });

    it('should handle request with specific service level', async () => {
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(200, mockSingleServiceRateResponse);

      const response = await upsCarrier.getRates(validRateRequestWithService);

      expect(response.quotes.length).toBe(1);
      expect(response.quotes[0].serviceLevel).toBe('GROUND');
    });

    it('should send properly formatted request to UPS API', async () => {
      const scope = nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate', (body) => {
          const request = body.RateRequest;
          
          // Verify request structure
          expect(request.Shipment).toBeDefined();
          expect(request.Shipment.Shipper.ShipperNumber).toBe(accountNumber);
          expect(request.Shipment.Package).toHaveLength(1);
          
          return true;
        })
        .reply(200, mockSuccessfulRateResponse);

      await upsCarrier.getRates(validRateRequest);

      expect(scope.isDone()).toBe(true);
    });

    it('should include auth token in request headers', async () => {
      const scope = nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .matchHeader('Authorization', `Bearer ${mockTokenResponse.access_token}`)
        .reply(200, mockSuccessfulRateResponse);

      await upsCarrier.getRates(validRateRequest);

      expect(scope.isDone()).toBe(true);
    });
  });

  describe('Request Validation', () => {
    it('should validate request before making API call', async () => {
      const invalidRequest = {
        origin: { street1: '', city: '', state: '', postalCode: '' }, // Invalid
        destination: validRateRequest.destination,
        packages: validRateRequest.packages,
      };

      await expect(upsCarrier.getRates(invalidRequest as any)).rejects.toThrow();
    });

    it('should reject request with no packages', async () => {
      const invalidRequest = {
        ...validRateRequest,
        packages: [],
      };

      await expect(upsCarrier.getRates(invalidRequest as any)).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 authentication errors', async () => {
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(401, {
          response: {
            errors: [{ code: '250001', message: 'Invalid Authentication' }],
          },
        });

      await expect(upsCarrier.getRates(validRateRequest)).rejects.toThrow(AuthenticationError);
    });

    it('should handle 429 rate limit errors', async () => {
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(429, {}, { 'Retry-After': '60' });

      await expect(upsCarrier.getRates(validRateRequest)).rejects.toThrow(RateLimitError);
    });

    it('should handle 400 bad request errors', async () => {
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(400, {
          response: {
            errors: [{ code: '250003', message: 'Invalid Address' }],
          },
        });

      await expect(upsCarrier.getRates(validRateRequest)).rejects.toThrow(CarrierAPIError);
    });

    it('should handle network timeout', async () => {
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .replyWithError({ code: 'ETIMEDOUT', message: 'Timeout' });

      await expect(upsCarrier.getRates(validRateRequest)).rejects.toThrow();
    });

    it('should handle malformed JSON response', async () => {
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(200, 'Not valid JSON');

      await expect(upsCarrier.getRates(validRateRequest)).rejects.toThrow();
    });

    it('should handle 500 server errors', async () => {
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(500, {
          response: {
            errors: [{ code: '500000', message: 'Internal Server Error' }],
          },
        });

      await expect(upsCarrier.getRates(validRateRequest)).rejects.toThrow(CarrierAPIError);
    });
  });

  describe('Auth Token Lifecycle', () => {
    it('should automatically refresh expired token', async () => {
      const expiredToken = { ...mockTokenResponse, access_token: 'expired_token', expires_in: 1 };
      const freshToken = { ...mockTokenResponse, access_token: 'fresh_token' };

      // First OAuth call returns short-lived token
      nock.cleanAll();
      nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .reply(200, expiredToken);

      // Make first rate request
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .matchHeader('Authorization', 'Bearer expired_token')
        .reply(200, mockSuccessfulRateResponse);

      await upsCarrier.getRates(validRateRequest);

      // Wait for token to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Second OAuth call returns fresh token
      nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .reply(200, freshToken);

      // Second rate request should use fresh token
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .matchHeader('Authorization', 'Bearer fresh_token')
        .reply(200, mockSuccessfulRateResponse);

      await upsCarrier.getRates(validRateRequest);
    });

    it('should invalidate and refresh token on 401 error', async () => {
      const freshToken = { ...mockTokenResponse, access_token: 'refreshed_token' };

      // First request gets 401
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(401, { error: 'Invalid token' });

      await expect(upsCarrier.getRates(validRateRequest)).rejects.toThrow(AuthenticationError);

      // Subsequent request should fetch new token
      nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .reply(200, freshToken);

      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .matchHeader('Authorization', 'Bearer refreshed_token')
        .reply(200, mockSuccessfulRateResponse);

      const response = await upsCarrier.getRates(validRateRequest);
      expect(response.quotes).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('should return true when auth is successful', async () => {
      const isHealthy = await upsCarrier.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false when auth fails', async () => {
      nock.cleanAll();
      nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .reply(401, { error: 'Unauthorized' });

      const isHealthy = await upsCarrier.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });
});
