import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import { UPSAuth } from '../../src/carriers/ups';
import { AuthenticationError } from '../../src/domain';
import { mockTokenResponse } from '../fixtures';

describe('UPSAuth Integration Tests', () => {
  const clientId = 'test_client_id';
  const clientSecret = 'test_client_secret';
  const oauthUrl = 'https://wwwcie.ups.com/security/v1/oauth/token';
  
  let upsAuth: UPSAuth;

  beforeEach(() => {
    upsAuth = new UPSAuth(clientId, clientSecret, oauthUrl);
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Token Acquisition', () => {
    it('should successfully fetch and cache an access token', async () => {
      // Mock the OAuth endpoint
      nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .reply(200, mockTokenResponse);

      const token = await upsAuth.getToken();

      expect(token).toBe(mockTokenResponse.access_token);
    });

    it('should send correct credentials in Basic Auth format', async () => {
      const expectedAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      const scope = nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .matchHeader('Authorization', `Basic ${expectedAuth}`)
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .reply(200, mockTokenResponse);

      await upsAuth.getToken();

      expect(scope.isDone()).toBe(true);
    });

    it('should send grant_type=client_credentials in request body', async () => {
      const scope = nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token', (body) => {
          return body === 'grant_type=client_credentials';
        })
        .reply(200, mockTokenResponse);

      await upsAuth.getToken();

      expect(scope.isDone()).toBe(true);
    });
  });

  describe('Token Caching and Reuse', () => {
    it('should reuse cached token on subsequent calls', async () => {
      // Mock only one call
      nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .once()
        .reply(200, mockTokenResponse);

      const token1 = await upsAuth.getToken();
      const token2 = await upsAuth.getToken();
      const token3 = await upsAuth.getToken();

      expect(token1).toBe(token2);
      expect(token2).toBe(token3);
    });

    it('should refresh token after expiry', async () => {
      const firstToken = { ...mockTokenResponse, access_token: 'first_token', expires_in: 1 };
      const secondToken = { ...mockTokenResponse, access_token: 'second_token' };

      // First request
      nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .reply(200, firstToken);

      const token1 = await upsAuth.getToken();
      expect(token1).toBe('first_token');

      // Wait for token to expire (1 second + buffer)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Second request should fetch new token
      nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .reply(200, secondToken);

      const token2 = await upsAuth.getToken();
      expect(token2).toBe('second_token');
      expect(token2).not.toBe(token1);
    });
  });

  describe('Token Invalidation', () => {
    it('should fetch new token after manual invalidation', async () => {
      const firstToken = { ...mockTokenResponse, access_token: 'first_token' };
      const secondToken = { ...mockTokenResponse, access_token: 'second_token' };

      nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .reply(200, firstToken);

      const token1 = await upsAuth.getToken();
      expect(token1).toBe('first_token');

      // Invalidate token
      await upsAuth.invalidateToken();

      // Should fetch new token
      nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .reply(200, secondToken);

      const token2 = await upsAuth.getToken();
      expect(token2).toBe('second_token');
    });
  });

  describe('Error Handling', () => {
    it('should throw AuthenticationError on 401 response', async () => {
      nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .reply(401, {
          error: 'invalid_client',
          error_description: 'Invalid client credentials',
        });

      await expect(upsAuth.getToken()).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError on network failure', async () => {
      nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .replyWithError('Network error');

      await expect(upsAuth.getToken()).rejects.toThrow(AuthenticationError);
    });

    it('should handle malformed response gracefully', async () => {
      nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .reply(200, 'invalid json');

      await expect(upsAuth.getToken()).rejects.toThrow();
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent token requests without duplicate calls', async () => {
      // Mock only one OAuth call
      nock('https://wwwcie.ups.com')
        .post('/security/v1/oauth/token')
        .once()
        .reply(200, mockTokenResponse);

      // Make multiple concurrent requests
      const [token1, token2, token3] = await Promise.all([
        upsAuth.getToken(),
        upsAuth.getToken(),
        upsAuth.getToken(),
      ]);

      // All should return the same token
      expect(token1).toBe(mockTokenResponse.access_token);
      expect(token2).toBe(mockTokenResponse.access_token);
      expect(token3).toBe(mockTokenResponse.access_token);
    });
  });
});
