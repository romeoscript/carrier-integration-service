/**
 * Mock UPS OAuth token response
 * Based on UPS OAuth 2.0 documentation
 */
export const mockTokenResponse = {
  access_token: 'mock_access_token_1234567890abcdef',
  token_type: 'Bearer',
  expires_in: 14400, // 4 hours
  issued_at: '1705334400000',
};

/**
 * Mock expired token response
 */
export const mockExpiredTokenResponse = {
  access_token: 'mock_expired_token',
  token_type: 'Bearer',
  expires_in: 0,
  issued_at: '1705248000000',
};
