#!/usr/bin/env node
/**
 * UserPromptSubmit Hook - Memory Capture
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Intercepts user prompts for trigger phrases and saves learnings
 * to the appropriate memory file (personal or project).
 *
 * Trigger patterns:
 *   ## <content>              -> personal memory (~/.claude/memories.md)
 *   # <content>               -> project memory (.claude/memories.md in cwd)
 *   remember this: <content>  -> project memory (case insensitive)
 *   note: <content>           -> project memory (case insensitive, start of prompt)
 *   save this: <content>      -> project memory (case insensitive)
 */

const path = require('path');
const {
  getHomeDir,
  getDateString,
  appendFile,
  ensureDir,
  readStdinJson,
  log
} = require(path.join(__dirname, '..', '..', 'scripts', 'lib', 'utils'));

/**
 * Match trigger patterns in the prompt and return the extracted content
 * and target type (personal or project).
 *
 * Returns null if no trigger is found.
 */
function matchTrigger(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return null;
  }

  // ## at start of a line -> personal memory
  const personalMatch = prompt.match(/^##\s+(.+)/m);
  if (personalMatch) {
    return { type: 'personal', content: personalMatch[1].trim() };
  }

  // # at start of a line -> project memory (check after ## to avoid false match)
  const projectHashMatch = prompt.match(/^#\s+(.+)/m);
  if (projectHashMatch) {
    return { type: 'project', content: projectHashMatch[1].trim() };
  }

  // "remember this: <content>" anywhere (case insensitive)
  const rememberMatch = prompt.match(/remember this:\s*(.+)/i);
  if (rememberMatch) {
    return { type: 'project', content: rememberMatch[1].trim() };
  }

  // "note: <content>" at start of prompt only (case insensitive)
  const noteMatch = prompt.match(/^note:\s*(.+)/im);
  if (noteMatch) {
    return { type: 'project', content: noteMatch[1].trim() };
  }

  // "save this: <content>" anywhere (case insensitive)
  const saveMatch = prompt.match(/save this:\s*(.+)/i);
  if (saveMatch) {
    return { type: 'project', content: saveMatch[1].trim() };
  }

  return null;
}

/**
 * Resolve the target file path based on memory type and working directory.
 */
function getMemoryFilePath(type, cwd) {
  if (type === 'personal') {
    return path.join(getHomeDir(), '.claude', 'memories.md');
  }
  // Project memory: .claude/memories.md in the current working directory
  const projectDir = cwd || process.cwd();
  return path.join(projectDir, '.claude', 'memories.md');
}

/**
 * Format a memory entry with timestamp.
 */
function formatEntry(content, date) {
  return `\n- [${date}] ${content}\n`;
}

/**
 * Truncate a string for display in log messages.
 */
function truncateForLog(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

async function main() {
  const input = await readStdinJson();
  const prompt = input.prompt || '';
  const cwd = input.cwd || process.cwd();

  const trigger = matchTrigger(prompt);

  if (!trigger) {
    // No trigger found, exit cleanly without output
    process.exit(0);
  }

  const memoryFile = getMemoryFilePath(trigger.type, cwd);
  const date = getDateString();
  const entry = formatEntry(trigger.content, date);

  // Ensure parent directory exists before writing
  ensureDir(path.dirname(memoryFile));
  appendFile(memoryFile, entry);

  const label = trigger.type === 'personal' ? 'personal' : 'project';
  log(`[Memory] Saved to ${label} memory: ${truncateForLog(trigger.content, 50)}`);

  // Exit cleanly so the prompt still reaches Claude
  process.exit(0);
}

main().catch(err => {
  log('[Memory] Error: ' + err.message);
  // Exit 0 so the session is not broken by hook errors
  process.exit(0);
});
