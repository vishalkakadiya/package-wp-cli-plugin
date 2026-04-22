'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { CODING_TOOLS, handleTool, parseGitHubUrl } = require('./tools');

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a coding agent for the "create-wp-cli-plugin" npm package (a CLI scaffolding tool).

Task: Given a GitHub issue URL, fix the issue and open a PR.

Workflow (follow in order):
1. fetch_github_issue — understand the problem
2. list_repo_files — see what files exist (focus on src/ and bin/)
3. read_file — read only files relevant to the issue
4. write_file — apply the minimal fix
5. run_shell — git commands: checkout branch, add, commit, push
   - Branch name: fix/issue-{number}
   - Commit: "fix: <short description> (closes #{number})"
   - Push: git push -u origin fix/issue-{number}
6. create_github_pr — open the PR with title and body referencing the issue

Rules:
- Touch only files needed to fix the issue
- Keep the fix minimal
- When done, output ONLY the PR URL on the last line`;

async function runCodingAgent(issueUrl) {
  const { number } = parseGitHubUrl(issueUrl);
  const messages = [
    { role: 'user', content: `Fix this GitHub issue and create a PR: ${issueUrl}` },
  ];

  while (true) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: CODING_TOOLS,
      messages,
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') {
      const text = response.content.find((b) => b.type === 'text')?.text ?? '';
      const match = text.match(/https:\/\/github\.com\/[^\s]+\/pull\/\d+/);
      return match?.[0] ?? null;
    }

    if (response.stop_reason === 'tool_use') {
      const results = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        console.log(`  [coding] ${block.name}`, JSON.stringify(block.input).slice(0, 120));
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

module.exports = { runCodingAgent };
