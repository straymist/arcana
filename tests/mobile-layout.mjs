import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {seed,dealSix,activeSession} from '../src/data.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.env.ARCANA_URL||pathToFileURL(resolve('index.html')).href;
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const results=[],key='arcana.idea-alchemy.v1';
await mkdir('test-results',{recursive:true});
try{
  for(const [width,height] of [[390,844],[375,667],[320,720],[390,664]]){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();
    await page.goto(url);await page.locator('.spread-panel').waitFor();
    const state=seed();dealSix(state);const session=activeSession(state);
    // Longest built-in material sentences and a long crystal word represent normal worst cases.
    const cards=[...state.cards].sort((a,b)=>b.text.length-a.text.length).slice(0,3);
    ['G','O','M'].forEach((slot,i)=>{session.slots[slot]=cards[i].id;session.snapshot[slot]=structuredClone(cards[i]);});
    session.directions={G:'lateral',O:'depth',M:'blank'};session.randomWords={G:'借來的時間',O:null,M:null};session.depthShifts={G:null,O:'down',M:null};
    for(const revealed of [false,true]){
      session.directionsRevealed=revealed;
      await page.evaluate(({state,key})=>localStorage.setItem(key,JSON.stringify(state)),{state,key});await page.reload();
      const layout=await page.evaluate(()=>{
        const rect=q=>{const box=document.querySelector(q).getBoundingClientRect();return {top:box.top,bottom:box.bottom,height:box.height};};
        return {scrollY,scrollWidth:document.documentElement.scrollWidth,draw:rect('.draw-row .primary'),actions:rect('.spread-actions'),nav:rect('nav'),gom:rect('.gom-slots .material-card'),direction:rect('.direction-card')};
      });
      assert.equal(layout.scrollY,0);assert(layout.scrollWidth<=width);assert(layout.draw.bottom<layout.nav.top);assert(layout.actions.bottom<=layout.nav.top-8,`${width}×${height}: actions covered`);assert(layout.draw.height>=44);assert(layout.gom.height<180);assert(layout.direction.height<150);
      for(const text of await page.locator('.gom-slots .card-text').all())assert(await text.evaluate(e=>e.scrollHeight<=e.clientHeight+1));
      if(revealed){for(const control of await page.locator('.crystal-icon,.depth-control').all()){const b=await control.boundingBox();assert(b.width>=44&&b.height>=44);}const sphere=await page.locator('.mini-orb').boundingBox(),word=await page.locator('.crystal-word').boundingBox();assert(word.x>=sphere.x-1&&word.x+word.width<=sphere.x+sphere.width+1);}
      await page.screenshot({path:`test-results/compact-${width}x${height}-${revealed?'revealed':'covered'}.png`});
      results.push({viewport:`${width}x${height}`,revealed,result:'pass',gomHeight:Math.round(layout.gom.height),directionHeight:Math.round(layout.direction.height),actionsBottom:Math.round(layout.actions.bottom),navigationTop:Math.round(layout.nav.top)});
    }
    if(width===390&&height===664){
      // Reserve an extra 34px to approximate a home-indicator inset; this is geometry, not Safari validation.
      await page.addStyleTag({content:'nav.workspace-nav{padding-bottom:41px}.app-shell{padding-bottom:100px}'});
      const safe=await page.evaluate(()=>({actions:document.querySelector('.spread-actions').getBoundingClientRect().bottom,nav:document.querySelector('nav').getBoundingClientRect().top}));assert(safe.actions<=safe.nav-8,JSON.stringify({safe,results}));results.push({viewport:'390x664 + 34px inset simulation',result:'pass'});
    }
    // A user's long custom sentence may expand the card; it must remain readable rather than be clipped.
    session.snapshot.G.text='這是留給以後慢慢思考的問題。'.repeat(12);
    await page.evaluate(({state,key})=>localStorage.setItem(key,JSON.stringify(state)),{state,key});await page.reload();
    assert.equal(await page.locator('.gom-slots [data-slot=G] .card-text').innerText(),session.snapshot.G.text);assert(await page.locator('.gom-slots [data-slot=G]').evaluate(e=>e.scrollHeight<=e.clientHeight+1));
    await context.close();
  }
  await writeFile('test-results/mobile-layout-report.json',JSON.stringify({url,engine:'Chrome / Playwright; not real iPhone Safari',results},null,2));
  console.log(JSON.stringify(results));
}finally{await browser.close();}
