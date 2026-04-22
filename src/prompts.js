'use strict';

const inquirer = require('inquirer');

// ── String helpers ────────────────────────────────────────────────────────────

function toSlug(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toTitleCase(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Derives a PHP namespace: "my-plugin" + vendor "Acme" → "Acme\MyPlugin" */
function toNamespace(vendor, slug) {
  const pluginPart = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  return vendor + '\\' + pluginPart;
}

/** Derives the PHP constant prefix: "my-plugin" → "MY_PLUGIN" */
function toConstant(slug) {
  return slug.replace(/-/g, '_').toUpperCase();
}

/** Lowercases vendor name for use in composer package name */
function toComposerVendor(vendor) {
  return vendor
    .replace(/([A-Z])/g, (_m, c, i) => (i > 0 ? '-' : '') + c.toLowerCase())
    .replace(/^-/, '');
}

// ── Prompt definitions ────────────────────────────────────────────────────────

async function collectAnswers(initialSlug) {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Plugin name:',
      default: initialSlug ? toTitleCase(initialSlug) : 'My WP CLI Plugin',
      validate: (v) => v.trim().length > 0 || 'Plugin name is required.',
    },
    {
      type: 'input',
      name: 'slug',
      message: 'Plugin slug (kebab-case):',
      default: (ans) => initialSlug || toSlug(ans.name),
      validate: (v) =>
        /^[a-z][a-z0-9-]+$/.test(v.trim()) ||
        'Must be lowercase kebab-case (e.g. my-plugin).',
    },
    {
      type: 'input',
      name: 'description',
      message: 'Short description:',
      default: (ans) => `${ans.name} — WP-CLI command plugin.`,
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author name:',
      validate: (v) => v.trim().length > 0 || 'Author name is required.',
    },
    {
      type: 'input',
      name: 'authorUri',
      message: 'Author URI:',
      default: 'https://example.com',
    },
    {
      type: 'input',
      name: 'pluginUri',
      message: 'Plugin URI:',
      default: (ans) => `https://example.com/${ans.slug}`,
    },
    {
      type: 'input',
      name: 'vendor',
      message: 'PHP namespace vendor (PascalCase, e.g. Acme):',
      default: 'MyCompany',
      validate: (v) =>
        /^[A-Z][A-Za-z0-9]+$/.test(v.trim()) ||
        'Must be PascalCase with no spaces (e.g. Acme).',
    },
    {
      type: 'input',
      name: 'command',
      message: 'WP-CLI top-level command name:',
      default: (ans) => ans.slug,
      validate: (v) =>
        /^[a-z][a-z0-9-]*$/.test(v.trim()) ||
        'Must be lowercase kebab-case (e.g. my-plugin).',
    },
    {
      type: 'input',
      name: 'minWp',
      message: 'Minimum WordPress version:',
      default: '6.4',
      validate: (v) => /^\d+\.\d+(\.\d+)?$/.test(v) || 'Use semver format (e.g. 6.4).',
    },
    {
      type: 'input',
      name: 'minPhp',
      message: 'Minimum PHP version:',
      default: '8.1',
      validate: (v) => /^\d+\.\d+(\.\d+)?$/.test(v) || 'Use semver format (e.g. 8.1).',
    },
    {
      type: 'input',
      name: 'version',
      message: 'Initial plugin version:',
      default: '1.0.0',
      validate: (v) => /^\d+\.\d+\.\d+$/.test(v) || 'Use semver format (e.g. 1.0.0).',
    },
  ]);

  const slug = answers.slug.trim();
  const vendor = answers.vendor.trim();

  return {
    name: answers.name.trim(),
    slug,
    description: answers.description.trim(),
    author: answers.author.trim(),
    authorUri: answers.authorUri.trim(),
    pluginUri: answers.pluginUri.trim(),
    vendor,
    command: answers.command.trim(),
    minWp: answers.minWp.trim(),
    minPhp: answers.minPhp.trim(),
    version: answers.version.trim(),
    // Derived values
    namespace: toNamespace(vendor, slug),
    constant: toConstant(slug),
    composerVendor: toComposerVendor(vendor),
  };
}

module.exports = { collectAnswers, toSlug, toTitleCase, toNamespace, toConstant, toComposerVendor };
