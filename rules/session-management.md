# Session Management — Context Window Strategy

## Purpose

Avoid automatic context compaction by checkpointing progress to SESSION.md.
After each completed task, update SESSION.md so `/clear` can be used safely
without losing plan state or progress.

## SESSION.md Location

- Place SESSION.md in the project root (next to CLAUDE.md)
- Reference it from CLAUDE.md with: `See SESSION.md for current plan and progress.`

## When to Create SESSION.md

Create SESSION.md at the start of any multi-step plan or complex task.
Do NOT create it for single, simple tasks.

## SESSION.md Format

```markdown
# Session Plan

## Objective
<One-line goal for this work session>

## Plan
- [x] Task 1: description — DONE
- [ ] Task 2: description ← CURRENT
- [ ] Task 3: description

## Decisions
<Key decisions made during this session that future context needs>
- Decision: rationale

## Modified Files
<Files changed so far, so fresh context knows what was touched>
- `path/to/file` — what changed

## Context for Next Task
<Anything the next fresh context needs to pick up seamlessly>
```

## Workflow

### Starting a multi-step task:
1. Write the plan to SESSION.md
2. Add `See SESSION.md for current plan and progress.` to CLAUDE.md if not present
3. Begin work on the first task

### After completing each task:
1. Update SESSION.md — mark task done, update "Context for Next Task"
2. Add any new decisions or modified files
3. Advance the ← CURRENT marker to the next task
4. Tell the user: "SESSION.md updated. Safe to `/clear` if context is heavy."

### After user runs `/clear`:
1. Read SESSION.md immediately
2. Resume from the ← CURRENT task
3. Do NOT re-read files already summarized in "Context for Next Task" unless needed

### When all tasks are complete:
1. Mark all tasks done in SESSION.md
2. Add a `## Completed` timestamp
3. Suggest the user delete or archive SESSION.md

## Rules

- Keep SESSION.md concise — it loads into context on every restart
- "Context for Next Task" should be <10 lines of essential state
- Do NOT duplicate full file contents — just summarize what changed
- Do NOT track SESSION.md in git (add to .gitignore if needed)
- Update SESSION.md with Edit tool, not full rewrites, to keep diffs small
