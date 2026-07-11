import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/core.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  deps: {
    neverBundle: ['react', 'react-dom', '@floating-ui/react-dom'],
  },
  // The stylesheet isn't imported by any JS module, so it must not be
  // treated as a build entry — doing so previously emitted an orphan,
  // unreferenced dist/styles/spotlight.mjs alongside the CSS. Copying the
  // plain file instead ships the exact same dist/styles/spotlight.css path
  // referenced by the "./styles.css" export, with no JS module emitted.
  copy: [{ from: 'src/styles/spotlight.css', to: 'dist/styles' }],
})
