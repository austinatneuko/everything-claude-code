#!/usr/bin/env node
/**
 * Turn Tracker - Track conversation turns (user→agent) for thread-like history
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on Stop hook. Models conversation as Items→Turns→Threads (Codex pattern).
 * Each turn is a user message through agent response completion.
 *
 * Writes to ~/.claude/sessions/<date>-turns.jsonl (one JSON object per line)
 */

const path = require('path');
const fs = require('fs');
const {
  getSessionsDir,
  getDateString,
  getDateTimeString,
  ensureDir,
  appendFile,
  readFile,
  log
} = require('../lib/utils');

async function main() {
  const sessionsDir = getSessionsDir();
  const today = getDateString();
  const turnsFile = path.join(sessionsDir, `${today}-turns.jsonl`);

  ensureDir(sessionsDir);

  // Read stdin for hook context
  let hookInput = {};
  try {
    let data = '';
    process.stdin.setEncoding('utf8');
    await new Promise((resolve, reject) => {
      process.stdin.on('data', chunk => { data += chunk; });
      process.stdin.on('end', () => {
        if (data.trim()) {
          try { hookInput = JSON.parse(data); } catch { /* ignore */ }
        }
        resolve();
      });
      process.stdin.on('error', resolve);
      setTimeout(resolve, 100);
    });
  } catch { /* ignore */ }

  // Build turn record
  const turn = {
    timestamp: getDateTimeString(),
    session_id: process.env.CLAUDE_SESSION_ID || process.ppid || 'unknown',
    type: 'turn_completed',
    tool_count: getTurnToolCount(),
    model: process.env.CLAUDE_MODEL || 'unknown'
  };

  // Append as JSONL
  appendFile(turnsFile, JSON.stringify(turn) + '\n');

  // Update turn count for the session
  incrementTurnCount();

  process.exit(0);
}

/**
 * Get and reset the tool count for this turn
 */
function getTurnToolCount() {
  const sessionId = process.env.CLAUDE_SESSION_ID || process.ppid || 'default';
  const counterFile = path.join(require('os').tmpdir(), `claude-tool-count-${sessionId}`);

  const content = readFile(counterFile);
  return content ? parseInt(content.trim(), 10) : 0;
}

/**
 * Increment the turn counter for this session
 */
function incrementTurnCount() {
  const sessionId = process.env.CLAUDE_SESSION_ID || process.ppid || 'default';
  const turnCountFile = path.join(require('os').tmpdir(), `claude-turn-count-${sessionId}`);

  let count = 1;
  const content = readFile(turnCountFile);
  if (content) {
    count = parseInt(content.trim(), 10) + 1;
  }

  const { writeFile } = require('../lib/utils');
  writeFile(turnCountFile, String(count));

  return count;
}

main().catch(err => {
  console.error('[TurnTracker] Error:', err.message);
  process.exit(0);
});
