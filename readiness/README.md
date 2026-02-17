# Agent Readiness System

A system for making every project agent-ready before you start coding. Based on [Factory.ai's Agent Readiness framework](https://factory.ai/agent-readiness), adapted for Claude Code.

## Why This Exists

AI coding agents are only as effective as the environment they operate in. Missing pre-commit hooks, undocumented environment variables, and build processes requiring tribal knowledge prevent agents from functioning effectively. These are environmental problems, not agent problems -- and they compound.

This system provides:
- A **checklist** of 51 binary criteria to measure project readiness
- A **template** for generating agent briefing packets (CLAUDE.md)
- A **memory capture hook** that automatically saves learnings across sessions
- Two **skills** that automate assessment and bootstrapping

## Global Setup (Already Done)

These tools are installed once and protect every project automatically. You don't need to do anything per-project for these to work.

### Git Identity

```
git config --global user.name   → Your Name
git config --global user.email  → you@example.com
```

### Global Gitignore (`~/.gitignore_global`)

Automatically ignores `.DS_Store`, `.env`, `.env.local`, editor files, and debug logs in every repo. You never need to add these to per-project `.gitignore` files -- they're already covered.

### Secret Scanning (`gitleaks` + global pre-commit hook)

Every `git commit` in any repo automatically runs [gitleaks](https://github.com/gitleaks/gitleaks) to scan for accidentally staged secrets (API keys, tokens, passwords). If a secret is detected, the commit is blocked with a clear message.

- Hook location: `~/.git-hooks/pre-commit`
- Config: `git config --global core.hooksPath ~/.git-hooks`

Note: when a project uses Husky (e.g., via ultracite), Husky sets a project-level `core.hooksPath` that overrides the global one. In that case, the project-init skill adds gitleaks to Husky's pre-commit hook instead, so you're still covered.

### Node Version Manager (`fnm`)

[fnm](https://github.com/Schniz/fnm) manages Node.js versions per-project. When you `cd` into a directory with an `.nvmrc` file, fnm automatically switches to the right Node version.

- Default version: Node 22 LTS
- Shell integration: added to `~/.zshrc` (`eval "$(fnm env --use-on-cd --shell zsh)"`)
- The `project-init` skill creates `.nvmrc` files in new projects

### What This Covers on the Checklist

These global tools satisfy criteria across every project without any per-project setup:

| Criterion | Level | Covered By |
|-----------|-------|------------|
| No hardcoded secrets | L1 | gitleaks pre-commit hook |
| .gitignore covers essentials | L1 | Global gitignore (.DS_Store, .env, logs) |
| Secret scanning enabled | L3 | gitleaks pre-commit hook |
| Node version specified | L2 | fnm + .nvmrc (created by project-init) |

---

## Quick Start

### 1. Check a project's readiness

Navigate to any project and ask Claude:

```
check readiness
```

Or use the skill directly:

```
/readiness-check
/readiness-check quick       # L1-L2 only
/readiness-check testing     # deep dive on one pillar
```

This produces a scorecard showing your level (L1-L4), per-pillar scores, and the top 3 actions to reach the next level.

### 2. Bootstrap a new project

Navigate to a project and ask Claude:

```
initialize this project for agent readiness
```

Or use the skill directly:

```
/project-init                # full workflow
/project-init scan           # discovery only, don't create anything
/project-init claude-md      # only generate CLAUDE.md
/project-init github         # only create PR + issue templates
/project-init env            # only create .env.example
```

The skill runs in three phases:
1. **Discovery** -- detects stack, package manager, existing infrastructure
2. **Scaffolding** -- creates missing files (always asks before writing):
   - `CLAUDE.md` from template (filled with detected values)
   - `.env.example` (scanned from codebase)
   - PR template + issue templates
   - `.nvmrc`
   - [Ultracite](https://ultracite.ai) setup (linter, formatter, git hooks, agent rules)
   - Vitest + Playwright (test runners)
   - CI workflow (`.github/workflows/ci.yml`)
   - Dependabot config
3. **Verification** -- scores before/after and lists remaining gaps

### 3. Capture learnings as you work

The memory capture hook runs automatically. Use these triggers in any prompt:

| Trigger | Target | Example |
|---------|--------|---------|
| `# <content>` | Project memory | `# This project uses server components exclusively` |
| `## <content>` | Personal memory | `## I prefer pnpm over npm` |
| `remember this: <content>` | Project memory | `remember this: the API rate limits at 100 req/min` |
| `note: <content>` | Project memory | `note: migrations must run before seeding` |
| `save this: <content>` | Project memory | `save this: auth tokens expire after 24 hours` |

Entries are saved as timestamped lines:
- Project memory: `<project-root>/.claude/memories.md`
- Personal memory: `~/.claude/memories.md`

## File Structure

```
~/.claude/readiness/
├── README.md                              # This file
├── checklist.md                           # 51 criteria, 9 pillars, L1-L4
├── scripts/
│   └── memory-capture.js                  # UserPromptSubmit hook
└── templates/
    └── CLAUDE.md.template                 # Per-project briefing packet template

~/.claude/skills/
├── readiness-check/SKILL.md               # Assessment skill
└── project-init/SKILL.md                  # Bootstrapping skill
```

Skills live in the top-level `skills/` directory for automatic discovery.
The memory capture hook is registered in `~/.claude/everything-claude-code/hooks/hooks.json` under `UserPromptSubmit`.

## The Readiness Checklist

52 binary pass/fail criteria organized across 9 pillars and 4 maturity levels.

### Maturity Levels

| Level | Name | What It Means |
|-------|------|---------------|
| L1 | Functional | Code runs, but manual setup and no automated validation |
| L2 | Documented | Basic docs and workflows exist and are written down |
| L3 | Standardized | Clear processes enforced through automation (target) |
| L4 | Optimized | Fast feedback loops and data-driven improvement |

**Progression rule:** pass 80% of a level's criteria before claiming that level. Levels are cumulative (L3 requires L1 and L2 to pass first).

### The 9 Pillars

| Pillar | Why It Matters for Agents |
|--------|--------------------------|
| Style & Validation | Without auto-enforcement, every generation drifts |
| Build System | Must be deterministic -- agents can't ask clarifying questions mid-build |
| Testing | The only feedback mechanism telling agents if their code works |
| Documentation | Missing docs mean the agent guesses, and guesses create rework |
| Dev Environment | Can't start working if can't set up the environment |
| Debugging & Observability | Structured logs vs 5-hour investigation |
| Security | Agents will happily commit secrets without guardrails |
| Task Discovery | Structured templates reduce back-and-forth |
| Product & Experimentation | Analytics close the feedback loop on shipped features |

### Criteria Count

| Level | Criteria | 80% Threshold |
|-------|----------|---------------|
| L1 | 10 | 8 |
| L2 | 16 | 13 |
| L3 | 16 | 13 |
| L4 | 10 | 8 |
| **Total** | **52** | |

See `checklist.md` for the full list.

## The CLAUDE.md Template

The template at `templates/CLAUDE.md.template` generates a per-project briefing packet -- the single file the agent reads at session start to understand how to work in your codebase.

Key sections:
- **Commands** -- copy-paste ready table of build, test, lint, dev, deploy
- **Project Layout** -- annotated directory tree
- **Development Patterns** -- immutability, file size limits, validation, naming
- **Git Workflow** -- branching, conventional commits, PR requirements
- **Testing** -- TDD workflow, coverage targets, test locations
- **Delegation Guide** -- SDLC responsibility matrix (what to hand off vs. review vs. own)
- **Environment** -- Node version, package manager, required env vars, services
- **Domain Vocabulary** -- 5-10 key terms with precise meanings
- **Known Gotchas** -- things that waste agent time or cause subtle bugs
- **Verification** -- what must pass before a PR is mergeable

Global defaults are pre-baked (immutability, TDD, conventional commits, Zod, 80% coverage). Only project-specific details need to be filled in. Target: under 150 lines.

### Using the Template Manually

```bash
cp ~/.claude/readiness/templates/CLAUDE.md.template ./CLAUDE.md
# Fill in {{PLACEHOLDERS}} and delete HTML comments
```

Or let the `project-init` skill do it automatically -- it reads `package.json`, detects your stack, and fills in what it can.

### Nested Instructions (Monorepos / Complex Projects)

For monorepos or projects with distinct subsystems, you can place additional CLAUDE.md files in subdirectories. Claude Code discovers these when working in that directory, and they layer on top of the root CLAUDE.md.

```
my-monorepo/
├── CLAUDE.md                  # Root: shared conventions, workspace commands
├── packages/
│   ├── api/
│   │   └── CLAUDE.md          # API-specific: endpoints, auth patterns, DB access
│   ├── web/
│   │   └── CLAUDE.md          # Web-specific: components, routing, state mgmt
│   └── shared/
│       └── CLAUDE.md          # Shared lib: export rules, versioning
```

Keep each nested file focused on what's different from the root. Don't repeat shared conventions -- the root file covers those. This mirrors the layered discovery pattern from OpenAI's Codex AGENTS.md, where instructions closer to the working directory take precedence.

### The Delegation Guide

The template includes a Delegation Guide section -- a responsibility matrix that maps each phase of the software lifecycle into three buckets:

| Column | Meaning |
|--------|---------|
| **Delegate** | Hand this to the agent. Trust the output. |
| **Review** | Agent does the first pass, you validate. |
| **Own** | Human-only. Agent assists at most. |

This is especially useful if you're non-technical or new to working with AI agents. It answers "what should I ask the agent to do?" and equally important, "what should I still decide myself?" Customize it per project by moving items between columns as your confidence grows.

## How It Connects to Your Existing Setup

This system sits alongside `~/.claude/everything-claude-code/` (the plugin with 9 agents, 15 commands, 8 rules, 11 skills, and hooks). It does not conflict -- it adds a new layer on top:

| Layer | What | Where |
|-------|------|-------|
| Global rules | Always-follow conventions | `everything-claude-code/rules/` |
| Global agents | Specialized sub-agents | `everything-claude-code/agents/` |
| Global hooks | Auto-formatting, tsc checks, etc. | `everything-claude-code/hooks/` |
| **Readiness system** | **Per-project assessment + bootstrapping** | **`readiness/`** |
| Per-project config | Project-specific CLAUDE.md | `<project>/CLAUDE.md` |

The global rules define *what* conventions to follow. The readiness system verifies that each *project* has the infrastructure in place to enforce them.

## Typical Workflow

```
1. Start new project (or clone existing one)
           |
2. Run:  /project-init scan
           |
   See what exists, what's missing
           |
3. Run:  /project-init
           |
   Scaffold CLAUDE.md, .env.example, templates
   Fill in TODOs (domain vocabulary, gotchas)
           |
4. Run:  /readiness-check
           |
   Get scorecard, see your level
   Fix gaps until you hit L3
           |
5. Start building
   Memory capture saves learnings as you go
           |
6. Periodically:  /readiness-check
           |
   Track progression, address new gaps
```

## Attribution

Framework adapted from [Factory.ai's Agent Readiness](https://factory.ai/agent-readiness) model, with delegation guide and agentic loop concepts from [OpenAI's Codex documentation](https://developers.openai.com/codex).

Key references:
- [Factory.ai Agent Readiness Overview](https://docs.factory.ai/web/agent-readiness/overview)
- [Factory.ai AGENTS.md Documentation](https://docs.factory.ai/cli/configuration/agents-md)
- [Factory.ai Power User Setup Checklist](https://docs.factory.ai/guides/power-user/setup-checklist)
- [Factory.ai Token Efficiency Strategies](https://docs.factory.ai/guides/power-user/token-efficiency)
- [OpenAI Codex AGENTS.md Guide](https://developers.openai.com/codex/guides/agents-md) -- layered discovery, nested instructions
- [OpenAI Building an AI-Native Engineering Team](https://developers.openai.com/codex/guides/build-ai-native-engineering-team) -- SDLC delegation matrix
