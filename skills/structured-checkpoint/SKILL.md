---
name: structured-checkpoint
description: Generate a structured SESSION.md checkpoint that captures conversation state for seamless resume after /clear. Inspired by Codex's compaction endpoint — produces a model-generated summary of what matters for continuation.
---

# Structured Checkpoint

Generate a structured SESSION.md that captures everything needed to resume work seamlessly after `/clear`. This replaces ad-hoc compaction with a model-generated checkpoint optimized for continuation.

## When to Use

- Before running `/clear` at a natural task boundary
- When context meter warns about high utilization
- After completing a major phase (exploration → implementation)
- Before branching into a debugging tangent

## What to Generate

Create/update `SESSION.md` in the project root with this structure:

```markdown
# Session: <date>

## Current Objective
<1-2 sentences: what are we trying to accomplish?>

## Decisions Made
<bulleted list of architectural/implementation decisions made this session>
- Decision 1: rationale
- Decision 2: rationale

## Progress
### Completed
- [x] Task description (file: path/to/file.ts)
- [x] Task description

### In Progress
- [ ] Task description — stopped at: <specific point>

### Remaining
- [ ] Task description
- [ ] Task description

## Key Files Modified
<list of files changed this session, with 1-line description of what changed>
- `path/to/file.ts` — Added structured checkpoint skill
- `path/to/hook.js` — New turn tracking hook

## Context to Preserve
<anything the next session MUST know that isn't obvious from the code>
- Important: <gotcha or non-obvious detail>
- Note: <context that would be lost>

## Resume Command
<exact first instruction for the next session>
```

## How to Generate

1. **Review the conversation history** — what was discussed, decided, implemented
2. **Check git status** — what files were actually modified
3. **Review task list** — what's done, what's pending
4. **Synthesize** — distill into the template above
5. **Write SESSION.md** — in the project root
6. **Confirm** — tell the user they can safely `/clear`

## Key Principles (from Codex Harness)

- **Preserve decisions, not discussions** — the "why" matters more than the conversation that got there
- **Be specific about stopping points** — "stopped at line 45 of auth.ts" not "working on auth"
- **Include resume command** — the first thing the next session should do
- **Keep under 100 lines** — this becomes part of the next session's context budget
