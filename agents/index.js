#!/usr/bin/env node
'use strict';

const { runWorkflow } = require('./workflow');

const issueUrl = process.argv[2];

if (!issueUrl || !issueUrl.includes('github.com')) {
  console.error('Usage: node agents/index.js <github-issue-url>');
  console.error('Example: node agents/index.js https://github.com/owner/repo/issues/42');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is required.');
  process.exit(1);
}

if (!process.env.GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable is required.');
  process.exit(1);
}

runWorkflow(issueUrl)
  .then((prUrl) => {
    console.log(`\nDone! PR: ${prUrl}`);
  })
  .catch((err) => {
    console.error('\nError:', err.message);
    process.exit(1);
  });
