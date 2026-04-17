'use strict';

const path = require('path');
const fse = require('fs-extra');
const chalk = require('chalk');
const templates = require('./templates');

async function generate(opts) {
  const { slug } = opts;
  const dest = path.resolve(process.cwd(), slug);

  if (await fse.pathExists(dest)) {
    throw new Error(`Directory "${slug}" already exists in ${process.cwd()}.`);
  }

  const files = {
    [`${slug}.php`]:              templates.mainPlugin(opts),
    'composer.json':              templates.composerJson(opts),
    '.gitignore':                 templates.gitIgnore(),
    'README.md':                  templates.readme(opts),
    'includes/Plugin.php':        templates.pluginClass(opts),
    'includes/CLI/Command.php':   templates.cliCommand(opts),
    'languages/.gitkeep':         '',
  };

  console.log('');
  console.log(chalk.bold(`  Creating ${chalk.cyan(slug)}/`));
  console.log('');

  for (const [relPath, content] of Object.entries(files)) {
    const absPath = path.join(dest, relPath);
    await fse.outputFile(absPath, content, 'utf8');
    console.log(`    ${chalk.green('+')} ${relPath}`);
  }
}

module.exports = { generate };
