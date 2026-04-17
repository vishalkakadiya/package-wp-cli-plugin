# Create WP CLI Plugin

> Scaffold a WordPress plugin with a WP-CLI command, `--dry-run` support, and WordPress best practices — in seconds.

## Usage

```bash
# Interactive (recommended)
git clone git@github.com:vishalkakadiya/create-wp-cli-plugin.git

node /PATH_TO_REPO/create-wp-cli-plugin/bin/create-wp-cli-plugin.js create-wp-cli-plugin

# Pass the slug upfront to skip the first prompt
node /PATH_TO_REPO/create-wp-cli-plugin/bin/create-wp-cli-plugin.js my-awesome-plugin
```

The CLI asks a handful of questions, then writes a ready-to-activate WordPress plugin.

## What gets generated

```
my-awesome-plugin/
├── my-awesome-plugin.php   ← Plugin header, constants, bootstrap
├── composer.json           ← PSR-4 autoloading (run composer install)
├── .gitignore
├── README.md
├── includes/
│   ├── Plugin.php          ← Singleton, textdomain, hooks
│   └── CLI/
│       └── Command.php     ← WP-CLI command with --dry-run
└── languages/
    └── .gitkeep
```

## Generated WP-CLI commands

```bash
wp my-awesome-plugin status

wp my-awesome-plugin run --dry-run            # preview, no DB writes
wp my-awesome-plugin run --dry-run --format=json
wp my-awesome-plugin run                      # execute for real
```

## WordPress best practices applied

| Practice | How |
|---|---|
| Security guard | `defined('ABSPATH') \|\| exit` in every file |
| Late bootstrap | `plugins_loaded` hook with a static closure |
| Autoloading | Composer PSR-4, no manual `require` chains |
| Namespacing | Configurable vendor + plugin namespace |
| Singleton | `Plugin::get_instance()` — no globals |
| Textdomain | Loaded on `init` via `load_plugin_textdomain()` |
| Constants | `PLUGIN_VERSION`, `PLUGIN_FILE`, `PLUGIN_DIR`, `PLUGIN_URL` |
| WP-CLI guard | `defined('WP_CLI') && WP_CLI` before registering |
| Dry-run | `\WP_CLI\Utils\get_flag_value()` pattern |
| Output format | `\WP_CLI\Utils\format_items()` with `--format` option |
| PHP 8.1+ types | Typed properties, return types, nullable syntax |

## Requirements

- Node.js ≥ 16
- Composer (for the generated plugin)
- WP-CLI ≥ 2.8 (for the generated plugin)

## License

MIT
