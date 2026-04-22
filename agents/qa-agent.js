'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { QA_TOOLS, handleTool, parseGitHubUrl } = require('./tools');

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a QA agent for the "create-wp-cli-plugin" npm package.

Task: Review a GitHub PR and post a concise review.

Workflow (follow in order):
1. fetch_pr_diff — read what changed
2. read_file — read a changed file only if the diff alone is unclear
3. run_shell — run "node bin/create-wp-cli-plugin.js --help" to verify CLI still works
   - If the PR branch is checked out, also run: npm test (skip if no test script)
4. post_pr_review — post APPROVE, REQUEST_CHANGES, or COMMENT

Review criteria:
- Does the fix actually address the change described in the PR body?
- Does the CLI still start without errors?
- No obvious syntax errors or broken imports?

Keep your review body to 3–5 bullet points. Be direct.`;

async function runQAAgent(prUrl) {
  if (!prUrl) {
    console.log('  [qa] No PR URL provided — skipping');
    return;
  }

  parseGitHubUrl(prUrl); // validate URL early

  const messages = [
    { role: 'user', content: `Review this PR and post your verdict: ${prUrl}` },
  ];

  while (true) {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: QA_TOOLS,
      messages,
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') break;

    if (response.stop_reason === 'tool_use') {
      const results = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        console.log(`  [qa] ${block.name}`, JSON.stringify(block.input).slice(0, 120));
        let content;
        try {
          content = JSON.stringify(await handleTool(block.name, block.input));
        } catch (err) {
          content = `Error: ${err.message}`;
        }
        results.push({ type: 'tool_result', tool_use_id: block.id, content });
      }
      messages.push({ role: 'user', content: results });
    }
  }
}

module.exports = { runQAAgent };
