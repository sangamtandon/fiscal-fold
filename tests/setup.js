import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();

  let counter = 0;
  vi.stubGlobal('crypto', {
    ...globalThis.crypto,
    randomUUID: () => `test-uuid-${++counter}`,
  });
});
