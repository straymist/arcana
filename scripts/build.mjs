import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, basename } from 'node:path';
async function check(dir){for(const f of await readdir(dir,{withFileTypes:true})){const p=join(dir,f.name);if(f.isDirectory())await check(p);else if(p.endsWith('.js'))execFileSync(process.execPath,['--check',p]);const bytes=f.isFile()?await readFile(p):null;if(bytes?.[0]===239&&bytes[1]===187&&bytes[2]===191)throw Error(`Unexpected BOM: ${p}`);}}
await check('src');
await mkdir('dist',{recursive:true});
// Small, intentionally scoped bundler for this project's named-import ES modules.
// Source stays modular; the delivery is self-contained and works via file://.
const files=(await readdir('src')).filter(f=>f.endsWith('.js'));
const factories=[];
for(const file of files){
  let code=await readFile(join('src',file),'utf8');
  const names=[...code.matchAll(/export\s+(?:async\s+)?(?:const|let|function|class)\s+(\w+)/g)].map(m=>m[1]);
  code=code.replace(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];?/g,(_,bindings,path)=>`const {${bindings}}=require(${JSON.stringify(basename(path))});`);
  code=code.replace(/\bexport\s+(?=(?:async\s+)?(?:const|let|function|class)\b)/g,'');
  if(/^\s*(import|export)\s/m.test(code))throw Error(`Unsupported module syntax in ${file}`);
  factories.push(`${JSON.stringify(file)}:(exports,require)=>{\n${code}\nObject.assign(exports,{${names.join(',')}});\n}`);
}
const bundle=`(()=>{'use strict';const factories={${factories.join(',\n')}};const cache={};function require(name){if(!cache[name]){const exports={};cache[name]=exports;factories[name](exports,require);}return cache[name];}require('app.js');})();`;
const css=await readFile('src/styles.css','utf8')+'\n'+await readFile('src/spread-layout.css','utf8')+'\n'+await readFile('src/mobile-layout.css','utf8');
const shell=await readFile('src/shell.html','utf8');
const html=shell.replace('<!-- APP_STYLE -->',`<style>${css}</style>`).replace('<!-- APP_SCRIPT -->',`<script>${bundle.replace(/<\/script/gi,'<\\/script')}</script>`);
await writeFile('dist/index.html',html,'utf8');
await writeFile('dist/.nojekyll','','utf8');
await writeFile('index.html',html,'utf8');
console.log('Built index.html + dist/index.html · standalone file:// delivery · zero dependencies');
