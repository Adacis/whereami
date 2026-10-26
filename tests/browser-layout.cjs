// Isolated DOM regression tests; requires Playwright and Chromium. No live calendar writes.
const {chromium}=require('playwright');
const fs=require('fs'), assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname, '..') + '/';
const read=p=>fs.readFileSync(root+p,'utf8');
const xhrSource=read('src/js/module/xhr.js');
const optionsSource=xhrSource.slice(xhrSource.indexOf('export const optionDatatable2'), xhrSource.indexOf('/**', xhrSource.indexOf('export const optionDatatable2'))).replace(/export /g, '');
const calendarFixture=JSON.parse(fs.readFileSync(process.env.WHEREAMI_CALENDAR_FIXTURE_INPUT || root+'tests/fixtures/calendar/expanded-events.json','utf8'));
const timezone=process.env.WHEREAMI_TEST_TIMEZONE || 'Europe/Paris';
const source=p=>read(p).replace(/^import .*$/mg,'').replace(/export /g,'');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.WHEREAMI_BROWSER_EXECUTABLE || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:900},timezoneId:timezone});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const html=read('templates/content/index.php').replace(/<\?php[\s\S]*?\?>/g,'Employees');
await page.setContent(`<style>:root{--color-main-background:white;--color-background-hover:#f4f6f8;--color-border:#ddd;--color-primary-element:#087b8b;--color-primary-element-light:#e5f4f5;--color-main-text:#222}body{margin:0}*{box-sizing:border-box}tbody tr{height:50px}</style><div id="app"><div id="app-content">${html}</div></div>`);
await page.addStyleTag({content:read('css/style.css')});
for(const p of ['node_modules/jquery/dist/jquery.js','node_modules/datatables.net/js/jquery.dataTables.js','node_modules/datatables.net-fixedcolumns/js/dataTables.fixedColumns.js'])await page.addScriptTag({content:read(p)});
await page.addScriptTag({content:`const BY_EMPLOYEE='byEmployee',BY_LOCATION='byLocation',HR_SUMMARY='HRSummary',ACCOUNTED_FOR_KEYS='keys',ALLOWED_PLACES='places',FRACTION_FOR_ORANGE=2/3,FRACTION_FOR_RED=.9;const DataTable=$.fn.dataTable;const t=(a,text)=>text;${optionsSource}const groupBy=(a,k)=>a.reduce((o,x)=>((o[x[k]]??=[]).push(x),o),{});const toInteger=Math.trunc;const getAllIcons=()=>({onload:()=>[{person:'AVAC',prefix:'🔑',label:'Bordeaux'}]});const getTags=()=>({onload:()=>['RTT','Télétravail','Congés','Cenon','Bordeaux','DNUM'].map(word=>({word}))});${source('src/js/class/Event.js')}\n${source('src/js/class/ListEvents.js')}\n${source('src/js/module/datatables.js')}`});
await page.evaluate(()=>{
 const list=new ListEvents('Alice',[{dtStart:'2026-10-01',dtEnd:'2026-11-01',place:'rtt',place2:''}]);
 if(list.countTypeForUser('RTT',new Date('2026-10-01T00:00'),new Date('2026-10-31T23:59')).innerText!=='22')throw Error('Weekday monthly total');
 const split=new ListEvents('Bob',[{dtStart:'2026-10-02',dtEnd:'2026-10-06',place:'rtt',place2:'cenon'}]);
 if(split.countTypeForUser('RTT',new Date('2026-10-01T00:00'),new Date('2026-10-31T23:59')).innerText!=='1')throw Error('Half days around weekend');
 document.getElementById('dtStart').value='2026-10-02';
 newTablePersonne(JSON.stringify({Alice:[], 'Alice Vaccaro':[], 'Un collaborateur au nom très long pour vérifier la largeur':[]}), '2026-10-02','2026-10-08','byEmployee');
 new DataTable('#byEmployee',optionDatatable2);
});
assert.deepEqual(await page.locator('#byEmployee thead th').allInnerTexts(),['Personne','Clés','Ven\n02/10','Lun\n05/10','Mar\n06/10','Mer\n07/10','Jeu\n08/10']);
// Match the visible, cloned header against the body before and after horizontal scroll.
async function checkColumnAlignment(width) {
 await page.setViewportSize({width,height:900});
 await page.evaluate(()=> { $('#byEmployee').DataTable().columns.adjust().draw(false); });
 const measurements=await page.evaluate(async()=>{
  const scroll=document.querySelector('.dataTables_scrollBody');
  const sample=()=>({head:Array.from(document.querySelectorAll('.dataTables_scrollHead th')).slice(0,2).map(el=>({x:el.getBoundingClientRect().x,width:el.getBoundingClientRect().width})),body:Array.from(document.querySelector('#byEmployee tbody tr').cells).slice(0,2).map(el=>({x:el.getBoundingClientRect().x,width:el.getBoundingClientRect().width}))});
  scroll.scrollLeft=0; await new Promise(requestAnimationFrame);const before=sample();
  scroll.scrollLeft=300; await new Promise(requestAnimationFrame);return {before,after:sample()};
 });
 for (const state of Object.values(measurements)) for(let i=0;i<2;i++) {
  assert.ok(Math.abs(state.head[i].x-state.body[i].x)<=1,`aligned header/body column ${i} at ${width}px: ${JSON.stringify(measurements)}`);
  assert.ok(Math.abs(state.head[i].width-state.body[i].width)<=1,`matching widths column ${i} at ${width}px: ${JSON.stringify(measurements)}`);
 }
}
await checkColumnAlignment(1280);
if(process.env.WHEREAMI_SCREENSHOT_DIR) { fs.mkdirSync(process.env.WHEREAMI_SCREENSHOT_DIR,{recursive:true}); await page.screenshot({path:process.env.WHEREAMI_SCREENSHOT_DIR+'/employees.png'}); }
await checkColumnAlignment(600);
await page.setViewportSize({width:600,height:900});
const pos=await page.evaluate(()=>{
 const scroll=document.querySelector('.dataTables_scrollBody');const cells=document.querySelectorAll('#byEmployee tbody td'); const a=[cells[0].getBoundingClientRect().x,cells[1].getBoundingClientRect().x];scroll.scrollLeft=300;return new Promise(resolve=>requestAnimationFrame(()=>resolve({before:a,after:[cells[0].getBoundingClientRect().x,cells[1].getBoundingClientRect().x],overflow:document.documentElement.scrollWidth>innerWidth, row:cells[0].getBoundingClientRect().height})))
});
assert.ok(pos.before.every((x,i)=>Math.abs(x-pos.after[i])<=1),'Person and keys stay fixed');assert.equal(pos.overflow,false);assert.ok(pos.row<=30);
// Both half-days stay visible, including equal counts, empty locations and totals.
await page.evaluate(()=>{
 const events=[{dtStart:'2026-10-26T00:01',dtEnd:'2026-10-26T23:59',nextcloud_users:'Alice Vaccaro',place:'déplacement',place2:'cenon',summary:'Déplacement, Cenon, D26010'}, {dtStart:'2026-10-26T00:01',dtEnd:'2026-10-26T23:59',nextcloud_users:'Bob Martin',place:'cenon',place2:'',summary:'Cenon'}];
 document.getElementById('dtStart').value='2026-10-26';
 newTablePersonne(JSON.stringify({cenon:events,déplacement:[events[0]],bordeaux:[]}), '2026-10-26','2026-10-26','byLocation');
 new DataTable('#byLocation',{...optionDatatable1,order:[]});
});
if(process.env.WHEREAMI_SCREENSHOT_DIR) await page.screenshot({path:process.env.WHEREAMI_SCREENSHOT_DIR+'/locations.png'});
assert.deepEqual(await page.locator('.dataTables_scrollHead .wai-half-headings span').allTextContents(),['Matin','Après-midi']);
assert.deepEqual(await page.locator('#byLocation tbody tr').first().locator('.cell-main > div').allInnerTexts(),['1','2']);
assert.deepEqual(await page.locator('#byLocation tbody tr').nth(1).locator('.cell-main > div').allInnerTexts(),['1','0']);
assert.deepEqual(await page.locator('#byLocation tbody tr').nth(2).locator('.cell-main > div').allInnerTexts(),['0','0']);
assert.deepEqual(await page.locator('.dataTables_scrollFoot tfoot tr').first().locator('.cell-main > div').allInnerTexts(),['2','2']);
assert.match(await page.locator('#byLocation tbody tr').first().locator('.cell-main > div').nth(1).getAttribute('title'),/Après-midi.*[\s\S]*Alice Vaccaro/);
const singleDay=await page.evaluate(()=>Array.from(new ListEvents('cenon',[{dtStart:'2026-10-26T00:01',dtEnd:'2026-10-26T23:59',nextcloud_users:'Bob Martin',place:'cenon',place2:'',summary:'Cenon'}]).eventsAtDayCount(new Date('2026-10-26T12:00'),[],true).querySelectorAll('.cell-main > div')).map(cell=>cell.innerText));
assert.deepEqual(singleDay,['1','1']);
await page.evaluate(()=>newTableHR({},JSON.stringify({Alice:[{dtStart:'2026-10-01',dtEnd:'2026-11-01',place:'rtt',place2:''}]})));
assert.equal(await page.locator('.wai-columns input').count(),4);
assert.equal(await page.locator('.dataTables_scrollHead thead th:visible').count(),4);
await page.locator('.wai-columns summary').click();await page.locator('.wai-columns input').first().check();
assert.equal(await page.locator('.dataTables_scrollHead thead th:visible').count(),5);
await page.evaluate(()=>newTableContracts(JSON.stringify({userByContract:{Q1:{Alice:2.5,Bob:1},Q2:{Carol:4}},contracts:{Q1:{Alice:[{date_cra:'2026-10-01'}],Bob:[]},Q2:{Carol:[]}}})));
assert.equal(await page.locator('#contracts').count(),0);await page.selectOption('#contractSelect','Q1');assert.equal(await page.locator('#contracts tbody tr').count(),2);assert.equal(await page.locator('#contracts tfoot').innerText(),'Total\t3,5\t');
assert.ok(!(await page.locator('#contracts').innerText()).includes('Carol'));
// Use the actual PHP/Nextcloud-expanded JSON contract, including the Wednesday.
await page.evaluate(fixture=>{
 document.getElementById('dtStart').value='2026-10-19';
 document.getElementById('dtEnd').value='2026-10-23';
 newTablePersonne(JSON.stringify({'person 1':fixture.weekly}), '2026-10-19','2026-10-23','byEmployee');
 new DataTable('#byEmployee',optionDatatable2);
},calendarFixture);
assert.deepEqual(await page.locator('#byEmployee tbody tr td:nth-child(n+3)').allInnerTexts(), Array(5).fill('congés'));
assert.deepEqual(await page.locator('.dataTables_scrollHead th:nth-child(n+3)').allInnerTexts(), ['Lun\n19/10','Mar\n20/10','Mer\n21/10','Jeu\n22/10','Ven\n23/10']);
await page.evaluate(fixture=>{
 const total=new ListEvents('person 1',fixture.weekly).countTypeForUser('congés',new Date('2026-10-01T00:00:00'),new Date('2026-10-31T23:59:59'));
 if(total.innerText!=='5')throw Error('Five recurring leave days must appear in the monthly summary');
 const dst=new ListEvents('person 1',fixture.dst).countTypeForUser('congés',new Date('2026-10-01T00:00:00'),new Date('2026-10-31T23:59:59'));
 if(dst.innerText!=='3')throw Error('DST recurrence has three workdays, with no shifted dates');
 const spanning=new ListEvents('person 1',fixture.spanning).countTypeForUser('congés',new Date('2026-10-01T00:00:00'),new Date('2026-10-31T23:59:59'));
 if(spanning.innerText!=='10')throw Error('Repeated full-week absences must count ten workdays');
 if(!new Events(fixture.spanning[1]).inInterval(new Date('2026-10-28T12:00:00')))throw Error('Wednesday inside a repeated multi-day event must be displayed');
 const timed=new Events(fixture.timed);
 if(!timed.inInterval(new Date('2026-10-21T12:00:00')))throw Error('An occurrence ending at noon cannot disappear from the day');
 if(timed.inInterval(new Date('2026-10-22T12:00:00')))throw Error('Exclusive end cannot add an extra day');
 newTablePersonne(JSON.stringify({'congés':fixture.weekly}), '2026-10-19','2026-10-23','byLocation');
 new DataTable('#byLocation',optionDatatable1);
},calendarFixture);
assert.deepEqual(await page.locator('#byLocation tbody .cell-main > div').allInnerTexts(), Array(10).fill('1'));
const navigationPage=await browser.newPage({timezoneId:timezone});
await navigationPage.setContent(`<style>${read('css/style.css')}</style><div id="app">${read('templates/content/modal.php')}<button class="helper">Aide et fonctionnement</button><div id="finalPath"></div><div id="viewDescription"></div><div id="myapp"></div><div id="rangeControls"><input id="dtStart" type="date"><input id="dtEnd" type="date"><button class="setDates">Appliquer</button></div><div id="monthControls"><select id="summaryMonth"></select><input id="summaryYear" type="number" min="1900" max="9999"></div><button id="addOneMonth">Next</button><button id="removeOneMonth">Previous</button><button class="wai-nav-item" id="showByEmployees"><span>People</span></button><button class="wai-nav-item" id="showByLocations"><span>Places</span></button></div>`);
await navigationPage.addScriptTag({content:`const BY_EMPLOYEE='byEmployee',BY_LOCATION='byLocation',HR_SUMMARY='HRSummary',LAST_SEEN='lastSeen',CONTRACTS='contracts';const getLoader=()=>document.createElement('div');const newTableHR=()=>{};const getData=()=>{},retrieveData=()=>{},lastSeen=()=>{},getContracts=()=>{};${source('src/js/index/main.js')}`});
await navigationPage.evaluate(()=>window.dispatchEvent(new Event('DOMContentLoaded')));
await navigationPage.locator('#showByLocations span').click();
assert.equal(await navigationPage.locator('#finalPath').innerText(),'Locations');
await navigationPage.locator('button.helper').click();
await navigationPage.locator('#helper').waitFor({state:'visible'});
if(process.env.WHEREAMI_SCREENSHOT_DIR) await navigationPage.screenshot({path:process.env.WHEREAMI_SCREENSHOT_DIR+'/help.png'});
assert.equal(await navigationPage.locator('#helper .wai-help-body section').count(),8);
const originalHash=await navigationPage.evaluate(()=>location.hash);
await navigationPage.locator('#helper nav a[href="#help-locations"]').click();
assert.equal(await navigationPage.evaluate(()=>location.hash),originalHash);
await navigationPage.keyboard.press('Escape');
await navigationPage.locator('#helper').waitFor({state:'hidden'});
assert.equal(await navigationPage.evaluate(()=>document.activeElement.className),'helper');
await navigationPage.evaluate(()=>showHRSummary());
await navigationPage.selectOption('#summaryMonth','11');await navigationPage.fill('#summaryYear','2026');
await navigationPage.locator('#addOneMonth').click();
assert.equal(await navigationPage.locator('#summaryYear').inputValue(),'2027');
assert.equal(await navigationPage.locator('#summaryMonth').inputValue(),'0');
assert.equal(await navigationPage.locator('#dtStart').inputValue(),'2027-01-01');
assert.equal(await navigationPage.locator('#dtEnd').inputValue(),'2027-01-31');
await navigationPage.locator('#removeOneMonth').click();assert.equal(await navigationPage.locator('#summaryYear').inputValue(),'2026');
await page.addScriptTag({content:`const showError=()=>{};const getCalendars=()=>({onload:()=>[{id:1,displayname:'Équipe'}]});const isTimeSlotAvailable=()=>({onload:()=>true});${source('src/js/module/utils.js')}\n${source('src/js/class/NewEventForm.js')}`});
await page.evaluate(()=>{
  const form=new NewEventForm();document.body.append(form.form);
  form.dtStartE.value='2026-10-12';form.dtEndE.value='2026-10-10';form.selectPlace1E.value='RTT';
  if(form.checkFormValidity())throw Error('Reversed event dates accepted');
  const ids=Array.from(document.querySelectorAll('[id]')).map(el=>el.id);
  if(new Set(ids).size!==ids.length)throw Error('Duplicate modal IDs');
});
assert.deepEqual(errors,[]);console.log(`PASS [${timezone}]: recurring leave Monday–Friday, Wednesday, DST and exclusive dates; cloned header/body alignment at 1280/600px, fixed columns, permanent morning/afternoon splits and totals, guide navigation and focus, monthly totals, contract selection, year navigation.`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
