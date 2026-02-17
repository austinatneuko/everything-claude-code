#!/usr/bin/env node
/**
 * Item Tracker - Track tool executions as items with lifecycle states
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Inspired by Codex's Item primitive (started → delta → completed).
 * Runs on PostToolUse to record each tool execution as a completed item.
 *
 * Writes to ~/.claude/sessions/<date>-items.jsonl
 *
 * Use cases:
 * - Track which tools are used most (optimize agent definitions)
 * - Detect retry patterns (same tool called repeatedly = potential issue)
 * - Measure tool execution density per turn
 * - Feed into context meter for better token estimation
 */

const path = require('path');
const {
  getSessionsDir,
  getDateString,
  getDateTimeString,
  ensureDir,
  appendFile,
  readFile,
  writeFile,
  log
} = require('../lib/utils');

async function main() {
  // Read hook input from stdin
  let hookInput = {};
  try {
    let data = '';
    await new Promise((resolve) => {
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', chunk => { data += chunk; });
      process.stdin.on('end', () => {
        if (data.trim()) {
          try {
            hookInput = JSON.parse(data);
          } catch { /* ignore */ }
        }
        resolve();
      });
      process.stdin.on('error', resolve);
      setTimeout(resolve, 200);
    });
  } catch { /* ignore */ }

  const sessionsDir = getSessionsDir();
  const today = getDateString();
  const itemsFile = path.join(sessionsDir, `${today}-items.jsonl`);
  const sessionId = process.env.CLAUDE_SESSION_ID || process.ppid || 'default';

  ensureDir(sessionsDir);

  // Extract tool info from hook input
  const toolName = hookInput.tool || 'unknown';
  const toolInput = hookInput.tool_input || {};
  const toolOutput = hookInput.tool_output || {};

  // Build item record (completed state — PostToolUse means it finished)
  const item = {
    timestamp: getDateTimeString(),
    session_id: sessionId,
    state: 'completed',
    tool: toolName,
    // Capture key identifiers without full content (keep log small)
    target: extractTarget(toolName, toolInput),
    success: !toolOutput.is_error,
    // Detect retries: same tool+target in quick succession
    sequence: getSequenceNumber(sessionId, toolName, extractTarget(toolName, toolInput))
  };

  appendFile(itemsFile, JSON.stringify(item) + '\n');

  // Warn on retry patterns (same tool+target 3+ times)
  if (item.sequence >= 3) {
    log(`[ItemTracker] Retry detected: ${toolName} on ${item.target} (attempt ${item.sequence})`);
  }

  // Pass through stdin to stdout (required for PostToolUse hooks)
  if (Object.keys(hookInput).length > 0) {
    console.log(JSON.stringify(hookInput));
  }

  process.exit(0);
}

/**
 * Extract a short target identifier from tool input
 */
function extractTarget(toolName, input) {
  switch (toolName) {
    case 'Read':
    case 'Write':
    case 'Edit':
      return input.file_path || 'unknown';
    case 'Bash':
      return (input.command || '').slice(0, 80);
    case 'Grep':
      return input.pattern || 'unknown';
    case 'Glob':
      return input.pattern || 'unknown';
    case 'Task':
      return input.description || 'unknown';
    default:
      return 'unknown';
  }
}

/**
 * Track sequence numbers for retry detection.
 * Resets when tool+target changes.
 */
function getSequenceNumber(sessionId, toolName, target) {
  const tmpDir = require('os').tmpdir();
  const seqFile = path.join(tmpDir, `claude-item-seq-${sessionId}`);

  let seq = { tool: '', target: '', count: 0 };

  const content = readFile(seqFile);
  if (content) {
    try { seq = JSON.parse(content); } catch { /* reset */ }
  }

  if (seq.tool === toolName && seq.target === target) {
    seq.count += 1;
  } else {
    seq = { tool: toolName, target, count: 1 };
  }

  writeFile(seqFile, JSON.stringify(seq));
  return seq.count;
}

main().catch(err => {
  console.error('[ItemTracker] Error:', err.message);
  process.exit(0);
});
