// Isolated DOM regression tests; requires Playwright and Chromium. No live calendar writes.
const {chromium}=require('playwright');
const fs=require('fs'), assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname, '..') + '/';
const read=p=>fs.readFileSync(root+p,'utf8');
const source=p=>read(p).replace(/^import .*$/mg,'').replace(/export /g,'');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.WHEREAMI_BROWSER_EXECUTABLE || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:900}});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const html=read('templates/content/index.php').replace(/<\?php[\s\S]*?\?>/g,'Employees');
await page.setContent(`<style>:root{--color-main-background:white;--color-background-hover:#f4f6f8;--color-border:#ddd;--color-primary-element:#087b8b;--color-primary-element-light:#e5f4f5;--color-main-text:#222}body{margin:0}*{box-sizing:border-box}tbody tr{height:50px}</style><div id="app"><div id="app-content">${html}</div></div>`);
await page.addStyleTag({content:read('css/style.css')});
for(const p of ['node_modules/jquery/dist/jquery.js','node_modules/datatables.net/js/jquery.dataTables.js','node_modules/datatables.net-fixedcolumns/js/dataTables.fixedColumns.js'])await page.addScriptTag({content:read(p)});
await page.addScriptTag({content:`const BY_EMPLOYEE='byEmployee',BY_LOCATION='byLocation',HR_SUMMARY='HRSummary',ACCOUNTED_FOR_KEYS='keys',ALLOWED_PLACES='places',FRACTION_FOR_ORANGE=2/3,FRACTION_FOR_RED=.9;const DataTable=$.fn.dataTable;const optionDatatable1={scrollX:true,paging:false,fixedColumns:{left:1},stateSave:false};const groupBy=(a,k)=>a.reduce((o,x)=>((o[x[k]]??=[]).push(x),o),{});const toInteger=Math.trunc;const getAllIcons=()=>({onload:()=>[]});const getTags=()=>({onload:()=>['RTT','Télétravail','Congés','Cenon','Bordeaux','DNUM'].map(word=>({word}))});${source('src/js/class/Event.js')}\n${source('src/js/class/ListEvents.js')}\n${source('src/js/module/datatables.js')}`});
await page.evaluate(()=>{
 const list=new ListEvents('Alice',[{dtStart:'2026-10-01',dtEnd:'2026-11-01',place:'rtt',place2:''}]);
 if(list.countTypeForUser('RTT',new Date('2026-10-01T00:00'),new Date('2026-10-31T23:59')).innerText!=='22')throw Error('Weekday monthly total');
 const split=new ListEvents('Bob',[{dtStart:'2026-10-02',dtEnd:'2026-10-06',place:'rtt',place2:'cenon'}]);
 if(split.countTypeForUser('RTT',new Date('2026-10-01T00:00'),new Date('2026-10-31T23:59')).innerText!=='1')throw Error('Half days around weekend');
 document.getElementById('dtStart').value='2026-10-02';
 newTablePersonne(JSON.stringify({Alice:[]}), '2026-10-02','2026-10-08','byEmployee');
 new DataTable('#byEmployee',{scrollX:true,paging:false,autoWidth:false,fixedColumns:{left:2}});
});
assert.deepEqual(await page.locator('#byEmployee thead th').allInnerTexts(),['Personne','Clés','Ven\n02/10','Lun\n05/10','Mar\n06/10','Mer\n07/10','Jeu\n08/10']);
await page.setViewportSize({width:600,height:900});
const pos=await page.evaluate(()=>{
 const scroll=document.querySelector('.dataTables_scrollBody');const cells=document.querySelectorAll('#byEmployee tbody td'); const a=[cells[0].getBoundingClientRect().x,cells[1].getBoundingClientRect().x];scroll.scrollLeft=300;return new Promise(resolve=>requestAnimationFrame(()=>resolve({before:a,after:[cells[0].getBoundingClientRect().x,cells[1].getBoundingClientRect().x],overflow:document.documentElement.scrollWidth>innerWidth, row:cells[0].getBoundingClientRect().height})))
});
assert.ok(pos.before.every((x,i)=>Math.abs(x-pos.after[i])<=1),'Person and keys stay fixed');assert.equal(pos.overflow,false);assert.ok(pos.row<=30);
await page.evaluate(()=>newTableHR({},JSON.stringify({Alice:[{dtStart:'2026-10-01',dtEnd:'2026-11-01',place:'rtt',place2:''}]})));
assert.equal(await page.locator('.wai-columns input').count(),4);
assert.equal(await page.locator('.dataTables_scrollHead thead th:visible').count(),4);
await page.locator('.wai-columns summary').click();await page.locator('.wai-columns input').first().check();
assert.equal(await page.locator('.dataTables_scrollHead thead th:visible').count(),5);
await page.evaluate(()=>newTableContracts(JSON.stringify({userByContract:{Q1:{Alice:2.5,Bob:1},Q2:{Carol:4}},contracts:{Q1:{Alice:[{date_cra:'2026-10-01'}],Bob:[]},Q2:{Carol:[]}}})));
assert.equal(await page.locator('#contracts').count(),0);await page.selectOption('#contractSelect','Q1');assert.equal(await page.locator('#contracts tbody tr').count(),2);assert.equal(await page.locator('#contracts tfoot').innerText(),'Total\t3,5\t');
assert.ok(!(await page.locator('#contracts').innerText()).includes('Carol'));
const navigationPage=await browser.newPage();
await navigationPage.setContent(`<div id="finalPath"></div><div id="viewDescription"></div><div id="myapp"></div><div id="rangeControls"><input id="dtStart" type="date"><input id="dtEnd" type="date"><button class="setDates">Appliquer</button></div><div id="monthControls"><select id="summaryMonth"></select><input id="summaryYear" type="number" min="1900" max="9999"></div><button id="addOneMonth">Next</button><button id="removeOneMonth">Previous</button><button class="wai-nav-item" id="showByEmployees"><span>People</span></button><button class="wai-nav-item" id="showByLocations"><span>Places</span></button>`);
await navigationPage.addScriptTag({content:`const BY_EMPLOYEE='byEmployee',BY_LOCATION='byLocation',HR_SUMMARY='HRSummary',LAST_SEEN='lastSeen',CONTRACTS='contracts';const getLoader=()=>document.createElement('div');const newTableHR=()=>{};const getData=()=>{},retrieveData=()=>{},lastSeen=()=>{},getContracts=()=>{};${source('src/js/index/main.js')}`});
await navigationPage.evaluate(()=>window.dispatchEvent(new Event('DOMContentLoaded')));
await navigationPage.locator('#showByLocations span').click();
assert.equal(await navigationPage.locator('#finalPath').innerText(),'Locations');
await navigationPage.evaluate(()=>showHRSummary());
await navigationPage.selectOption('#summaryMonth','11');await navigationPage.fill('#summaryYear','2026');
await navigationPage.locator('#addOneMonth').click();
assert.equal(await navigationPage.locator('#summaryYear').inputValue(),'2027');
assert.equal(await navigationPage.locator('#summaryMonth').inputValue(),'0');
assert.equal(await navigationPage.locator('#dtStart').inputValue(),'2027-01-01');
assert.equal(await navigationPage.locator('#dtEnd').inputValue(),'2027-01-31');
await navigationPage.locator('#removeOneMonth').click();assert.equal(await navigationPage.locator('#summaryYear').inputValue(),'2026');
await page.addScriptTag({content:`const t=(app,text)=>text;const showError=()=>{};const getCalendars=()=>({onload:()=>[{id:1,displayname:'Équipe'}]});const isTimeSlotAvailable=()=>({onload:()=>true});${source('src/js/module/utils.js')}\n${source('src/js/class/NewEventForm.js')}`});
await page.evaluate(()=>{
  const form=new NewEventForm();document.body.append(form.form);
  form.dtStartE.value='2026-10-12';form.dtEndE.value='2026-10-10';form.selectPlace1E.value='RTT';
  if(form.checkFormValidity())throw Error('Reversed event dates accepted');
  const ids=Array.from(document.querySelectorAll('[id]')).map(el=>el.id);
  if(new Set(ids).size!==ids.length)throw Error('Duplicate modal IDs');
});
assert.deepEqual(errors,[]);console.log('PASS: monthly weekdays/half-days, date alignment, fixed columns at 600px, compact rows, monthly optional columns, selected contract totals, navigation icon clicks, December/January navigation.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
