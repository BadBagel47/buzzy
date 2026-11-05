import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({build:{outDir:process.env.VITE_BUZZY_TARGET==='pilot'?'dist-pilot':'dist',rollupOptions:{input:{index:resolve('index.html'),host:resolve('host.html'),player:resolve('player.html')}}}});
