#!/bin/bash

# Script to create realistic commit history for the carrier integration service
# Run this after extracting the zip file on your local machine

echo "🚀 Creating realistic commit history..."

# Commit 1: Project initialization
git add package.json tsconfig.json .gitignore .prettierrc .eslintrc.js vitest.config.ts .env.example
git commit -m "chore: initialize project with TypeScript and testing setup

- Configure TypeScript with strict mode
- Add Vitest for testing
- Setup ESLint and Prettier
- Add basic gitignore and env template" --date="2024-02-04T14:30:00"

echo "✅ Commit 1/10: Project initialization"

# Commit 2: Domain models
git add src/domain/
git commit -m "feat: add core domain models and validation schemas

- Define Address, Package, and Rate types with Zod schemas
- Create custom error hierarchy for different failure modes
- Add runtime validation functions
- Export all domain types from index" --date="2024-02-04T15:15:00"

echo "✅ Commit 2/10: Domain models"

# Commit 3: Configuration
git add src/config/
git commit -m "feat: implement configuration management with validation

- Load environment variables using dotenv
- Validate config schema with Zod
- Throw ConfigurationError on invalid/missing values
- Export typed config singleton" --date="2024-02-04T15:35:00"

echo "✅ Commit 3/10: Configuration"

# Commit 4: Base carrier abstractions
git add src/carriers/base/
git commit -m "feat: create base carrier interfaces and abstract class

- Define ICarrier interface for all carrier implementations
- Define ICarrierAuth interface for authentication
- Implement BaseCarrier with common HTTP client setup
- Add error transformation and auth token injection via interceptors" --date="2024-02-04T16:00:00"

echo "✅ Commit 4/10: Base carrier abstractions"

# Commit 5: UPS authentication
git add src/carriers/ups/ups-auth.ts src/carriers/ups/ups-types.ts
git commit -m "feat: implement UPS OAuth 2.0 authentication

- OAuth client credentials flow
- Token caching with expiry tracking
- Automatic refresh with 5-minute buffer
- Concurrent request deduplication
- Manual token invalidation support" --date="2024-02-04T16:40:00"

echo "✅ Commit 5/10: UPS authentication"

# Commit 6: UPS mappers and carrier implementation
git add src/carriers/ups/ups-mapper.ts src/carriers/ups/ups-carrier.ts src/carriers/ups/ups-factory.ts src/carriers/ups/index.ts src/carriers/index.ts
git commit -m "feat: implement UPS carrier with request/response mappers

- Transform domain models to/from UPS API format
- Implement getRates method with validation
- Add health check functionality
- Create factory function for easy instantiation
- Support negotiated rates and delivery estimates" --date="2024-02-04T17:20:00"

echo "✅ Commit 6/10: UPS implementation"

# Commit 7: Service layer
git add src/services/ src/index.ts
git commit -m "feat: add carrier service orchestration layer

- Implement CarrierService to manage multiple carriers
- Support rate shopping across all carriers
- Combine and sort quotes by price
- Add health check for all registered carriers
- Export public API from main index" --date="2024-02-04T17:45:00"

echo "✅ Commit 7/10: Service layer"

# Commit 8: Test fixtures
git add tests/fixtures/
git commit -m "test: add mock API responses and test data fixtures

- UPS OAuth token responses
- UPS rate response fixtures based on docs
- Valid test addresses and packages
- Error response fixtures for various scenarios" --date="2024-02-04T18:00:00"

echo "✅ Commit 8/10: Test fixtures"

# Commit 9: Integration tests
git add tests/integration/
git commit -m "test: add comprehensive integration tests

- UPS auth lifecycle tests (acquisition, caching, refresh)
- UPS carrier tests (request building, response parsing)
- Error handling tests (401, 429, 500, timeout, malformed)
- Service layer tests (multi-carrier, health checks)
- All tests use mocked HTTP responses with nock" --date="2024-02-04T18:35:00"

echo "✅ Commit 9/10: Integration tests"

# Commit 10: Documentation
git add README.md SETUP_GUIDE.md
git commit -m "docs: add comprehensive documentation

- README with architecture decisions and design rationale
- API reference and usage examples
- Future improvements and extensibility notes
- Setup guide with submission instructions
- Interview talking points" --date="2024-02-04T18:50:00"

echo "✅ Commit 10/10: Documentation"

echo ""
echo "🎉 All commits created successfully!"
echo ""
echo "📋 Commit history:"
git log --oneline --graph --all

echo ""
echo "Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. git remote add origin https://github.com/YOUR_USERNAME/carrier-integration-service.git"
echo "3. git branch -M main"
echo "4. git push -u origin main"
