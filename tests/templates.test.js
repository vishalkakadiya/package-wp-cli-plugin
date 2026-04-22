'use strict';

const templates = require('../src/templates');

const opts = {
  name: 'My Plugin',
  slug: 'my-plugin',
  description: 'A test plugin.',
  author: 'Test Author',
  authorUri: 'https://example.com',
  pluginUri: 'https://example.com/my-plugin',
  vendor: 'TestVendor',
  command: 'my-plugin',
  minWp: '6.4',
  minPhp: '8.1',
  version: '1.0.0',
  namespace: 'TestVendor\\MyPlugin',
  constant: 'MY_PLUGIN',
  composerVendor: 'test-vendor',
};

// ---------------------------------------------------------------------------
// mainPlugin
// ---------------------------------------------------------------------------

describe('mainPlugin', () => {
  let output;
  beforeAll(() => {
    output = templates.mainPlugin(opts);
  });

  test('includes the plugin header block', () => {
    expect(output).toContain('Plugin Name: My Plugin');
    expect(output).toContain('Description: A test plugin.');
    expect(output).toContain('Version:     1.0.0');
    expect(output).toContain('Author:      Test Author');
    expect(output).toContain('Author URI:  https://example.com');
    expect(output).toContain('Plugin URI:  https://example.com/my-plugin');
    expect(output).toContain('Text Domain: my-plugin');
    expect(output).toContain('Requires at least: 6.4');
    expect(output).toContain('Requires PHP:      8.1');
  });

  test('has ABSPATH security guard', () => {
    expect(output).toContain("defined( 'ABSPATH' ) || exit");
  });

  test('defines all four plugin constants', () => {
    expect(output).toContain("define( 'MY_PLUGIN_VERSION'");
    expect(output).toContain("define( 'MY_PLUGIN_PLUGIN_FILE'");
    expect(output).toContain("define( 'MY_PLUGIN_PLUGIN_DIR'");
    expect(output).toContain("define( 'MY_PLUGIN_PLUGIN_URL'");
  });

  test('boots on plugins_loaded with a static closure', () => {
    expect(output).toContain("add_action( 'plugins_loaded', static function");
  });

  test('calls Plugin::get_instance() with fully-qualified class name', () => {
    expect(output).toContain('\\TestVendor\\MyPlugin\\Plugin');
  });

  test('guards WP-CLI registration behind WP_CLI constant', () => {
    expect(output).toContain("defined( 'WP_CLI' ) && WP_CLI");
  });

  test('registers the correct WP-CLI command name', () => {
    expect(output).toContain("WP_CLI::add_command( 'my-plugin'");
  });

  test('references the CLI Command class with fully-qualified name', () => {
    expect(output).toContain('\\TestVendor\\MyPlugin\\CLI\\Command');
  });
});

// ---------------------------------------------------------------------------
// pluginClass
// ---------------------------------------------------------------------------

describe('pluginClass', () => {
  let output;
  beforeAll(() => {
    output = templates.pluginClass(opts);
  });

  test('declares the correct namespace', () => {
    expect(output).toContain('namespace TestVendor\\MyPlugin;');
  });

  test('has ABSPATH security guard', () => {
    expect(output).toContain("defined( 'ABSPATH' ) || exit");
  });

  test('is a final class named Plugin', () => {
    expect(output).toContain('final class Plugin');
  });

  test('implements a static get_instance() singleton', () => {
    expect(output).toContain('public static function get_instance()');
    expect(output).toContain('private static ?self $instance = null');
  });

  test('has a private constructor to prevent direct instantiation', () => {
    expect(output).toContain('private function __construct()');
  });

  test('loads the textdomain on the init hook', () => {
    expect(output).toContain("add_action( 'init', [ \$this, 'load_textdomain' ]");
  });

  test('passes the correct slug to load_plugin_textdomain', () => {
    expect(output).toContain("load_plugin_textdomain(\n\t\t\t'my-plugin'");
  });
});

// ---------------------------------------------------------------------------
// cliCommand
// ---------------------------------------------------------------------------

describe('cliCommand', () => {
  let output;
  beforeAll(() => {
    output = templates.cliCommand(opts);
  });

  test('declares the CLI sub-namespace', () => {
    expect(output).toContain('namespace TestVendor\\MyPlugin\\CLI;');
  });

  test('has ABSPATH security guard', () => {
    expect(output).toContain("defined( 'ABSPATH' ) || exit");
  });

  test('defines a class named Command', () => {
    expect(output).toContain('class Command');
  });

  test('includes a status sub-command', () => {
    expect(output).toContain('public function status(');
  });

  test('includes a run sub-command', () => {
    expect(output).toContain('public function run(');
  });

  test('uses WP_CLI\\Utils\\get_flag_value for --dry-run', () => {
    expect(output).toContain("\\WP_CLI\\Utils\\get_flag_value( \$assoc_args, 'dry-run'");
  });

  test('uses WP_CLI\\Utils\\format_items for output', () => {
    expect(output).toContain('\\WP_CLI\\Utils\\format_items(');
  });

  test('shows the correct command name in doc examples', () => {
    expect(output).toContain('wp my-plugin status');
    expect(output).toContain('wp my-plugin run --dry-run');
  });

  test('has private collect_items and process_item helpers', () => {
    expect(output).toContain('private function collect_items()');
    expect(output).toContain('private function process_item(');
  });

  test('status sub-command uses the plugin version constant', () => {
    expect(output).toContain('MY_PLUGIN_VERSION');
  });
});

// ---------------------------------------------------------------------------
// composerJson
// ---------------------------------------------------------------------------

describe('composerJson', () => {
  let parsed;
  beforeAll(() => {
    parsed = JSON.parse(templates.composerJson(opts));
  });

  test('produces valid JSON', () => {
    expect(parsed).toBeDefined();
  });

  test('sets the package name to <composerVendor>/<slug>', () => {
    expect(parsed.name).toBe('test-vendor/my-plugin');
  });

  test('sets the PHP version requirement', () => {
    expect(parsed.require.php).toBe('>=8.1');
  });

  test('sets the PSR-4 autoload entry with a trailing backslash', () => {
    expect(parsed.autoload['psr-4']['TestVendor\\MyPlugin\\']).toBe('includes/');
  });

  test('sets type to wordpress-plugin', () => {
    expect(parsed.type).toBe('wordpress-plugin');
  });

  test('includes wp-cli/wp-cli as a dev dependency', () => {
    expect(parsed['require-dev']['wp-cli/wp-cli']).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// gitIgnore
// ---------------------------------------------------------------------------

describe('gitIgnore', () => {
  let output;
  beforeAll(() => {
    output = templates.gitIgnore();
  });

  test('ignores the vendor directory', () => {
    expect(output).toContain('/vendor/');
  });

  test('ignores node_modules', () => {
    expect(output).toContain('node_modules/');
  });

  test('ignores macOS .DS_Store', () => {
    expect(output).toContain('.DS_Store');
  });
});

// ---------------------------------------------------------------------------
// readme
// ---------------------------------------------------------------------------

describe('readme', () => {
  let output;
  beforeAll(() => {
    output = templates.readme(opts);
  });

  test('starts with the plugin name as a heading', () => {
    expect(output.trimStart()).toMatch(/^# My Plugin/);
  });

  test('includes the plugin description', () => {
    expect(output).toContain('A test plugin.');
  });

  test('shows the minimum WP and PHP versions', () => {
    expect(output).toContain('6.4');
    expect(output).toContain('8.1');
  });

  test('documents the status command', () => {
    expect(output).toContain('wp my-plugin status');
  });

  test('documents the dry-run flag', () => {
    expect(output).toContain('--dry-run');
  });

  test('includes the scaffolder attribution', () => {
    expect(output).toContain('package-wp-cli-plugin');
  });
});
