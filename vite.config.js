// Vite config — rewrites the built sw.js with a build-time cache version,
// so the service-worker bytes change on every deploy. Without this, sw.js
// stays byte-identical when only dependencies change, the browser never
// reinstalls it, and the activate-time cleanup of stale caches never runs.
//
// public/sw.js stays the source-of-truth template (with the
// __SW_CACHE_VERSION__ token). Vite copies it to dist/sw.js verbatim;
// writeBundle (which runs after the public dir is copied) replaces the
// token in-place.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function swCacheBuster() {
  const version = `fiscal-fold-${Date.now()}`;
  return {
    name: 'sw-cache-buster',
    apply: 'build',
    writeBundle(options) {
      const outDir = options.dir || resolve(__dirname, 'dist');
      const swOut = resolve(outDir, 'sw.js');
      const source = readFileSync(swOut, 'utf8').replace(
        /__SW_CACHE_VERSION__/g,
        version,
      );
      writeFileSync(swOut, source);
    },
  };
}

export default {
  plugins: [swCacheBuster()],
};
