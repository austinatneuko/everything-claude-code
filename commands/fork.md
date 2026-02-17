---
name: fork
description: Snapshot current session state for thread fork/resume. Creates a named checkpoint so you can branch off debugging tangents while keeping the main thread clean.
---

# Thread Fork

Create a snapshot of the current session state so you can branch off into a tangent (debugging, exploration, spike) and later resume from the fork point.

## What to Do

1. **Read the current SESSION.md** (if it exists in the project root or working directory)
2. **Read the current task list** using TaskList
3. **Create a fork snapshot** at `~/.claude/sessions/forks/<fork-name>-<timestamp>.md` containing:
   - Current SESSION.md contents (if any)
   - Active task list state
   - Current git branch and recent commits (if in a git repo)
   - Working directory
   - A summary of what was being worked on

### Fork Snapshot Format

```markdown
# Fork: <name>
**Created:** <timestamp>
**Working Directory:** <path>
**Git Branch:** <branch> (commit: <short-hash>)
**Reason:** <user-provided reason or "tangent">

## Session State at Fork Point
<SESSION.md contents or "No SESSION.md found">

## Active Tasks
<task list snapshot>

## Resume Instructions
To resume from this fork point:
1. Run `/clear` to reset context
2. Read this fork file to restore state
3. Continue from the task list below
```

3. **Announce the fork** — tell the user the fork file path and that they can `/clear` and resume from it later

## Arguments

- If the user provides a name (e.g., `/fork debugging-auth`), use it as the fork name
- If no name given, generate one from the current task context (e.g., `harness-improvements`)

## Example Usage

```
/fork debugging-auth
→ Creates ~/.claude/sessions/forks/debugging-auth-2026-02-11T14-30.md
→ User can now explore freely
→ Later: /clear, then "resume from fork debugging-auth"
```
