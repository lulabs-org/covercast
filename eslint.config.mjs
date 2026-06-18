import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),

  // ──────────────────────────────────────────────
  // Domain layer boundary governance
  //
  // domain/ is the pure business logic layer.
  // It must NOT depend on:
  //   - React / React DOM (UI framework)
  //   - Next.js (framework runtime)
  //   - @/app/** (app layer: components, hooks, api, pages)
  //   - @/shared/components/** (UI components)
  //   - DOM globals (window, document, localStorage, ...)
  //
  // Temporary exception:
  //   - @/app/lib/fonts  (will move to @/config/fonts after branch merge)
  // ──────────────────────────────────────────────
  {
    files: ['src/domain/**/*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              message: 'domain/ must not depend on React. Keep domain layer pure (no UI).',
            },
            {
              name: 'react-dom',
              message: 'domain/ must not depend on React DOM. Keep domain layer pure (no UI).',
            },
            {
              name: 'react/jsx-runtime',
              message:
                'domain/ must not depend on React JSX runtime. Keep domain layer pure (no UI).',
            },
            {
              name: 'next',
              message: 'domain/ must not depend on Next.js. Keep domain layer pure.',
            },
          ],
          patterns: [
            {
              group: ['next/*'],
              message: 'domain/ must not depend on Next.js. Keep domain layer pure.',
            },
            {
              group: ['@/app/components/*'],
              message:
                'domain/ must not depend on app components. Move shared code to config/ or shared/.',
            },
            {
              group: ['@/app/hooks/*'],
              message:
                'domain/ must not depend on app hooks. Move shared code to config/ or shared/.',
            },
            {
              group: ['@/app/api/*'],
              message:
                'domain/ must not depend on app API routes. Move shared code to config/ or shared/.',
            },
            {
              group: ['@/app/editor/*'],
              message:
                'domain/ must not depend on app pages. Move shared code to config/ or shared/.',
            },
            {
              group: ['@/app/landing/*'],
              message:
                'domain/ must not depend on app pages. Move shared code to config/ or shared/.',
            },
            {
              group: ['@/app/live/*'],
              message:
                'domain/ must not depend on app pages. Move shared code to config/ or shared/.',
            },
            {
              group: ['@/shared/components/*'],
              message:
                'domain/ must not depend on UI components. Use @/shared/lib for pure utilities only.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        'window',
        'document',
        'localStorage',
        'sessionStorage',
        'indexedDB',
      ],
    },
  },
])

export default eslintConfig
