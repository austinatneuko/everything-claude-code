#!/usr/bin/env node
/**
 * Context Meter - Estimate and log context window usage
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on Stop hook. Estimates token usage based on tool call count and
 * turn count. Warns when approaching dangerous context territory.
 *
 * Heuristics (conservative estimates):
 * - Average tool call: ~500 tokens (input + output)
 * - Average turn: ~2000 tokens (user message + agent response)
 * - System prompt + rules: ~5000 tokens base
 * - Context window: ~200K tokens
 * - Danger zone: last 20% (160K+)
 *
 * Logs to ~/.claude/sessions/<date>-context.jsonl
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

const TOKENS_PER_TOOL_CALL = 500;
const TOKENS_PER_TURN = 2000;
const BASE_TOKENS = 5000;
const CONTEXT_WINDOW = 200000;
const DANGER_THRESHOLD = 0.8; // 80% = warn
const CRITICAL_THRESHOLD = 0.9; // 90% = strongly recommend /clear

async function main() {
  const sessionsDir = getSessionsDir();
  const today = getDateString();
  const contextFile = path.join(sessionsDir, `${today}-context.jsonl`);
  const sessionId = process.env.CLAUDE_SESSION_ID || process.ppid || 'default';

  ensureDir(sessionsDir);

  // Read current counts
  const toolCount = readCounter(`claude-tool-count-${sessionId}`);
  const turnCount = readCounter(`claude-turn-count-${sessionId}`);

  // Estimate token usage
  const estimatedTokens = BASE_TOKENS
    + (toolCount * TOKENS_PER_TOOL_CALL)
    + (turnCount * TOKENS_PER_TURN);

  const utilization = estimatedTokens / CONTEXT_WINDOW;
  const percentUsed = Math.round(utilization * 100);

  // Log measurement
  const measurement = {
    timestamp: getDateTimeString(),
    session_id: sessionId,
    tool_calls: toolCount,
    turns: turnCount,
    estimated_tokens: estimatedTokens,
    utilization_pct: percentUsed,
    context_window: CONTEXT_WINDOW
  };

  appendFile(contextFile, JSON.stringify(measurement) + '\n');

  // Warn at thresholds
  if (utilization >= CRITICAL_THRESHOLD) {
    log(`[ContextMeter] ${percentUsed}% estimated context used (${estimatedTokens.toLocaleString()}/${CONTEXT_WINDOW.toLocaleString()} tokens)`);
    log('[ContextMeter] CRITICAL: Checkpoint to SESSION.md and run /clear now');
  } else if (utilization >= DANGER_THRESHOLD) {
    log(`[ContextMeter] ${percentUsed}% estimated context used (${estimatedTokens.toLocaleString()}/${CONTEXT_WINDOW.toLocaleString()} tokens)`);
    log('[ContextMeter] WARNING: Consider checkpointing to SESSION.md and running /clear');
  }

  process.exit(0);
}

function readCounter(name) {
  const counterFile = path.join(require('os').tmpdir(), name);
  const content = readFile(counterFile);
  return content ? parseInt(content.trim(), 10) : 0;
}

main().catch(err => {
  console.error('[ContextMeter] Error:', err.message);
  process.exit(0);
});
