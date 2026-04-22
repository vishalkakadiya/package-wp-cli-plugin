'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = process.env.GITHUB_WORKSPACE || process.cwd();

function parseGitHubUrl(url) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/(issues|pull)\/(\d+)/);
  if (!match) throw new Error(`Invalid GitHub URL: ${url}`);
  return { owner: match[1], repo: match[2], type: match[3], number: parseInt(match[4]) };
}

async function githubApi(endpoint, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN env var is required');
  const res = await fetch(`https://api.github.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Tool schemas ──────────────────────────────────────────────────────────────

const CODING_TOOLS = [
  {
    name: 'fetch_github_issue',
    description: 'Fetch a GitHub issue title, body, and labels',
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'Full GitHub issue URL' } },
      required: ['url'],
    },
  },
  {
    name: 'list_repo_files',
    description: 'List source files in the repo (excludes node_modules, .git, .idea)',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'read_file',
    description: 'Read a file by relative path (max 4000 chars)',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Relative path from repo root' } },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file (creates parent dirs if needed)',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'run_shell',
    description: 'Run a shell command in the repo root (30s timeout)',
    input_schema: {
      type: 'object',
      properties: { command: { type: 'string' } },
      required: ['command'],
    },
  },
  {
    name: 'create_github_pr',
    description: 'Create a GitHub Pull Request',
    input_schema: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        repo: { type: 'string' },
        title: { type: 'string' },
        body: { type: 'string', description: 'Markdown PR description referencing the issue' },
        head: { type: 'string', description: 'Feature branch name' },
        base: { type: 'string', description: 'Target branch (usually main)' },
      },
      required: ['owner', 'repo', 'title', 'body', 'head', 'base'],
    },
  },
];

const QA_TOOLS = [
  {
    name: 'fetch_pr_diff',
    description: 'Fetch the unified diff of a GitHub PR (max 6000 chars)',
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'Full GitHub PR URL' } },
      required: ['url'],
    },
  },
  {
    name: 'read_file',
    description: 'Read a file by relative path (max 4000 chars)',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
    },
  },
  {
    name: 'run_shell',
    description: 'Run a shell command for testing (30s timeout)',
    input_schema: {
      type: 'object',
      properties: { command: { type: 'string' } },
      required: ['command'],
    },
  },
  {
    name: 'post_pr_review',
    description: 'Post a review on a GitHub PR',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Full GitHub PR URL' },
        body: { type: 'string', description: 'Review comment (be concise)' },
        event: {
          type: 'string',
          enum: ['APPROVE', 'REQUEST_CHANGES', 'COMMENT'],
        },
      },
      required: ['url', 'body', 'event'],
    },
  },
];

// ── Tool handlers ─────────────────────────────────────────────────────────────

async function handleTool(name, input) {
  switch (name) {
    case 'fetch_github_issue': {
      const { owner, repo, number } = parseGitHubUrl(input.url);
      const issue = await githubApi(`/repos/${owner}/${repo}/issues/${number}`);
      return {
        title: issue.title,
        body: issue.body,
        labels: issue.labels.map((l) => l.name),
        state: issue.state,
      };
    }

    case 'list_repo_files': {
      const out = execSync(
        `find "${REPO_ROOT}" -type f \
          -not -path "*/node_modules/*" \
          -not -path "*/.git/*" \
          -not -path "*/.idea/*" \
          -not -path "*/agents/node_modules/*"`,
        { encoding: 'utf8' }
      );
      return out
        .trim()
        .split('\n')
        .map((f) => f.replace(REPO_ROOT + '/', ''));
    }

    case 'read_file': {
      const abs = path.join(REPO_ROOT, input.path);
      const content = fs.readFileSync(abs, 'utf8');
      return content.length > 4000 ? content.slice(0, 4000) + '\n...[truncated]' : content;
    }

    case 'write_file': {
      const abs = path.join(REPO_ROOT, input.path);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, input.content, 'utf8');
      return `Written: ${input.path}`;
    }

    case 'run_shell': {
      try {
        const out = execSync(input.command, {
          cwd: REPO_ROOT,
          encoding: 'utf8',
          timeout: 30000,
        });
        return out.trim() || '(no output)';
      } catch (err) {
        return `Exit ${err.status}: ${(err.stderr || err.message || '').slice(0, 500)}`;
      }
    }

    case 'create_github_pr': {
      const { owner, repo, title, body, head, base } = input;
      const pr = await githubApi(`/repos/${owner}/${repo}/pulls`, {
        method: 'POST',
        body: JSON.stringify({ title, body, head, base }),
      });
      return { pr_url: pr.html_url, pr_number: pr.number };
    }

    case 'fetch_pr_diff': {
      const { owner, repo, number } = parseGitHubUrl(input.url);
      const token = process.env.GITHUB_TOKEN;
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3.diff',
          },
        }
      );
      const diff = await res.text();
      return diff.length > 6000 ? diff.slice(0, 6000) + '\n...[truncated]' : diff;
    }

    case 'post_pr_review': {
      const { owner, repo, number } = parseGitHubUrl(input.url);
      await githubApi(`/repos/${owner}/${repo}/pulls/${number}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ body: input.body, event: input.event }),
      });
      return `Review posted: ${input.event}`;
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

module.exports = { CODING_TOOLS, QA_TOOLS, handleTool, parseGitHubUrl };
