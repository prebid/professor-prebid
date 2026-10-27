import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: './src/setupTests.ts',
        css: true,
        testTimeout: 30000,
        fileParallelism: false,
        maxWorkers: 1,
        pool: 'forks',
        poolOptions: {
            forks: {
                maxForks: 1,
                minForks: 1,
            },
        },
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
