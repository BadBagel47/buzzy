import {defineConfig} from 'vite';
import {resolve} from 'node:path';
const cleanPages=server=>{server.middlewares.use((req,res,next)=>{req.url=req.url.replace(/^\/(host|player)(?=\?|$)/,'/$1.html');next();});};
export default defineConfig({plugins:[{name:'clean-pages-local',configureServer:cleanPages,configurePreviewServer:cleanPages}],build:{outDir:process.env.VITE_BUZZY_TARGET==='pilot'?'dist-pilot':'dist',rollupOptions:{input:{index:resolve('index.html'),host:resolve('host.html'),player:resolve('player.html')}}}});
