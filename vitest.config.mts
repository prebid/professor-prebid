import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: './src/setupTests.ts',
        css: true,
        exclude: ['e2e/**', 'node_modules/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts', 'src/**/*.tsx'],
            exclude: [
                'src/**/*.spec.ts',
                'src/**/*.spec.tsx',
                'src/setupTests.ts',
                'src/pages/*/index.tsx',
                'src/pages/*/index.jsx'
            ],
        }
    },
});
