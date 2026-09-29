import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      // Use temporary directory for test database
      DB_PATH: path.join(os.tmpdir(), 'indexer-test.sqlite'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts'
      ]
    }
  }
});
