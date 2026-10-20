import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../../../public/theme-init.js', import.meta.url), 'utf8');

function setup({ savedTheme = 'light', supportsTransition = true, reducedMotion = false } = {}) {
  let mode;
  let stored = JSON.stringify({ density: 'standard', defaultPage: 'requests', theme: savedTheme });
  const transitions = [];
  const system = { matches: false, addEventListener(_name, listener) { this.change = listener; } };
  const context = {
    localStorage: { getItem: () => stored, setItem: (_key, next) => { stored = next; } },
    window: { matchMedia: query => query.includes('reduced-motion') ? { matches: reducedMotion } : system },
    document: {
      documentElement: {
        getAttribute: () => mode,
        setAttribute: (_name, next) => { mode = next; },
        style: {}
      }
    }
  };
  if (supportsTransition) context.document.startViewTransition = callback => {
    transitions.push(callback);
    return { ready: Promise.resolve(), updateCallbackDone: Promise.resolve(), finished: Promise.resolve() };
  };
  vm.runInNewContext(source, context);
  return { context, transitions, system, get mode() { return mode; }, get stored() { return JSON.parse(stored); } };
}

test('initial theme restoration is immediate; runtime changes animate only when colors differ', () => {
  const theme = setup({ savedTheme: 'dark' });
  assert.equal(theme.mode, 'dark');
  assert.equal(theme.transitions.length, 0);
  theme.context.previewTheme.apply('dark');
  assert.equal(theme.transitions.length, 0);
  theme.context.previewTheme.apply('light');
  assert.equal(theme.transitions.length, 1);
  theme.transitions[0]();
  assert.equal(theme.mode, 'light');
});

test('unsupported transitions and reduced motion apply the final theme directly', () => {
  const unsupported = setup({ supportsTransition: false });
  unsupported.context.previewTheme.apply('dark');
  assert.equal(unsupported.mode, 'dark');
  const reduced = setup({ reducedMotion: true });
  reduced.context.previewTheme.apply('dark');
  assert.equal(reduced.mode, 'dark');
  assert.equal(reduced.transitions.length, 0);
});

test('rapid changes and system updates cannot apply stale transition callbacks', () => {
  const theme = setup({ savedTheme: 'system' });
  theme.context.previewTheme.save({ density: 'compact', defaultPage: 'workbenchHome', theme: 'dark' });
  theme.context.previewTheme.save({ density: 'compact', defaultPage: 'workbenchHome', theme: 'light' });
  theme.transitions[0]();
  assert.equal(theme.mode, 'light');
  assert.equal(theme.stored.theme, 'light');
  theme.context.previewTheme.save({ density: 'compact', defaultPage: 'workbenchHome', theme: 'system' });
  theme.system.matches = true;
  theme.system.change();
  assert.equal(theme.transitions.length, 2);
  theme.context.previewTheme.apply('dark');
  assert.equal(theme.transitions.length, 3);
  theme.transitions[1]();
  assert.equal(theme.mode, 'light');
  theme.transitions[2]();
  assert.equal(theme.mode, 'dark');
});

test('failed view transition falls back without an unhandled rejection', async () => {
  const theme = setup();
  theme.context.document.startViewTransition = () => ({
    ready: Promise.reject(new Error('skipped')),
    updateCallbackDone: Promise.reject(new Error('failed')),
    finished: Promise.reject(new Error('failed'))
  });
  theme.context.previewTheme.apply('dark');
  await Promise.resolve();
  assert.equal(theme.mode, 'dark');
  theme.context.document.startViewTransition = () => { throw new Error('unavailable'); };
  theme.context.previewTheme.apply('light');
  assert.equal(theme.mode, 'light');
});
