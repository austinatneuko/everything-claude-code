---
name: project-init
description: This skill should be used when the user asks to "initialize a project", "bootstrap agent readiness", "set up CLAUDE.md", "scaffold project infrastructure", "make this project agent-ready", "run project init", or wants to bring a project to L2+ readiness in one command. Supports targeted modes via arguments (scan, claude-md, github, env).
argument-hint: "[scan | claude-md | github | env]"
---

# Project Initialization Skill

Bootstrap a project to agent-readiness L2+ by detecting the existing stack, inventorying what is present, and scaffolding the missing infrastructure. This skill uses the CLAUDE.md template at `~/.claude/readiness/templates/CLAUDE.md.template` as the base and creates or configures the missing pieces.

## Argument Modes

Parse `$ARGUMENTS` to determine scope:

| Argument | Scope |
|----------|-------|
| *(empty)* | Full init: discovery + scaffolding + verification |
| `scan` | Discovery only: report what exists and what is missing, create nothing |
| `claude-md` | Generate only CLAUDE.md from the template |
| `github` | Create only GitHub templates (PR template, issue templates) |
| `env` | Create only .env.example from codebase scan |

If `$ARGUMENTS` is empty or not one of the above, run the full init workflow (all three phases).

---

## Phase 1: Discovery (Read-Only)

Run all discovery steps in PARALLEL. Do not create or modify any files during this phase.

### 1.1 Detect Project Type and Stack

Read whichever of these files exist in the project root:

| File | Stack Signal |
|------|-------------|
| `package.json` | Node.js / JavaScript / TypeScript |
| `pyproject.toml` or `requirements.txt` | Python |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `pom.xml` or `build.gradle` | Java / Kotlin |

If none are found, ask the user to identify the project type before proceeding.

From `package.json`, extract:
- `name` (project name)
- `scripts` (build, test, lint, dev, format, typecheck commands)
- `engines` (Node version)
- `dependencies` and `devDependencies` (framework detection: react, next, vue, express, etc.)

From `tsconfig.json`, extract:
- `compilerOptions.strict` (whether strict mode is enabled)
- `compilerOptions.target` (target ES version)

### 1.2 Detect Package Manager

Check for lock files in this priority order:
1. `bun.lockb` -> bun
2. `pnpm-lock.yaml` -> pnpm
3. `yarn.lock` -> yarn
4. `package-lock.json` -> npm

### 1.3 Inventory Existing Files

Run parallel Glob calls for all of these patterns:

```
README.md, CLAUDE.md, AGENTS.md
.env.example, .env.local, .env
.nvmrc, .node-version
eslint.config.*, .eslintrc*, biome.json
.prettierrc*, prettier.config.*
tsconfig.json
.husky/*, lint-staged config in package.json
vitest.config.*, jest.config.*, playwright.config.*
.github/workflows/*
.github/ISSUE_TEMPLATE/*
.github/pull_request_template.md
CODEOWNERS
docker-compose.yml, .devcontainer/devcontainer.json
.gitignore
renovate.json, .github/dependabot.yml
```

### 1.4 Read Existing Configuration

Read files that inform scaffolding decisions:
- `package.json` scripts section (to populate CLAUDE.md commands table)
- `tsconfig.json` (to detect Node version from target)
- `.gitignore` (to check for missing entries)
- Any existing `CLAUDE.md` (to detect merge opportunities)

### 1.5 Generate Directory Tree

Run `ls` or `find` (depth-limited to 2 levels) on `src/`, `app/`, `lib/`, `components/`, `pages/`, `tests/`, `test/`, `__tests__/` to capture the project layout for CLAUDE.md.

### 1.6 Report Findings

Present a summary to the user in this format:

```
PROJECT SCAN: <project-name>

Stack: <detected stack> (detected from <source file>)
Package Manager: <detected pm> (detected from <lock file>)
Node Version: <version or "not specified">
Test Runner: <vitest/jest/playwright/none detected>
Linter: <eslint/biome/none detected>
Formatter: <prettier/biome/none detected>

Already exists:              Missing (will create):
[x] README.md                [ ] CLAUDE.md
[x] tsconfig.json            [ ] .env.example
[x] ESLint config            [ ] PR template
[x] .gitignore               [ ] Issue templates
[x] package-lock.json        [ ] .nvmrc
...                           ...

Existing files that need attention:
- .gitignore: missing .env, .env.local entries
- CLAUDE.md: exists but missing Commands table (offer to merge)
```

If `$ARGUMENTS` is `scan`, STOP HERE. Do not proceed to Phase 2.

---

## Phase 2: Scaffolding (Write -- Requires User Approval)

Before writing any files, present the full list of files that will be created and ask the user for explicit approval:

```
PROPOSED CHANGES:

Will create:
  1. CLAUDE.md (from template, filled with detected values)
  2. .env.example (12 variables found in codebase)
  3. .github/pull_request_template.md
  4. .github/ISSUE_TEMPLATE/bug.yml
  5. .github/ISSUE_TEMPLATE/feature.yml
  6. .nvmrc (v20.11.0 from engines field)

Will suggest additions to:
  - .gitignore (3 missing entries)

Will skip (already exists):
  - README.md
  - tsconfig.json
  - eslint.config.js

Proceed? [describe what you want to change, or approve all]
```

NEVER overwrite existing files. If a file already exists, skip it and note "already exists" in the report. The one exception: if CLAUDE.md exists, offer to MERGE new sections into the existing file rather than skipping entirely. Show the user what sections would be added and let them approve.

Wait for user approval before writing anything.

### 2.1 Generate CLAUDE.md

Read the template at `~/.claude/readiness/templates/CLAUDE.md.template`.

Fill in placeholders with detected values:

| Placeholder | Source |
|-------------|--------|
| `{{PROJECT_NAME}}` | `package.json` name field |
| `{{PROJECT_DESCRIPTION}}` | `package.json` description field, or `TODO: Add project description` |
| `{{PACKAGE_MANAGER}}` | Detected from lock file (1.2) |
| `{{DEV_COMMAND}}` | `package.json` scripts.dev or scripts.start |
| `{{BUILD_COMMAND}}` | `package.json` scripts.build |
| `{{TEST_COMMAND}}` | `package.json` scripts.test |
| `{{TEST_SINGLE_COMMAND}}` | Infer from test runner: `npx vitest run <file>` or `npx jest <file>` |
| `{{LINT_COMMAND}}` | `package.json` scripts.lint |
| `{{FORMAT_COMMAND}}` | `package.json` scripts.format, or infer from prettier/biome presence |
| `{{TYPECHECK_COMMAND}}` | `package.json` scripts.typecheck or `npx tsc --noEmit` |
| `{{DEPLOY_COMMAND}}` | `package.json` scripts.deploy, or `TODO: Add deploy command` |
| `{{DIRECTORY_TREE}}` | Generated from 1.5 |
| `{{BASE_BRANCH}}` | Detect from `git remote show origin` or default to `main` |
| `{{TEST_RUNNER}}` | Detected test framework (Vitest, Jest, etc.) |
| `{{NODE_VERSION}}` | From `.nvmrc`, `engines` field, or `TODO: Specify Node version` |
| `{{ENV_VARS}}` | From .env.example generation (2.2) |
| `{{SCHEMAS_DIR}}` | Detect from project structure or default to `src/schemas/` |
| `{{ADDITIONAL_SERVICES}}` | Detect from docker-compose.yml or `TODO: List required services` |

For values that cannot be auto-detected (domain vocabulary, known gotchas), insert TODO comments:

```markdown
## Domain Vocabulary

<!-- TODO: Fill in 5-10 key terms specific to this project -->

| Term | Meaning |
|------|---------|
| TODO | TODO |

## Known Gotchas

<!-- TODO: Add project-specific pitfalls that waste agent time -->
<!-- Examples:
- The `user` table is `app_user` in the database (Prisma renames it)
- API routes under `/api/public/` have NO auth
-->
```

Write the completed file to the project root as `CLAUDE.md`.

If running in `claude-md` argument mode, skip all other scaffolding steps and proceed to Phase 3.

### 2.2 Create .env.example

Skip if `.env.example` already exists.

Scan the codebase for environment variable references using Grep:

```
process.env.          (Node.js / TypeScript)
os.environ            (Python)
os.Getenv             (Go)
std::env::var         (Rust)
import.meta.env.      (Vite)
```

Also check:
- Existing `.env` or `.env.local` files (read variable names only, never read values)
- `docker-compose.yml` environment sections
- Any `env:` sections in GitHub Actions workflows

Generate `.env.example` with this format:

```bash
# ============================================
# Environment Variables
# Copy to .env and fill in values
# ============================================

# --- Database ---
DATABASE_URL=                    # Connection string (e.g., postgresql://user:pass@localhost:5432/db)

# --- Authentication ---
NEXTAUTH_SECRET=                 # Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# --- External Services ---
# OPENAI_API_KEY=                # Optional: OpenAI API key for AI features
# STRIPE_SECRET_KEY=             # Optional: Stripe API key for payments
```

Group variables by category where possible. Mark optional variables with comments and a `#` prefix. Add generation hints for secrets (e.g., `openssl rand -base64 32`).

If running in `env` argument mode, skip all other scaffolding steps and proceed to Phase 3.

### 2.3 Create PR Template

Skip if `.github/pull_request_template.md` already exists.

Create `.github/pull_request_template.md`:

```markdown
## Summary
<!-- What does this PR do? Why is it needed? -->

## Changes
<!-- List the key changes made -->
-

## Test Plan
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Types pass (`<detected typecheck command>`)
- [ ] Lint passes (`<detected lint command>`)
- [ ] Tests pass (`<detected test command>`)
- [ ] No console.log in committed code
- [ ] No hardcoded secrets
```

Replace `<detected typecheck command>`, `<detected lint command>`, and `<detected test command>` with the actual commands detected from `package.json` scripts.

### 2.4 Create Issue Templates

Skip if `.github/ISSUE_TEMPLATE/` directory already exists with files in it.

Create `.github/ISSUE_TEMPLATE/bug.yml`:

```yaml
name: Bug Report
description: Report a bug or unexpected behavior
title: "[Bug]: "
labels: ["bug"]
body:
  - type: textarea
    id: description
    attributes:
      label: Description
      description: A clear description of the bug
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to Reproduce
      description: Step-by-step instructions to reproduce the issue
      value: |
        1.
        2.
        3.
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What should happen instead?
    validations:
      required: true
  - type: dropdown
    id: environment
    attributes:
      label: Environment
      options:
        - Development (local)
        - Staging
        - Production
    validations:
      required: true
  - type: textarea
    id: context
    attributes:
      label: Additional Context
      description: Screenshots, logs, or other relevant information
    validations:
      required: false
```

Create `.github/ISSUE_TEMPLATE/feature.yml`:

```yaml
name: Feature Request
description: Propose a new feature or enhancement
title: "[Feature]: "
labels: ["enhancement"]
body:
  - type: textarea
    id: user-story
    attributes:
      label: User Story
      description: "As a [role], I want [action], so that [benefit]"
      placeholder: "As a user, I want to ..., so that ..."
    validations:
      required: true
  - type: textarea
    id: acceptance-criteria
    attributes:
      label: Acceptance Criteria
      description: Conditions that must be true for this feature to be considered complete
      value: |
        - [ ]
        - [ ]
        - [ ]
    validations:
      required: true
  - type: dropdown
    id: area
    attributes:
      label: Affected Area
      options:
        - Frontend
        - Backend
        - API
        - Database
        - Infrastructure
        - Documentation
        - Other
    validations:
      required: true
  - type: textarea
    id: context
    attributes:
      label: Additional Context
      description: Mockups, references, or other relevant information
    validations:
      required: false
```

If running in `github` argument mode, skip all other scaffolding steps and proceed to Phase 3.

### 2.5 Create .nvmrc

Skip if `.nvmrc` or `.node-version` already exists.

Determine the Node version from these sources (in priority order):
1. `package.json` `engines.node` field (extract the major version)
2. `tsconfig.json` target (ES2022 -> Node 18+, ES2023 -> Node 20+)
3. Ask the user

Write `.nvmrc` with the version number (e.g., `20`).

### 2.6 Verify .gitignore Coverage

Read the existing `.gitignore`. Check whether these entries are present:

```
.env
.env.local
.env*.local
node_modules/
dist/
build/
.next/
.DS_Store
*.log
```

If any are missing, do NOT modify `.gitignore` automatically. Instead, present the missing entries and suggest the user add them:

```
SUGGESTED .gitignore additions:

The following entries are missing from .gitignore:
  + .env
  + .env.local
  + .DS_Store

Add these entries? (or add them manually)
```

Only add entries if the user explicitly approves.

### 2.7 Run Ultracite Init (Style & Validation)

Offer to run Ultracite for automatic linter, formatter, and git hooks setup. Ultracite is a zero-configuration preset that generates ESLint/Biome configs, Prettier configs, pre-commit hooks, and Claude Code agent rules.

Ask the user:

```
OPTIONAL: Run Ultracite to set up linting, formatting, and git hooks?

This will:
  - Install and configure Biome (linter + formatter)
  - Set up pre-commit hooks via Husky
  - Generate Claude Code agent rules (.claude/CLAUDE.md)
  - Add lint/format scripts to package.json

Run ultracite? [yes/no]
```

If approved, run:
```bash
npx ultracite@latest init --biome --claude --husky --quiet
```

Add framework flags based on detection from Phase 1:
- If React detected: add `react`
- If Next.js detected: add `next`
- If Vue detected: add `vue`

Example with Next.js:
```bash
npx ultracite@latest init --biome --claude --husky --next --quiet
```

After ultracite runs, note that it may have generated a `.claude/CLAUDE.md` file with linting rules. This file complements the project-root `CLAUDE.md` generated in step 2.1 — the project-root file covers architecture, commands, and conventions, while ultracite's file covers code style rules enforced by the linter.

If the user declines ultracite, skip this step entirely. Do not install individual linters/formatters as a fallback.

### 2.8 Install Test Runner (Testing)

If no test runner is detected from Phase 1 (no vitest, jest, mocha, or playwright configs found), offer to install one:

```
No test runner detected. Install Vitest? (recommended for TypeScript projects)

This will:
  - Install vitest as a dev dependency
  - Create a minimal vitest.config.ts
  - Add test scripts to package.json

Install? [yes/no]
```

If approved, run:
```bash
<package-manager> add -D vitest @vitest/coverage-v8
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
```

Add scripts to `package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

Also offer Playwright for E2E testing:

```
Install Playwright for E2E testing? (optional, recommended for web apps)
```

If approved:
```bash
<package-manager> add -D @playwright/test
npx playwright install --with-deps chromium
```

Create `playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
})
```

Skip this section entirely for non-JS/TS projects.

### 2.9 Create CI Workflow

Skip if `.github/workflows/` already contains CI workflow files.

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: '<detected-package-manager>'

      - name: Install dependencies
        run: <clean-install-command>

      - name: Typecheck
        run: <typecheck-command>

      - name: Lint
        run: <lint-command>

      - name: Test
        run: <test-command>

      - name: Build
        run: <build-command>
```

Replace all `<placeholder>` values with actual commands detected from `package.json` scripts in Phase 1:
- `<detected-package-manager>`: npm, pnpm, yarn, or bun
- `<clean-install-command>`: `npm ci`, `pnpm install --frozen-lockfile`, `yarn --frozen-lockfile`, or `bun install --frozen-lockfile`
- `<typecheck-command>`: from scripts.typecheck or `npx tsc --noEmit`
- `<lint-command>`: from scripts.lint
- `<test-command>`: from scripts.test
- `<build-command>`: from scripts.build

If pnpm is detected, add a pnpm setup step before install:
```yaml
      - uses: pnpm/action-setup@v4
```

### 2.10 Create Dependabot Config

Skip if `renovate.json`, `.github/dependabot.yml`, or `.github/dependabot.yaml` already exists.

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    groups:
      minor-and-patch:
        update-types:
          - "minor"
          - "patch"
```

For GitHub Actions, add a second entry:
```yaml
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

## Phase 3: Verification

After scaffolding completes (or after a scan-only run), evaluate the project against the readiness checklist at `~/.claude/readiness/checklist.md`.

### 3.1 Score Before and After

Count how many of the 52 checklist criteria the project meets. If this was a full init (not scan-only), compare the before and after scores. Note that the new scaffolding steps (ultracite for linting/formatting/hooks, vitest for testing, CI workflow, dependabot) can significantly increase the criteria count -- especially in the L3 Standardized tier:

```
READINESS ASSESSMENT:

Before project-init:  18/52 criteria met
After project-init:   39/52 criteria met  (+21)

Level Breakdown:
  L1 Functional:    9/10  (was 8/10)  -- PASSES (80%+ = 8)
  L2 Documented:   14/16  (was 6/16)  -- PASSES (80%+ = 13)
  L3 Standardized: 13/16  (was 3/16)  -- PASSES (80%+ = 13)
  L4 Optimized:     3/10  (was 1/10)  -- future goal (80%+ = 8)

Overall: L3 ACHIEVED (was L1)
```

### 3.2 List Remaining Gaps

List the specific criteria that are still unmet, grouped by priority:

```
REMAINING GAPS (prioritized):

High Priority (reach L3):
  [ ] Pre-commit hook runs linter and formatter (install husky + lint-staged)
  [ ] CI fails on lint errors and type errors (add GitHub Actions workflow)
  [ ] Integration tests exist for API endpoints
  [ ] Test coverage measured and reported (80%+ target)
  [ ] CI runs full test suite on every PR

Medium Priority (strengthen L2):
  [ ] Structured logger used instead of raw console.log
  [ ] Error responses include diagnostic context

Lower Priority (L4 aspirations):
  [ ] E2E tests exist for critical user flows
  [ ] Feature flags available
  [ ] Deployment automated
```

### 3.3 Suggest Next Steps

Provide 3-5 concrete next steps the user should take manually:

```
RECOMMENDED NEXT STEPS:

1. Fill in the TODO sections in CLAUDE.md:
   - Domain Vocabulary (5-10 key terms)
   - Known Gotchas (project-specific pitfalls)
   - Project description

2. Set up pre-commit hooks:
   npx husky init
   npm install -D lint-staged

3. Add a CI workflow:
   Create .github/workflows/ci.yml with lint, typecheck, and test jobs

4. Set up branch protection on GitHub:
   Settings > Branches > Add rule for main
   Require PR reviews and status checks

5. Copy .env.example to .env and fill in actual values:
   cp .env.example .env
```

---

## Important Rules

1. **NEVER overwrite existing files.** If a file exists, skip it and report "already exists." The only exception is CLAUDE.md where a merge is offered.
2. **Ask before writing.** Always show the user what will be created and wait for approval before writing any files.
3. **Run discovery in PARALLEL.** Use parallel Glob, Read, and Grep calls wherever possible during Phase 1.
4. **Be specific about commands.** Use the actual commands from `package.json` scripts, not generic placeholders.
5. **Leave TODOs for unknowns.** Never fabricate domain vocabulary, known gotchas, or project descriptions. Insert clear TODO markers.
6. **Focus on TypeScript/Node.js primarily** but handle Python, Go, and Rust with sensible defaults (adjust env var patterns, build commands, and directory conventions accordingly).
7. **Track what was created.** At the end, provide a clear summary of every file created, every file skipped, and every manual action the user still needs to take.
