# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

`package-wp-cli-plugin` is a Node.js CLI scaffolding tool that generates a ready-to-activate WordPress plugin with a WP-CLI command and `--dry-run` support.

## Running the CLI

```bash
# Install dependencies first
npm install

# Run interactively (from repo root)
node bin/package-wp-cli-plugin.js

# Pass slug upfront to skip the first prompt
node bin/package-wp-cli-plugin.js my-awesome-plugin
```

No build step — the package ships plain CommonJS.

## Testing

```bash
npm test                  # run all tests once
npm run test:watch        # re-run on file change
npm run test:coverage     # with coverage report
```

Tests live in `tests/` and cover three modules:

| File | What's tested |
|---|---|
| `tests/prompts.test.js` | String helpers: `toSlug`, `toTitleCase`, `toNamespace`, `toConstant`, `toComposerVendor` |
| `tests/templates.test.js` | All template functions (`mainPlugin`, `pluginClass`, `cliCommand`, `composerJson`, `gitIgnore`, `readme`) |
| `tests/generator.test.js` | `generate()` — file paths, count, and content; `fs-extra` is mocked |

**Rule:** whenever you change any file in `src/`, update the corresponding test file so all tests continue to pass before marking the task done.

## Architecture

The scaffolder (`src/`) and the AI agents (`agents/`) are independent subsystems with separate `package.json` files.

### Scaffolder (`src/` + `bin/`)

The flow is strictly linear:

1. **`bin/package-wp-cli-plugin.js`** — CLI entry point via `commander`; calls `src/index.js:run()`
2. **`src/index.js`** — orchestrates: print banner → collect answers → generate files → print success
3. **`src/prompts.js`** — `inquirer` prompt definitions + string-transformation helpers (`toSlug`, `toNamespace`, `toConstant`, `toComposerVendor`). Returns a normalized `answers` object that includes derived values (`namespace`, `constant`, `composerVendor`).
4. **`src/generator.js`** — receives `answers`, resolves the output directory, delegates each file's content to `src/templates.js`, writes via `fs-extra`.
5. **`src/templates.js`** — pure functions that return file content strings for every generated file (`mainPlugin`, `pluginClass`, `cliCommand`, `composerJson`, `gitIgnore`, `readme`). The helper `fqcn(namespace, ...parts)` builds PHP fully-qualified class names with a leading backslash.

When adding a new generated file, add a template function in `templates.js` and register it in the `files` map in `generator.js`.

### AI Agents (`agents/`)

A two-agent pipeline that automates GitHub issue resolution. Requires its own dependency install:

```bash
cd agents && npm install
```

**Required environment variables** (set in `.env` at repo root or exported):
- `ANTHROPIC_API_KEY`
- `GITHUB_TOKEN`

**Run the workflow:**
```bash
node agents/index.js https://github.com/owner/repo/issues/42
```

Pipeline:
1. **`workflow.js`** — runs `coding-agent` then `qa-agent` in sequence
2. **`coding-agent.js`** — uses `claude-sonnet-4-6`; fetches the issue, reads/writes repo files, creates a git branch (`fix/issue-{number}`), commits, pushes, opens a PR; extracts the PR URL from the final text response
3. **`qa-agent.js`** — uses `claude-haiku-4-5-20251001`; fetches the PR diff, optionally reads files or runs shell commands, posts an APPROVE/REQUEST_CHANGES/COMMENT review
4. **`tools.js`** — shared tool schemas (`CODING_TOOLS`, `QA_TOOLS`) and a single `handleTool` dispatcher; all GitHub API calls go through `githubApi()`; `REPO_ROOT` defaults to `process.env.GITHUB_WORKSPACE || process.cwd()`

The coding and QA agents use an agentic loop (`while(true)`) that breaks on `stop_reason === 'end_turn'` and dispatches tool calls on `stop_reason === 'tool_use'`.
