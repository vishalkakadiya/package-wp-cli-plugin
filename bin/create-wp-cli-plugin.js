#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const { run } = require('../src/index');
const pkg = require('../package.json');

program
  .name('create-wp-cli-plugin')
  .description('Scaffold a WordPress plugin with a WP-CLI command and dry-run support')
  .version(pkg.version, '-v, --version')
  .argument('[slug]', 'Plugin slug (kebab-case, e.g. my-awesome-plugin)')
  .allowExcessArguments(false)
  .action((slug) => {
    run({ slug }).catch((err) => {
      const chalk = require('chalk');
      console.error('\n' + chalk.red('Error: ') + err.message + '\n');
      process.exit(1);
    });
  });

program.parse();
