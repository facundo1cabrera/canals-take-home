import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import baseConfig from '@acme/eslint-config/base.js';
import nextConfig from '@acme/eslint-config/nextjs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [...baseConfig, ...compat.config(nextConfig)];
