# Hooks System

## Hook Types

- **PreToolUse**: Before tool execution (validation, parameter modification)
- **PostToolUse**: After tool execution (auto-format, checks, tracking)
- **Stop**: After each assistant response (verification, measurement)
- **SessionStart/SessionEnd**: Session lifecycle hooks
- **PreCompact**: Before context compaction

## Current Hooks (in ~/.claude/settings.json)

### PreToolUse
- **tmux reminder**: Suggests tmux for long-running commands (npm, pnpm, yarn, cargo, etc.)
- **git push review**: Opens Zed for review before push
- **doc blocker**: Blocks creation of unnecessary .md/.txt files
- **suggest-compact**: Suggests manual `/clear` at logical intervals

### PostToolUse
- **item-tracker**: Tracks every tool execution as an item with lifecycle states (Codex pattern). Detects retry patterns (3+ calls to same target). Logs to `sessions/<date>-items.jsonl`
- **PR creation**: Logs PR URL and GitHub Actions status
- **Prettier**: Auto-formats JS/TS files after edit
- **TypeScript check**: Runs tsc after editing .ts/.tsx files
- **console.log warning**: Warns about console.log in edited files

### Stop
- **console.log audit**: Checks all modified files for console.log
- **turn-tracker**: Records each conversation turn (user→agent). Logs to `sessions/<date>-turns.jsonl`
- **context-meter**: Estimates context window utilization (tokens). Warns at 80% and 90%. Logs to `sessions/<date>-context.jsonl`

## Auto-Accept Permissions

Use with caution:
- Enable for trusted, well-defined plans
- Disable for exploratory work
- Never use dangerously-skip-permissions flag
- Configure `allowedTools` in `~/.claude.json` instead

## Context Window Management

Use SESSION.md instead of relying on automatic compaction:
- Run `/checkpoint` to generate structured SESSION.md after each completed task
- User runs `/clear` at natural task boundaries
- Fresh context reads SESSION.md to resume seamlessly
- Context meter warns at 80%/90% utilization — checkpoint and `/clear` when warned
- Use `/fork <name>` to snapshot state before debugging tangents

## Thread-Like Primitives (inspired by Codex)

- **Items**: Each tool execution (`items.jsonl`) — tool name, target, success, retry count
- **Turns**: Each user→agent exchange (`turns.jsonl`) — timestamp, tool count per turn
- **Threads**: Session continuity via SESSION.md + fork snapshots in `sessions/forks/`
