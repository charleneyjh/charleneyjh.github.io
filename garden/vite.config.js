import {defineConfig} from 'vite';
export default defineConfig({base:'/secret-garden/',build:{outDir:'../secret-garden',emptyOutDir:true,rollupOptions:{input:{main:'index.html',compare:'compare.html'}}}});
