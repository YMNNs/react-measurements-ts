import { defineConfig, loadEnv, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'
import dts from 'vite-plugin-dts'
import { libInjectCss } from 'vite-plugin-lib-inject-css'
import { name, peerDependencies } from './package.json'

const libOptions: UserConfig = {
  plugins: [react(), libInjectCss(), dts({ include: ['lib'] })],
  build: {
    outDir: 'dist',
    lib: {
      entry: path.resolve(__dirname, 'lib/main.ts'),
      formats: ['es'],
      name: name,
      fileName: name,
    },
    rollupOptions: {
      external: Object.keys(peerDependencies),
    },
  },
}

const demoOptions: UserConfig = {
  plugins: [react()],
  base: `/${name}/`,
  build: {
    outDir: 'demo',
  },
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  const option = env.VITE_BUILD_MODE === 'lib' ? libOptions : demoOptions

  return {
    ...option,
    optimizeDeps: {
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: 'globalThis',
        },
      },
    },
  }
})
