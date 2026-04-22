'use strict';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wraps a PHP FQCN with a leading backslash: "Acme\MyPlugin" → "\Acme\MyPlugin" */
function fqcn(namespace, ...parts) {
  return '\\' + [namespace, ...parts].join('\\');
}

// ---------------------------------------------------------------------------
// Main plugin file  ({slug}.php)
// ---------------------------------------------------------------------------

function mainPlugin(opts) {
  const {
    name, slug, description, author, authorUri, pluginUri,
    namespace, command, constant, version, minWp, minPhp,
  } = opts;

  return `<?php
/**
 * Plugin Name: ${name}
 * Plugin URI:  ${pluginUri}
 * Description: ${description}
 * Version:     ${version}
 * Author:      ${author}
 * Author URI:  ${authorUri}
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: ${slug}
 * Domain Path: /languages
 * Requires at least: ${minWp}
 * Requires PHP:      ${minPhp}
 *
 * @package ${namespace}
 */

defined( 'ABSPATH' ) || exit;

define( '${constant}_VERSION', '${version}' );
define( '${constant}_PLUGIN_FILE', __FILE__ );
define( '${constant}_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( '${constant}_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Composer autoloader — run "composer install" before activating.
if ( file_exists( __DIR__ . '/vendor/autoload.php' ) ) {
\trequire_once __DIR__ . '/vendor/autoload.php';
}

/**
 * Boots the plugin on plugins_loaded so all plugins are available.
 *
 * Using a static closure avoids accidentally binding $this inside the hook.
 */
add_action( 'plugins_loaded', static function (): void {
\t${fqcn(namespace, 'Plugin')}::get_instance()->init();
} );

// Register WP-CLI commands — only when WP-CLI is actually running.
if ( defined( 'WP_CLI' ) && WP_CLI ) {
\t\\WP_CLI::add_command( '${command}', ${fqcn(namespace, 'CLI', 'Command')}::class );
}
`;
}

// ---------------------------------------------------------------------------
// includes/Plugin.php
// ---------------------------------------------------------------------------

function pluginClass(opts) {
  const { namespace, slug, constant } = opts;

  return `<?php
/**
 * Core plugin bootstrap.
 *
 * @package ${namespace}
 */

namespace ${namespace};

defined( 'ABSPATH' ) || exit;

/**
 * Main plugin class.
 *
 * Instantiated once via get_instance(). Everything that needs to run on
 * the WordPress request cycle is registered here through hooks.
 */
final class Plugin {

\t/**
\t * Single instance of this class.
\t */
\tprivate static ?self $instance = null;

\t/**
\t * Returns the singleton instance.
\t */
\tpublic static function get_instance(): self {
\t\tif ( null === self::$instance ) {
\t\t\tself::$instance = new self();
\t\t}

\t\treturn self::$instance;
\t}

\t/**
\t * Prevent direct instantiation and cloning.
\t */
\tprivate function __construct() {}
\tprivate function __clone() {}

\t/**
\t * Registers WordPress hooks.
\t *
\t * Called once by the plugins_loaded hook in the main plugin file.
\t */
\tpublic function init(): void {
\t\tadd_action( 'init', [ $this, 'load_textdomain' ] );
\t}

\t/**
\t * Loads the plugin text domain for translations.
\t */
\tpublic function load_textdomain(): void {
\t\tload_plugin_textdomain(
\t\t\t'${slug}',
\t\t\tfalse,
\t\t\tdirname( plugin_basename( ${constant}_PLUGIN_FILE ) ) . '/languages'
\t\t);
\t}
}
`;
}

// ---------------------------------------------------------------------------
// includes/CLI/Command.php
// ---------------------------------------------------------------------------

function cliCommand(opts) {
  const { namespace, name, command, constant } = opts;
  const cliNs = namespace + '\\CLI';

  return `<?php
/**
 * WP-CLI command class.
 *
 * @package ${namespace}
 */

namespace ${cliNs};

defined( 'ABSPATH' ) || exit;

/**
 * Manages ${name} operations via WP-CLI.
 *
 * ## EXAMPLES
 *
 *     # Show plugin status
 *     wp ${command} status
 *
 *     # Preview what "run" would do (no writes)
 *     wp ${command} run --dry-run
 *
 *     # Execute for real
 *     wp ${command} run
 */
class Command {

\t// -----------------------------------------------------------------------
\t// Sub-commands
\t// -----------------------------------------------------------------------

\t/**
\t * Shows the current status of the plugin.
\t *
\t * ## EXAMPLES
\t *
\t *     wp ${command} status
\t *
\t * @when after_wp_load
\t *
\t * @param array<int, string>    $args       Positional arguments (unused).
\t * @param array<string, mixed>  $assoc_args Named/flag arguments (unused).
\t */
\tpublic function status( array $args, array $assoc_args ): void {
\t\t\\WP_CLI\\Utils\\format_items(
\t\t\t'table',
\t\t\t[
\t\t\t\t[ 'Setting' => 'Plugin version',    'Value' => ${constant}_VERSION ],
\t\t\t\t[ 'Setting' => 'WordPress version', 'Value' => get_bloginfo( 'version' ) ],
\t\t\t\t[ 'Setting' => 'PHP version',       'Value' => PHP_VERSION ],
\t\t\t],
\t\t\t[ 'Setting', 'Value' ]
\t\t);
\t}

\t/**
\t * Runs the ${name} process.
\t *
\t * ## OPTIONS
\t *
\t * [--dry-run]
\t * : Preview every change without writing anything to the database.
\t *
\t * [--format=<format>]
\t * : Output format for the results table.
\t * ---
\t * default: table
\t * options:
\t *   - table
\t *   - json
\t *   - csv
\t * ---
\t *
\t * ## EXAMPLES
\t *
\t *     # Preview — nothing is written
\t *     wp ${command} run --dry-run
\t *
\t *     # Preview with JSON output
\t *     wp ${command} run --dry-run --format=json
\t *
\t *     # Execute for real
\t *     wp ${command} run
\t *
\t * @when after_wp_load
\t *
\t * @param array<int, string>    $args       Positional arguments (unused).
\t * @param array<string, mixed>  $assoc_args Named/flag arguments.
\t */
\tpublic function run( array $args, array $assoc_args ): void {
\t\t$dry_run = (bool) \\WP_CLI\\Utils\\get_flag_value( $assoc_args, 'dry-run', false );
\t\t$format  = (string) \\WP_CLI\\Utils\\get_flag_value( $assoc_args, 'format', 'table' );

\t\tif ( $dry_run ) {
\t\t\t\\WP_CLI::warning( 'Dry-run mode — no changes will be written to the database.' );
\t\t}

\t\t$items = $this->collect_items();

\t\tif ( empty( $items ) ) {
\t\t\t\\WP_CLI::success( 'Nothing to process.' );
\t\t\treturn;
\t\t}

\t\t\\WP_CLI::log(
\t\t\tsprintf( 'Found %d item(s) to process.', count( $items ) )
\t\t);

\t\t$results   = [];
\t\t$processed = 0;
\t\t$skipped   = 0;

\t\tforeach ( $items as $item ) {
\t\t\tif ( $dry_run ) {
\t\t\t\t$results[] = [
\t\t\t\t\t'ID'     => $item['id'],
\t\t\t\t\t'Label'  => $item['label'],
\t\t\t\t\t'Status' => '[dry-run] would process',
\t\t\t\t];
\t\t\t\tcontinue;
\t\t\t}

\t\t\t$success = $this->process_item( $item );

\t\t\t$results[] = [
\t\t\t\t'ID'     => $item['id'],
\t\t\t\t'Label'  => $item['label'],
\t\t\t\t'Status' => $success ? 'processed' : 'skipped',
\t\t\t];

\t\t\t$success ? $processed++ : $skipped++;
\t\t}

\t\t\\WP_CLI\\Utils\\format_items( $format, $results, [ 'ID', 'Label', 'Status' ] );

\t\tif ( $dry_run ) {
\t\t\t\\WP_CLI::success(
\t\t\t\tsprintf(
\t\t\t\t\t'Dry-run complete — %d item(s) would be processed. Run without --dry-run to apply.',
\t\t\t\t\tcount( $items )
\t\t\t\t)
\t\t\t);
\t\t\treturn;
\t\t}

\t\t\\WP_CLI::success(
\t\t\tsprintf( 'Done. Processed: %d  Skipped: %d', $processed, $skipped )
\t\t);
\t}

\t// -----------------------------------------------------------------------
\t// Private helpers — replace these with your real business logic
\t// -----------------------------------------------------------------------

\t/**
\t * Returns the list of items to process.
\t *
\t * Replace this with a real WP_Query, $wpdb query, or API call.
\t *
\t * @return array<int, array{id: int, label: string}>
\t */
\tprivate function collect_items(): array {
\t\t// TODO: swap with real data retrieval.
\t\treturn [
\t\t\t[ 'id' => 1, 'label' => 'Example item A' ],
\t\t\t[ 'id' => 2, 'label' => 'Example item B' ],
\t\t\t[ 'id' => 3, 'label' => 'Example item C' ],
\t\t];
\t}

\t/**
\t * Processes a single item.
\t *
\t * Replace this with the real write operation (update_post_meta, $wpdb->update, etc.).
\t * Return false to mark the item as skipped in the results table.
\t *
\t * @param array{id: int, label: string} $item
\t * @return bool True on success, false on skip/failure.
\t */
\tprivate function process_item( array $item ): bool {
\t\t// TODO: replace with real processing logic.
\t\treturn true;
\t}
}
`;
}

// ---------------------------------------------------------------------------
// composer.json
// ---------------------------------------------------------------------------

function composerJson(opts) {
  const { namespace, slug, description, composerVendor, minPhp } = opts;
  // PSR-4 autoload key must end with \\
  // PSR-4 key must end with exactly one backslash: "Vendor\Plugin\"
  const psr4Key = namespace + '\\';

  return JSON.stringify(
    {
      name: `${composerVendor}/${slug}`,
      description,
      type: 'wordpress-plugin',
      license: 'GPL-2.0-or-later',
      require: {
        php: `>=${minPhp}`,
      },
      'require-dev': {
        'wp-cli/wp-cli': '^2.10',
      },
      autoload: {
        'psr-4': {
          [psr4Key]: 'includes/',
        },
      },
      config: {
        'optimize-autoloader': true,
        'sort-packages': true,
        'allow-plugins': {
          'dealerdirect/phpcodesniffer-composer-installer': true,
        },
      },
      'minimum-stability': 'stable',
      'prefer-stable': true,
    },
    null,
    4
  ) + '\n';
}

// ---------------------------------------------------------------------------
// .gitignore
// ---------------------------------------------------------------------------

function gitIgnore() {
  return `# Composer
/vendor/
composer.lock

# Node
node_modules/

# WordPress test suite
/tmp/

# OS / IDE
.DS_Store
Thumbs.db
.idea/
.vscode/
*.swp
*.swo

# Build artefacts
*.log
`;
}

// ---------------------------------------------------------------------------
// README.md (for the generated plugin)
// ---------------------------------------------------------------------------

function readme(opts) {
  const { name, slug, description, author, command, version, minWp, minPhp } = opts;

  return `# ${name}

${description}

## Requirements

| Dependency | Minimum version |
|---|---|
| WordPress | ${minWp} |
| PHP | ${minPhp} |
| WP-CLI | 2.8 |
| Composer | 2.x |

## Installation

\`\`\`bash
# 1. Clone into your plugins directory
git clone <repo-url> wp-content/plugins/${slug}
cd wp-content/plugins/${slug}

# 2. Install PHP dependencies
composer install --no-dev --optimize-autoloader

# 3. Activate the plugin
wp plugin activate ${slug}
\`\`\`

## WP-CLI Commands

### Show status

\`\`\`bash
wp ${command} status
\`\`\`

### Run the process (preview first!)

\`\`\`bash
# Preview — reads the database, writes nothing
wp ${command} run --dry-run

# Preview with JSON output
wp ${command} run --dry-run --format=json

# Apply for real
wp ${command} run
\`\`\`

#### Options

| Option | Default | Description |
|---|---|---|
| \`--dry-run\` | \`false\` | Preview changes without writing to the database |
| \`--format\` | \`table\` | Output format: \`table\`, \`json\`, or \`csv\` |

## Development

\`\`\`bash
composer install
\`\`\`

Replace the placeholder methods in \`includes/CLI/Command.php\`:

- \`collect_items()\` — return the records you want to operate on
- \`process_item()\` — write the actual change for a single record

## Author

${author}

## License

GPL-2.0-or-later — see [GNU GPL v2](https://www.gnu.org/licenses/gpl-2.0.html).

---

*Scaffolded with [package-wp-cli-plugin](https://github.com/vishalkakadiya/package-wp-cli-plugin) v${version}.*
`;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  mainPlugin,
  pluginClass,
  cliCommand,
  composerJson,
  gitIgnore,
  readme,
};
