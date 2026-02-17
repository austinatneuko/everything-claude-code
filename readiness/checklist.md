# Agent Readiness Checklist

## Scoring

Count passing criteria per level. Pass **80% of a level's criteria** before claiming that level.

| Level | Description | Criteria | 80% Threshold | Your Score |
|-------|------------|----------|---------------|------------|
| L1 Functional | Code runs, manual setup | 10 | 8 | ___ |
| L2 Documented | Basic docs, workflows written down | 16 | 13 | ___ |
| L3 Standardized | Processes enforced through automation | 16 | 13 | ___ |
| L4 Optimized | Fast feedback loops, data-driven | 10 | 8 | ___ |

**Target: L3 as baseline. L4 as aspiration.**

Levels are cumulative: L3 requires L1 and L2 to pass first.

---

## 1. Style & Validation

_Without automated style enforcement, every agent generation drifts and review cycles multiply._

- [ ] **[L1]** Linter installed and configured (`eslint.config.js` or equivalent)
- [ ] **[L1]** Formatter installed and configured (prettier config or equivalent)
- [ ] **[L2]** TypeScript strict mode enabled (`"strict": true` in `tsconfig.json`)
- [ ] **[L2]** Lint and format commands defined in `package.json` scripts
- [ ] **[L3]** Pre-commit hook runs linter and formatter automatically
- [ ] **[L3]** CI fails on lint errors and type errors
- [ ] **[L4]** Custom lint rules enforce project-specific patterns (no mutation, no console.log)

---

## 2. Build System

_The build must be deterministic and require zero human judgment to execute._

- [ ] **[L1]** Project builds with a single command
- [ ] **[L1]** Lockfile exists and is committed
- [ ] **[L2]** Dependency versions are pinned (lockfile is source of truth)
- [ ] **[L2]** Build command documented in README or CLAUDE.md
- [ ] **[L3]** Clean install used in CI (`npm ci` or equivalent)
- [ ] **[L3]** Build completes in under 60 seconds (or caching configured)
- [ ] **[L3]** Agent can execute the full feedback loop (build → test → lint) without manual intervention
- [ ] **[L4]** Dependency update automation configured (Renovate, Dependabot)

---

## 3. Testing

_Tests are the only feedback mechanism that tells an agent whether its code is correct._

- [ ] **[L1]** Test runner installed and configured
- [ ] **[L1]** At least one test exists and passes
- [ ] **[L2]** Unit tests exist for core business logic
- [ ] **[L2]** Tests runnable with a single documented command
- [ ] **[L3]** Integration tests exist for API endpoints or data operations
- [ ] **[L3]** Test coverage measured and reported (80%+ target)
- [ ] **[L3]** CI runs full test suite on every PR
- [ ] **[L4]** E2E tests exist for critical user flows (Playwright or Cypress)
- [ ] **[L4]** Tests complete in under 2 minutes (or parallelized)

---

## 4. Documentation

_Missing or stale docs mean the agent guesses, and guesses create rework._

- [ ] **[L1]** `README.md` exists at the project root
- [ ] **[L2]** README contains working build, test, and run commands
- [ ] **[L2]** `CLAUDE.md` exists with project-specific instructions and architecture
- [ ] **[L3]** CLAUDE.md includes: tech stack, directory layout, naming conventions, common patterns
- [ ] **[L3]** Key interfaces have inline JSDoc or TSDoc comments
- [ ] **[L4]** CLAUDE.md includes known pitfalls, edge cases, and project-specific "do not" rules

---

## 5. Dev Environment

_An agent that cannot set up the environment cannot start working._

- [ ] **[L1]** Project runs locally after cloning and installing dependencies
- [ ] **[L2]** `.env.example` exists listing all required environment variables with descriptions
- [ ] **[L2]** Node version specified (`.nvmrc`, `engines` field, or equivalent)
- [ ] **[L3]** Single setup script or documented steps bring a fresh clone to running state
- [ ] **[L3]** Docker Compose or devcontainer exists for dependent services (DB, cache, queue)
- [ ] **[L4]** Setup script validates prerequisites and gives actionable errors on failure

---

## 6. Debugging & Observability

_Structured logs and error context are the difference between a 5-minute fix and a 5-hour investigation._

- [ ] **[L1]** Errors are caught and logged (not silently swallowed)
- [ ] **[L2]** Structured logger used instead of raw `console.log` (pino, winston, or equivalent)
- [ ] **[L2]** Error responses include diagnostic context (request ID, timestamp, error type)
- [ ] **[L3]** Error tracking configured (Sentry, Axiom, or equivalent)
- [ ] **[L3]** Health check endpoint exists for deployed services
- [ ] **[L4]** Request tracing or correlation IDs implemented across service boundaries

---

## 7. Security

_Agents will commit secrets, skip auth checks, and trust user input unless guardrails exist._

- [ ] **[L1]** No hardcoded secrets in the codebase
- [ ] **[L1]** `.gitignore` covers `.env`, `node_modules`, build artifacts, OS files
- [ ] **[L2]** Environment variables used for all secrets and configuration
- [ ] **[L2]** User input validated at API boundaries (Zod, Joi, or equivalent)
- [ ] **[L3]** Secret scanning enabled (GitHub secret scanning, gitleaks, or pre-commit hook)
- [ ] **[L3]** Dependency audit runs in CI (`npm audit`, Snyk, or equivalent)
- [ ] **[L3]** Branch protection enabled on main (require PR reviews, status checks)
- [ ] **[L4]** `CODEOWNERS` file exists for critical paths (auth, payments, data access)

---

## 8. Task Discovery

_Structured issue and PR templates reduce back-and-forth and prevent scope creep._

- [ ] **[L1]** Issues or tasks tracked in a tool (GitHub Issues, Linear, Jira)
- [ ] **[L2]** Issue template exists with: description, acceptance criteria, affected area
- [ ] **[L2]** PR template exists with: summary, test plan, breaking changes
- [ ] **[L3]** Labels categorize issues by type (bug, feature, chore) and priority
- [ ] **[L3]** Issues include enough context for an agent to start without asking questions
- [ ] **[L4]** Stale issue automation configured (auto-close or auto-label after inactivity)

---

## 9. Product & Experimentation

_Without analytics you cannot tell whether shipped features matter._

- [ ] **[L2]** Analytics or event tracking integrated for key user actions
- [ ] **[L3]** Feature flags available for gating new functionality
- [ ] **[L4]** Deployment automated (CI/CD deploys on merge to main)
- [ ] **[L4]** Rollback procedure documented and tested

---

## How to Use

1. **Audit** — Walk through every criterion. Check the box only if true RIGHT NOW.
2. **Score** — Count passing criteria per level. Fill in the table at the top.
3. **Prioritize** — If L1 is below 80%, fix L1 first. Levels are sequential.
4. **Automate** — Every L3 criterion should be enforced by tooling, not discipline.
5. **Re-audit** — Run at the start of every new project and quarterly for active projects.

## Coverage from Global Config

Your global Claude Code setup already provides guidance for several criteria, but this checklist verifies each **project** has the concrete infrastructure in place.

| Global Config | Criteria Covered |
|--------------|-----------------|
| PostToolUse prettier hook | Style L3 (auto-format) |
| PostToolUse tsc hook | Style L3 (type checking) |
| console.log warning hook | Style L4 (custom rules) |
| tdd-guide agent | Testing L2-L3 (TDD workflow) |
| security-reviewer agent | Security L1-L3 (review process) |
| rules/coding-style.md | Style L1-L2 (conventions documented) |
| rules/testing.md | Testing L3 (80% coverage target) |
| rules/git-workflow.md | Task Discovery L2-L3 (commit/PR conventions) |

An agent rule that says "use Zod for validation" only works if Zod is actually installed and a validation pattern exists in the codebase to follow.
