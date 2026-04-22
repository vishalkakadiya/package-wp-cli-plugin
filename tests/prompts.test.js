'use strict';

const {
  toSlug,
  toTitleCase,
  toNamespace,
  toConstant,
  toComposerVendor,
} = require('../src/prompts');

describe('toSlug', () => {
  test('lowercases and trims whitespace', () => {
    expect(toSlug('  Hello World  ')).toBe('hello-world');
  });

  test('replaces spaces with hyphens', () => {
    expect(toSlug('My Awesome Plugin')).toBe('my-awesome-plugin');
  });

  test('collapses consecutive special chars into a single hyphen', () => {
    expect(toSlug('my   plugin!!')).toBe('my-plugin');
  });

  test('strips leading and trailing hyphens', () => {
    expect(toSlug('--my-plugin--')).toBe('my-plugin');
  });

  test('leaves already-valid slugs unchanged', () => {
    expect(toSlug('my-plugin')).toBe('my-plugin');
  });

  test('handles numbers in the slug', () => {
    expect(toSlug('plugin-v2')).toBe('plugin-v2');
  });
});

describe('toTitleCase', () => {
  test('capitalises every hyphen-separated word', () => {
    expect(toTitleCase('my-plugin')).toBe('My Plugin');
  });

  test('handles a single word', () => {
    expect(toTitleCase('plugin')).toBe('Plugin');
  });

  test('handles multi-word slugs', () => {
    expect(toTitleCase('my-awesome-plugin')).toBe('My Awesome Plugin');
  });
});

describe('toNamespace', () => {
  test('combines vendor and PascalCase slug', () => {
    expect(toNamespace('Acme', 'my-plugin')).toBe('Acme\\MyPlugin');
  });

  test('handles multi-part slug', () => {
    expect(toNamespace('MyCompany', 'my-awesome-plugin')).toBe('MyCompany\\MyAwesomePlugin');
  });

  test('handles single-word slug', () => {
    expect(toNamespace('Vendor', 'plugin')).toBe('Vendor\\Plugin');
  });
});

describe('toConstant', () => {
  test('converts kebab-case to UPPER_SNAKE_CASE', () => {
    expect(toConstant('my-plugin')).toBe('MY_PLUGIN');
  });

  test('handles multi-part slug', () => {
    expect(toConstant('my-awesome-plugin')).toBe('MY_AWESOME_PLUGIN');
  });

  test('handles single word', () => {
    expect(toConstant('plugin')).toBe('PLUGIN');
  });
});

describe('toComposerVendor', () => {
  test('converts PascalCase to kebab-case', () => {
    expect(toComposerVendor('MyCompany')).toBe('my-company');
  });

  test('handles single word (no hyphens added)', () => {
    expect(toComposerVendor('Acme')).toBe('acme');
  });

  test('does not add a leading hyphen', () => {
    const result = toComposerVendor('MyCompany');
    expect(result.startsWith('-')).toBe(false);
  });

  test('handles longer PascalCase names', () => {
    expect(toComposerVendor('MyLongCompanyName')).toBe('my-long-company-name');
  });
});
