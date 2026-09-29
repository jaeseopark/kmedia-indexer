import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbPath = path.join(os.tmpdir(), 'indexer-test.sqlite');

// Clean up test database before running tests
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      // Use temporary directory for test database
      DB_PATH: testDbPath,
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
