import { UPSCarrier } from './ups-carrier';
import { UPSAuth } from './ups-auth';
import { Config } from '../../config';

/**
 * Factory function to create a configured UPS carrier instance
 */
export function createUPSCarrier(config: Config): UPSCarrier {
  const auth = new UPSAuth(config.ups.clientId, config.ups.clientSecret, config.ups.oauthUrl);

  return new UPSCarrier(config.ups.accountNumber, auth, config.ups.apiBaseUrl);
}
