import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.integration.test.ts'],
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
    },
    resolve: {
        alias: {
            '@repo/db': resolve(__dirname, '../../packages/db/src/index.ts'),
        },
    },
});
