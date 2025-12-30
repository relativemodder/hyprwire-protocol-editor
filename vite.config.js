import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import pkg from './package.json';

export default defineConfig(
    { 
        plugins: [
            tailwindcss(), 
            sveltekit()
        ],
        define: {
            __VERSION__: JSON.stringify(pkg.version),
        }
    }
);
