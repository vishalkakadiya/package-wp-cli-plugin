'use strict';

const chalk = require('chalk');
const { collectAnswers } = require('./prompts');
const { generate } = require('./generator');

async function run({ slug } = {}) {
  printBanner();

  const answers = await collectAnswers(slug);
  await generate(answers);
  printSuccess(answers);
}

function printBanner() {
  console.log('');
  console.log(chalk.bold('  ┌─────────────────────────────────┐'));
  console.log(chalk.bold('  │   ') + chalk.bold.blue('create-wp-cli-plugin') + chalk.bold('       │'));
  console.log(chalk.bold('  │   ') + chalk.gray('WordPress Plugin Scaffolder') + chalk.bold('  │'));
  console.log(chalk.bold('  └─────────────────────────────────┘'));
  console.log('');
}

function printSuccess({ slug, command }) {
  console.log('');
  console.log(chalk.bold.green('  ✓ Plugin scaffolded!'));
  console.log('');
  console.log(chalk.bold('  Next steps:'));
  console.log('');
  console.log('    ' + chalk.cyan('cd') + ' ' + slug);
  console.log('    ' + chalk.cyan('composer install'));
  console.log('    ' + chalk.gray('# Symlink or copy to wp-content/plugins/'));
  console.log('    ' + chalk.cyan('wp plugin activate') + ' ' + slug);
  console.log('');
  console.log(chalk.bold('  Test your WP-CLI command:'));
  console.log('');
  console.log('    ' + chalk.cyan('wp ' + command + ' status'));
  console.log('    ' + chalk.cyan('wp ' + command + ' run --dry-run'));
  console.log('    ' + chalk.cyan('wp ' + command + ' run'));
  console.log('');
  console.log(
    '  ' +
      chalk.gray('Docs: https://make.wordpress.org/cli/handbook/guides/commands-cookbook/')
  );
  console.log('');
}

module.exports = { run };
