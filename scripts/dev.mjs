import { watch } from 'node:fs';
import { execFileSync } from 'node:child_process';
const build=()=>{try{execFileSync(process.execPath,['scripts/build.mjs'],{stdio:'inherit'});}catch{console.error('Build failed; last successful index.html retained.');}};
build();console.log('Watching src/. Open index.html directly and refresh after a build. No server.');
let timer;watch('src',{recursive:true},()=>{clearTimeout(timer);timer=setTimeout(build,120);});
