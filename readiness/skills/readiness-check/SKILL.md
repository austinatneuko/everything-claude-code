---
name: readiness-check
description: Use this skill when the user asks to "check readiness", "audit project", "run readiness check", "evaluate project maturity", "readiness scorecard", or wants to assess how well a project is set up for agent-assisted development. Evaluates the current project against the readiness checklist and produces a scorecard.
---

# Readiness Check Skill

Evaluate the current project against the agent readiness checklist at `~/.claude/readiness/checklist.md` and produce a scorecard with level assessment and actionable recommendations.

## Arguments

This skill accepts `$ARGUMENTS`:
- **`full`** (default) -- Evaluate all levels (L1 through L4) across all pillars
- **`quick`** -- Evaluate L1 and L2 criteria only
- **`<pillar-name>`** -- Deep dive into a single pillar (e.g., `testing`, `security`, `documentation`, `build`, `style`, `dev-environment`, `debugging`, `task-discovery`, `product`)

## Step 1: Read the Checklist

Read `~/.claude/readiness/checklist.md` to get the canonical list of criteria, levels, and thresholds.

## Step 2: Identify the Project

- Read `package.json` (if it exists) to get the project name, scripts, dependencies, and devDependencies
- If no `package.json`, check for `Cargo.toml`, `pyproject.toml`, `go.mod`, or other project manifests to identify the project type
- Record the project name for the scorecard header

## Step 3: Run All Checks

Run file existence checks in PARALLEL using multiple Glob calls in a single message. Then run content checks in PARALLEL using multiple Grep and Read calls. Minimize sequential round trips.

### 3.1 Style & Validation

**L1 -- Linter configured:**
- Glob for `eslint.config.*`, `.eslintrc*`, `biome.json`, `biome.jsonc`, `.biome.json`
- For non-JS projects: check for `ruff.toml`, `.ruff.toml`, `clippy.toml`, `.golangci.yml`
- PASS if any linter config file exists

**L1 -- Formatter configured:**
- Glob for `.prettierrc*`, `prettier.config.*`
- Read `package.json` and check for a `"prettier"` key
- Also check for `biome.json` (biome includes formatting)
- For non-JS: check for `rustfmt.toml`, `.editorconfig`
- PASS if any formatter config exists

**L2 -- TypeScript strict mode:**
- Grep `tsconfig.json` for `"strict": true` or `"strict":true`
- PASS if found (SKIP if not a TypeScript project)

**L2 -- Lint and format scripts in package.json:**
- Read `package.json` and check `scripts` for keys containing `lint` and `format` (or `fmt`)
- PASS if both exist

**L3 -- Pre-commit hook:**
- Glob for `.husky/*`, `.husky/_/*`
- Read `package.json` and check for `"lint-staged"` key or `"lint-staged"` in devDependencies
- Glob for `.pre-commit-config.yaml`
- Also check for `lefthook.yml`
- PASS if any pre-commit mechanism exists

**L3 -- CI fails on lint/type errors:**
- Glob for `.github/workflows/*.yml`, `.github/workflows/*.yaml`
- If CI files exist, Grep them for `lint`, `tsc`, `typecheck`, `type-check`, or `biome check`
- PASS if CI config references linting or type checking

**L4 -- Custom lint rules:**
- If eslint config exists, Read it and check for custom rules or plugin references beyond defaults
- Check for `eslint-plugin-*` in devDependencies
- Grep for `no-console`, `no-mutation`, `immutable`, or project-specific rule names
- PASS if custom rules or project-specific plugins configured

### 3.2 Build System

**L1 -- Single build command:**
- Read `package.json` scripts for a `build` key
- For non-JS: check for `Makefile`, `Cargo.toml`, `build.gradle`
- PASS if build command exists

**L1 -- Lockfile committed:**
- Glob for `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`
- For non-JS: `Cargo.lock`, `poetry.lock`, `go.sum`
- PASS if any lockfile exists

**L2 -- Dependency versions pinned:**
- If lockfile exists, PASS (lockfile is source of truth)

**L2 -- Build command documented:**
- Read `README.md` and Grep for `build`, `npm run build`, `pnpm build`, or equivalent
- Also check `CLAUDE.md` for build instructions
- PASS if build command appears in docs

**L3 -- Clean install in CI:**
- Grep CI workflow files for `npm ci`, `pnpm install --frozen-lockfile`, `yarn --frozen-lockfile`
- PASS if clean install command found in CI

**L3 -- Build speed or caching:**
- Grep CI files for `cache`, `turbo`, `nx`, `actions/cache`
- Check for `turbo.json`, `nx.json`
- PASS if caching configured or build tool with built-in caching used

**L3 -- Agentic feedback loop (build → test → lint):**
- Verify that ALL THREE commands exist in `package.json` scripts: `build`, `test`, `lint` (or equivalents)
- Grep CI workflow files to confirm all three run in CI
- Check that `CLAUDE.md` (if it exists) documents all three commands in a commands table
- PASS if build, test, and lint are all defined as single commands AND referenced in CI -- meaning an agent can execute the full feedback loop without human intervention

**L4 -- Dependency update automation:**
- Glob for `renovate.json`, `renovate.json5`, `.github/dependabot.yml`, `.github/dependabot.yaml`
- PASS if any dependency automation config exists

### 3.3 Testing

**L1 -- Test runner configured:**
- Glob for `vitest.config.*`, `jest.config.*`, `playwright.config.*`, `cypress.config.*`
- Check `package.json` devDependencies for `vitest`, `jest`, `mocha`, `playwright`, `cypress`
- For non-JS: check for `pytest.ini`, `setup.cfg` with `[tool:pytest]`, `Cargo.toml` test config
- PASS if test runner found

**L1 -- At least one test exists:**
- Glob for `**/*.test.*`, `**/*.spec.*`, `**/*_test.*`
- Also glob for `**/tests/**/*`, `**/test/**/*`, `**/__tests__/**/*`
- PASS if any test files found

**L2 -- Unit tests for core logic:**
- Count test files found above
- PASS if 3 or more test files exist (heuristic for meaningful coverage)

**L2 -- Tests runnable with single command:**
- Read `package.json` scripts for a `test` key
- PASS if test script exists

**L3 -- Integration tests exist:**
- Grep test files for patterns indicating integration tests: `supertest`, `request(app)`, `fetch(`, `api/`, `database`, `prisma`, `supabase`
- Or glob for files matching `**/integration/**`, `**/*.integration.*`
- PASS if integration test patterns found

**L3 -- Coverage measured (80%+ target):**
- Grep `package.json` for `coverage`
- Check test runner config for `coverageThreshold`, `coverage`, `--coverage`
- Grep CI files for `coverage`
- PASS if coverage configuration found

**L3 -- CI runs tests on PRs:**
- Grep CI workflow files for `test`, `vitest`, `jest`, `pytest`
- PASS if test execution found in CI

**L4 -- E2E tests exist:**
- Glob for `playwright.config.*`, `cypress.config.*`
- Glob for `**/*.e2e.*`, `**/e2e/**/*`, `**/cypress/**/*.cy.*`
- PASS if E2E framework configured and test files exist

**L4 -- Tests complete quickly or parallelized:**
- Grep CI files for `--shard`, `--parallel`, `matrix`, `split`
- Check for `turbo` or `nx` test orchestration
- PASS if parallelization configured (otherwise mark as "manual verification recommended")

### 3.4 Documentation

**L1 -- README.md exists:**
- Glob for `README.md`, `readme.md`
- PASS if found

**L2 -- README contains build/test/run commands:**
- Read `README.md`
- Grep for code blocks or lines containing `npm`, `pnpm`, `yarn`, `bun`, `cargo`, `python`, `go run`, `make`
- PASS if executable commands found in README

**L2 -- CLAUDE.md exists:**
- Glob for `CLAUDE.md`
- PASS if found

**L3 -- CLAUDE.md includes required sections:**
- Read `CLAUDE.md`
- Check for presence of: tech stack info, directory layout or structure, naming conventions, and common patterns
- Grep for keywords: `stack`, `structure`, `directory`, `layout`, `convention`, `pattern`
- PASS if at least 3 of these topics are covered

**L3 -- Key interfaces have JSDoc/TSDoc:**
- Grep `src/**/*.ts` or `src/**/*.tsx` for `/** ` or `@param` or `@returns`
- PASS if JSDoc comments found in source files (heuristic: at least 5 occurrences)

**L4 -- CLAUDE.md includes pitfalls and "do not" rules:**
- Grep `CLAUDE.md` for `pitfall`, `gotcha`, `do not`, `don't`, `avoid`, `never`, `warning`, `caution`
- PASS if cautionary guidance found

### 3.5 Dev Environment

**L1 -- Project runs locally:**
- PASS if build command and dependencies are configured (this is a heuristic -- cannot truly verify without running)
- Mark as "manual verification recommended" in output

**L2 -- .env.example exists:**
- Glob for `.env.example`, `.env.sample`, `.env.template`
- PASS if found

**L2 -- Node version specified:**
- Glob for `.nvmrc`, `.node-version`, `.tool-versions`
- Grep `package.json` for `"engines"`
- PASS if any version pinning found

**L3 -- Setup script or documented steps:**
- Glob for `setup.sh`, `scripts/setup.*`, `Makefile`
- Grep `README.md` for `getting started`, `setup`, `installation`, `quick start` (case-insensitive)
- PASS if setup script exists or README has setup section

**L3 -- Docker/devcontainer for services:**
- Glob for `docker-compose.yml`, `docker-compose.yaml`, `compose.yml`, `compose.yaml`
- Glob for `.devcontainer/devcontainer.json`, `.devcontainer/*.json`
- PASS if found (SKIP if project has no external service dependencies)

**L4 -- Setup validates prerequisites:**
- If setup script exists, Read it and check for version checks, prerequisite validation, or error messages
- PASS if setup script includes validation logic (otherwise "manual verification recommended")

### 3.6 Debugging & Observability

**L1 -- Errors caught and logged:**
- Grep source files for `catch`, `try`, `.catch(`, `console.error`, `logger.error`
- PASS if error handling patterns found (heuristic: at least 3 occurrences)

**L2 -- Structured logger used:**
- Grep `package.json` for `pino`, `winston`, `bunyan`, `log4js`, `consola`, `tslog`
- Or check for a custom logger module: Glob for `**/logger.*`, `**/logging.*`
- PASS if structured logging library or custom logger found

**L2 -- Error responses include context:**
- Grep source files for `requestId`, `request_id`, `correlationId`, `timestamp`, `errorCode`, `error_code`
- PASS if diagnostic context patterns found

**L3 -- Error tracking configured:**
- Grep `package.json` for `@sentry`, `sentry`, `axiom`, `bugsnag`, `rollbar`, `datadog`
- Glob for `sentry.*.config.*`, `instrument.*`
- PASS if error tracking service found

**L3 -- Health check endpoint:**
- Grep source files for `/health`, `/healthz`, `/ready`, `/readiness`, `healthCheck`, `health-check`
- PASS if health check pattern found

**L4 -- Request tracing:**
- Grep source files for `trace`, `traceId`, `trace_id`, `correlationId`, `opentelemetry`, `@opentelemetry`
- Grep `package.json` for `opentelemetry`, `dd-trace`, `jaeger`
- PASS if tracing patterns found

### 3.7 Security

**L1 -- No hardcoded secrets:**
- Grep source files (excluding `node_modules`, `dist`, `.env*`, lockfiles) for patterns:
  - `sk-[a-zA-Z0-9]` (OpenAI keys)
  - `AKIA[A-Z0-9]` (AWS keys)
  - `ghp_[a-zA-Z0-9]` (GitHub tokens)
  - `password\s*[:=]\s*["'][^"']+["']` (hardcoded passwords, excluding test files and .env.example)
- PASS if no secret patterns found in source code
- Be careful to exclude test fixtures, example configs, and documentation from false positives

**L1 -- .gitignore covers essentials:**
- Read `.gitignore`
- Check for: `.env` (or `.env*` or `.env.local`), `node_modules`, build output (`dist`, `build`, `.next`, `out`)
- PASS if .gitignore covers secrets, dependencies, and build artifacts

**L2 -- Environment variables for secrets:**
- Glob for `.env.example` or `.env.sample`
- Grep source files for `process.env.`, `import.meta.env.`, `Deno.env.get`
- PASS if env var usage found and .env.example exists

**L2 -- Input validation at boundaries:**
- Grep `package.json` for `zod`, `joi`, `yup`, `class-validator`, `superstruct`, `valibot`
- Grep source files for validation patterns: `z.object`, `Joi.object`, `yup.object`, `.validate(`, `.parse(`
- PASS if validation library used

**L3 -- Secret scanning enabled:**
- Glob for `.github/workflows/*.yml` and Grep for `gitleaks`, `trufflehog`, `secret`
- Check for `.gitleaks.toml`, `.pre-commit-config.yaml` with secret scanning
- Check GitHub settings (note: cannot check repo settings via CLI, mark as "verify in GitHub Settings")
- PASS if secret scanning tooling found in repo

**L3 -- Dependency audit in CI:**
- Grep CI files for `npm audit`, `pnpm audit`, `yarn audit`, `snyk`, `socket`
- PASS if audit command found in CI

**L3 -- Branch protection:**
- Run `git config --get-regexp 'branch\.main'` or `git config --get-regexp 'branch\.master'`
- Note: Branch protection is configured in GitHub, not locally. Mark as "verify in GitHub Settings > Branches"
- Check for `CODEOWNERS` as a proxy for review requirements
- PASS with caveat ("verify in GitHub Settings")

**L4 -- CODEOWNERS file:**
- Glob for `CODEOWNERS`, `.github/CODEOWNERS`, `docs/CODEOWNERS`
- PASS if found

### 3.8 Task Discovery

**L1 -- Issues tracked:**
- Glob for `.github/ISSUE_TEMPLATE/*`, `.github/ISSUE_TEMPLATE.md`
- Check for `.linear/`, `JIRA` references
- PASS if issue tracking artifacts found (otherwise "manual verification -- check project management tool")

**L2 -- Issue template exists:**
- Glob for `.github/ISSUE_TEMPLATE/*.md`, `.github/ISSUE_TEMPLATE/*.yml`, `.github/ISSUE_TEMPLATE/*.yaml`
- Read any found templates and verify they contain structured fields
- PASS if issue templates exist

**L2 -- PR template exists:**
- Glob for `.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/PULL_REQUEST_TEMPLATE/*`
- PASS if PR template exists

**L3 -- Labels categorize issues:**
- Glob for `.github/labels.yml`, `.github/labels.json`
- Or check if issue templates reference labels
- PASS if label configuration found (otherwise "manual verification -- check GitHub Labels settings")

**L3 -- Issues have sufficient context:**
- Read issue templates and check for fields: `description`, `acceptance criteria`, `steps to reproduce`, `expected behavior`, `context`
- PASS if templates include structured context fields

**L4 -- Stale issue automation:**
- Glob for `.github/workflows/stale.yml`, `.github/workflows/stale.yaml`
- Grep CI files for `actions/stale`
- PASS if stale automation configured

### 3.9 Product & Experimentation

**L2 -- Analytics integrated:**
- Grep `package.json` for `posthog`, `amplitude`, `mixpanel`, `segment`, `@vercel/analytics`, `plausible`, `ga-4`, `gtag`
- Grep source files for `analytics.track`, `posthog.capture`, `mixpanel.track`, `gtag(`
- PASS if analytics library or tracking calls found (otherwise "manual verification recommended")

**L3 -- Feature flags:**
- Grep `package.json` for `launchdarkly`, `posthog`, `flagsmith`, `unleash`, `split`, `statsig`, `growthbook`
- Grep source files for `featureFlag`, `feature_flag`, `isFeatureEnabled`, `useFeatureFlag`
- PASS if feature flag library or usage found

**L4 -- Automated deployment:**
- Grep CI files for `deploy`, `vercel`, `netlify`, `railway`, `fly deploy`, `aws`, `gcloud`
- Glob for `vercel.json`, `netlify.toml`, `fly.toml`, `railway.json`, `render.yaml`
- PASS if deployment automation found

**L4 -- Rollback procedure documented:**
- Grep `README.md` or `CLAUDE.md` or any `docs/**/*.md` for `rollback`, `revert`, `previous version`
- PASS if rollback documentation found (otherwise "manual verification recommended")

## Step 4: Calculate Scores

### Per-Pillar Scores

Count passing criteria vs total criteria for each pillar. Calculate percentage.

### Per-Level Scores

Aggregate criteria by level across all pillars:

| Level | Total Criteria | 80% Threshold |
|-------|---------------|---------------|
| L1    | 10            | 8             |
| L2    | 16            | 13            |
| L3    | 16            | 13            |
| L4    | 10            | 8             |

### Level Determination

Levels are cumulative:
- **L1 Functional**: 80%+ of L1 criteria pass (8/10)
- **L2 Documented**: L1 achieved AND 80%+ of L2 criteria pass (13/16)
- **L3 Standardized**: L2 achieved AND 80%+ of L3 criteria pass (13/16)
- **L4 Optimized**: L3 achieved AND 80%+ of L4 criteria pass (8/10)

If L1 is not achieved, level is **L0 (Not Ready)**.

## Step 5: Output the Scorecard

Use this exact format:

```
READINESS REPORT: <project-name>
================================

Level: L<X> (<level-name>)

Pillar Scores:
  Style & Validation:        X/Y (Z%)
  Build System:              X/Y (Z%)
  Testing:                   X/Y (Z%)
  Documentation:             X/Y (Z%)
  Dev Environment:           X/Y (Z%)
  Debugging & Observability: X/Y (Z%)
  Security:                  X/Y (Z%)
  Task Discovery:            X/Y (Z%)
  Product & Experimentation: X/Y (Z%)

Level Progression:
  L1 Functional:    X/10 (need 8) [PASS/FAIL]
  L2 Documented:    X/16 (need 13) [PASS/FAIL]
  L3 Standardized:  X/16 (need 13) [PASS/FAIL]
  L4 Optimized:     X/10 (need 8) [PASS/FAIL]

Top 3 Actions to Reach Next Level:
  1. <specific, actionable recommendation>
  2. <specific, actionable recommendation>
  3. <specific, actionable recommendation>
```

After the scorecard, list each FAILING criterion with a one-line explanation of what is missing and how to fix it. Group these by pillar. Keep each explanation to one line.

## Step 6: Recommendations

For the "Top 3 Actions" section:
- Identify the lowest-level failing criteria first (L1 before L2, etc.)
- Prioritize criteria that unblock the most other improvements
- Be specific: name the exact file to create, command to add, or config to write
- Example: "Add `\"lint\": \"eslint .\"` to package.json scripts" not "Set up linting"

## Execution Notes

- Run all Glob calls for file existence in ONE parallel batch
- Run all Grep calls for content patterns in ONE parallel batch
- Use Read only for files that need deeper inspection (package.json, tsconfig, CI configs, CLAUDE.md)
- Do NOT run the project's build, test, or lint commands -- this is a static analysis only
- For criteria marked "manual verification recommended", count them as SKIP (do not count toward pass or fail totals; adjust denominators accordingly)
- If `$ARGUMENTS` is `quick`, stop after evaluating L1 and L2 criteria and skip L3/L4
- If `$ARGUMENTS` is a pillar name, evaluate all levels for that pillar only and provide deeper analysis including specific file contents and line-by-line findings
