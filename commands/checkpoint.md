# Checkpoint Command

Create a structured SESSION.md checkpoint for seamless resume after `/clear`, or create a git-based checkpoint.

## Usage

`/checkpoint [session|git|verify|list] [name]`

**Default (no args):** Creates a SESSION.md checkpoint (recommended).

## Session Checkpoint (default)

When creating a session checkpoint:

1. **Review conversation history** — what was discussed, decided, implemented
2. **Check git status** — what files were actually modified
3. **Review task list** — what's done, what's pending
4. **Write SESSION.md** in project root with this structure:

```markdown
# Session: <date>

## Current Objective
<1-2 sentences: what are we trying to accomplish?>

## Decisions Made
- Decision 1: rationale
- Decision 2: rationale

## Progress
### Completed
- [x] Task description (file: path/to/file.ts)

### In Progress
- [ ] Task description — stopped at: <specific point>

### Remaining
- [ ] Task description

## Key Files Modified
- `path/to/file.ts` — Description of change

## Context to Preserve
- Important: <gotcha or non-obvious detail>

## Resume Command
<exact first instruction for the next session>
```

5. **Confirm** — tell the user they can safely `/clear`

Key principles:
- Preserve decisions, not discussions
- Be specific about stopping points
- Include resume command
- Keep under 100 lines

## Git Checkpoint

When using `/checkpoint git <name>`:

1. Run `/verify quick` to ensure current state is clean
2. Create a git stash or commit with checkpoint name
3. Log checkpoint to `.claude/checkpoints.log`
4. Report checkpoint created

## Verify Checkpoint

When verifying against a checkpoint:

1. Read checkpoint from log
2. Compare current state to checkpoint
3. Report changes, test results, coverage

## List Checkpoints

Show all checkpoints (SESSION.md history + git checkpoints)

## Arguments

$ARGUMENTS:
- (no args) - Create SESSION.md checkpoint (recommended)
- `session` - Create SESSION.md checkpoint
- `git <name>` - Create named git checkpoint
- `verify <name>` - Verify against named git checkpoint
- `list` - Show all checkpoints
