// RULE: Do NOT put a top-level `import` of `../../src/data/store.js` in any spec
// file. The store self-initializes on import and the module instance is cached;
// `vi.resetModules()` in setup.js only helps if the next import is dynamic.
// Always go through `freshStore()` inside each test.

export async function freshStore() {
  return await import('../../src/data/store.js');
}
