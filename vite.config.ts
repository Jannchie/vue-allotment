import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib'

  return {
    plugins: [
      vue(),
      ...(isLib
        ? [
            dts({
              include: ['src/lib/**/*'],
              outDir: 'dist',
              insertTypesEntry: true,
              rollupTypes: true,
              tsconfigPath: './tsconfig.app.json',
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('src', import.meta.url)),
      },
    },
    ...(isLib && {
      build: {
        lib: {
          entry: fileURLToPath(new URL('src/lib/index.ts', import.meta.url)),
          name: 'VueAllotment',
          fileName: 'vue-allotment',
        },
        rollupOptions: {
          external: ['vue'],
          output: {
            globals: {
              vue: 'Vue',
            },
          },
        },
        cssCodeSplit: false,
      },
    }),
  }
})
