'use strict';

const { runCodingAgent } = require('./coding-agent');
const { runQAAgent } = require('./qa-agent');

async function runWorkflow(issueUrl) {
  console.log(`\n[Coding Agent] Fixing: ${issueUrl}`);
  const prUrl = await runCodingAgent(issueUrl);

  if (!prUrl) {
    console.error('[Coding Agent] Could not extract PR URL from agent output.');
    process.exit(1);
  }

  console.log(`[Coding Agent] PR created: ${prUrl}`);

  console.log(`\n[QA Agent] Reviewing: ${prUrl}`);
  await runQAAgent(prUrl);
  console.log('[QA Agent] Review posted.');

  return prUrl;
}

module.exports = { runWorkflow };
