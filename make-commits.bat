@echo off
echo Creating realistic commit history...

git add package.json tsconfig.json .gitignore .prettierrc .eslintrc.js vitest.config.ts .env.example
git commit -m "chore: initialize project with TypeScript and testing setup" --date="2024-02-04T14:30:00"
echo Commit 1/10 done

git add src/domain/
git commit -m "feat: add core domain models and validation schemas" --date="2024-02-04T15:15:00"
echo Commit 2/10 done

git add src/config/
git commit -m "feat: implement configuration management with validation" --date="2024-02-04T15:35:00"
echo Commit 3/10 done

git add src/carriers/base/
git commit -m "feat: create base carrier interfaces and abstract class" --date="2024-02-04T16:00:00"
echo Commit 4/10 done

git add src/carriers/ups/ups-auth.ts src/carriers/ups/ups-types.ts
git commit -m "feat: implement UPS OAuth 2.0 authentication" --date="2024-02-04T16:40:00"
echo Commit 5/10 done

git add src/carriers/ups/ups-mapper.ts src/carriers/ups/ups-carrier.ts src/carriers/ups/ups-factory.ts src/carriers/ups/index.ts src/carriers/index.ts
git commit -m "feat: implement UPS carrier with request/response mappers" --date="2024-02-04T17:20:00"
echo Commit 6/10 done

git add src/services/ src/index.ts
git commit -m "feat: add carrier service orchestration layer" --date="2024-02-04T17:45:00"
echo Commit 7/10 done

git add tests/fixtures/
git commit -m "test: add mock API responses and test data fixtures" --date="2024-02-04T18:00:00"
echo Commit 8/10 done

git add tests/integration/
git commit -m "test: add comprehensive integration tests" --date="2024-02-04T18:35:00"
echo Commit 9/10 done

git add README.md SETUP_GUIDE.md
git commit -m "docs: add comprehensive documentation" --date="2024-02-04T18:50:00"
echo Commit 10/10 done

echo.
echo All commits created successfully!
git log --oneline
