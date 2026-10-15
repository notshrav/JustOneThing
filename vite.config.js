import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // The production site is hosted at the repository path on GitHub Pages.
  // Keep the root path for local development.
  base: process.env.GITHUB_ACTIONS ? '/JustOneThing/' : '/',
});
