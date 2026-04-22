'use strict';

jest.mock('fs-extra');

const fse = require('fs-extra');
const path = require('path');
const { generate } = require('../src/generator');

// Suppress chalk console output during tests.
beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => {}));
afterAll(() => console.log.mockRestore());

const mockOpts = {
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

beforeEach(() => {
  fse.pathExists.mockResolvedValue(false);
  fse.outputFile.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('generate', () => {
  test('throws when the target directory already exists', async () => {
    fse.pathExists.mockResolvedValue(true);
    await expect(generate(mockOpts)).rejects.toThrow('"my-plugin" already exists');
  });

  test('checks for directory existence before writing', async () => {
    await generate(mockOpts);
    expect(fse.pathExists).toHaveBeenCalledTimes(1);
    expect(fse.pathExists).toHaveBeenCalledWith(
      expect.stringContaining('my-plugin')
    );
  });

  test('writes exactly 7 files', async () => {
    await generate(mockOpts);
    expect(fse.outputFile).toHaveBeenCalledTimes(7);
  });

  test('writes the main plugin PHP file', async () => {
    await generate(mockOpts);
    const writtenPaths = fse.outputFile.mock.calls.map(([p]) => p);
    expect(writtenPaths.some((p) => p.endsWith('my-plugin.php'))).toBe(true);
  });

  test('writes composer.json', async () => {
    await generate(mockOpts);
    const writtenPaths = fse.outputFile.mock.calls.map(([p]) => p);
    expect(writtenPaths.some((p) => p.endsWith('composer.json'))).toBe(true);
  });

  test('writes .gitignore', async () => {
    await generate(mockOpts);
    const writtenPaths = fse.outputFile.mock.calls.map(([p]) => p);
    expect(writtenPaths.some((p) => p.endsWith('.gitignore'))).toBe(true);
  });

  test('writes README.md', async () => {
    await generate(mockOpts);
    const writtenPaths = fse.outputFile.mock.calls.map(([p]) => p);
    expect(writtenPaths.some((p) => p.endsWith('README.md'))).toBe(true);
  });

  test('writes includes/Plugin.php', async () => {
    await generate(mockOpts);
    const writtenPaths = fse.outputFile.mock.calls.map(([p]) => p);
    expect(
      writtenPaths.some((p) => p.includes(`includes${path.sep}Plugin.php`))
    ).toBe(true);
  });

  test('writes includes/CLI/Command.php', async () => {
    await generate(mockOpts);
    const writtenPaths = fse.outputFile.mock.calls.map(([p]) => p);
    expect(
      writtenPaths.some((p) => p.includes(`CLI${path.sep}Command.php`))
    ).toBe(true);
  });

  test('writes languages/.gitkeep', async () => {
    await generate(mockOpts);
    const writtenPaths = fse.outputFile.mock.calls.map(([p]) => p);
    expect(
      writtenPaths.some((p) => p.includes(`languages${path.sep}.gitkeep`))
    ).toBe(true);
  });

  test('all files are written inside the slug directory', async () => {
    await generate(mockOpts);
    const writtenPaths = fse.outputFile.mock.calls.map(([p]) => p);
    const slugDir = path.resolve(process.cwd(), 'my-plugin');
    expect(writtenPaths.every((p) => p.startsWith(slugDir))).toBe(true);
  });

  test('main plugin file content includes the plugin name', async () => {
    await generate(mockOpts);
    const mainPluginCall = fse.outputFile.mock.calls.find(([p]) =>
      p.endsWith('my-plugin.php')
    );
    expect(mainPluginCall[1]).toContain('Plugin Name: My Plugin');
  });

  test('composer.json content is valid JSON with correct package name', async () => {
    await generate(mockOpts);
    const composerCall = fse.outputFile.mock.calls.find(([p]) =>
      p.endsWith('composer.json')
    );
    const parsed = JSON.parse(composerCall[1]);
    expect(parsed.name).toBe('test-vendor/my-plugin');
  });
});
