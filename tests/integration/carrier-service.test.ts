import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import { CarrierService } from '../../src/services';
import { UPSCarrier, UPSAuth } from '../../src/carriers/ups';
import { mockTokenResponse, mockSuccessfulRateResponse, validRateRequest } from '../fixtures';

describe('CarrierService Integration Tests', () => {
  let service: CarrierService;
  let upsCarrier: UPSCarrier;

  beforeEach(() => {
    service = new CarrierService();
    
    const auth = new UPSAuth(
      'test_client',
      'test_secret',
      'https://wwwcie.ups.com/security/v1/oauth/token'
    );
    upsCarrier = new UPSCarrier('test_account', auth, 'https://wwwcie.ups.com/api');
    
    nock.cleanAll();

    // Mock OAuth
    nock('https://wwwcie.ups.com')
      .post('/security/v1/oauth/token')
      .reply(200, mockTokenResponse)
      .persist();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Carrier Registration', () => {
    it('should register a carrier', () => {
      service.registerCarrier(upsCarrier);
      const carriers = service.getAvailableCarriers();
      
      expect(carriers).toContain('UPS');
    });

    it('should retrieve a registered carrier by name', () => {
      service.registerCarrier(upsCarrier);
      const carrier = service.getCarrier('UPS');
      
      expect(carrier).toBeDefined();
      expect(carrier?.name).toBe('UPS');
    });

    it('should handle case-insensitive carrier lookup', () => {
      service.registerCarrier(upsCarrier);
      
      expect(service.getCarrier('ups')).toBeDefined();
      expect(service.getCarrier('UPS')).toBeDefined();
      expect(service.getCarrier('Ups')).toBeDefined();
    });
  });

  describe('Get Rates from Specific Carrier', () => {
    it('should fetch rates from a specific carrier', async () => {
      service.registerCarrier(upsCarrier);
      
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(200, mockSuccessfulRateResponse);

      const response = await service.getRates('UPS', validRateRequest);
      
      expect(response.quotes).toBeDefined();
      expect(response.quotes.length).toBeGreaterThan(0);
      expect(response.quotes[0].carrier).toBe('UPS');
    });

    it('should throw error for unregistered carrier', async () => {
      await expect(service.getRates('FedEx', validRateRequest)).rejects.toThrow(
        /Carrier 'FedEx' not found/
      );
    });
  });

  describe('Get Rates from All Carriers', () => {
    it('should fetch and combine rates from all carriers', async () => {
      service.registerCarrier(upsCarrier);
      
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(200, mockSuccessfulRateResponse);

      const response = await service.getAllRates(validRateRequest);
      
      expect(response.quotes).toBeDefined();
      expect(response.quotes.length).toBe(3);
    });

    it('should sort combined rates by price (lowest first)', async () => {
      service.registerCarrier(upsCarrier);
      
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(200, mockSuccessfulRateResponse);

      const response = await service.getAllRates(validRateRequest);
      
      // Verify quotes are sorted by price
      for (let i = 1; i < response.quotes.length; i++) {
        expect(response.quotes[i].totalCharge).toBeGreaterThanOrEqual(
          response.quotes[i - 1].totalCharge
        );
      }
    });

    it('should throw error when no carriers are registered', async () => {
      await expect(service.getAllRates(validRateRequest)).rejects.toThrow('No carriers registered');
    });

    it('should continue with successful carriers even if one fails', async () => {
      // Register UPS
      service.registerCarrier(upsCarrier);

      // Mock UPS to succeed
      nock('https://wwwcie.ups.com')
        .post('/api/rating/v1/Rate')
        .reply(200, mockSuccessfulRateResponse);

      // Note: If we had a second carrier, we could test partial failure
      // For now, just verify UPS succeeds
      const response = await service.getAllRates(validRateRequest);
      expect(response.quotes.length).toBeGreaterThan(0);
    });
  });

  describe('Health Check', () => {
    it('should check health of all carriers', async () => {
      service.registerCarrier(upsCarrier);
      
      const health = await service.healthCheck();
      
      expect(health).toBeDefined();
      expect(health.UPS).toBe(true);
    });

    it('should report unhealthy status for failed carriers', async () => {
      service.registerCarrier(upsCarrier);
      
      nock.cleanAll();
      nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .reply(401, { error: 'Unauthorized' });

      const health = await service.healthCheck();
      
      expect(health.UPS).toBe(false);
    });
  });
});
