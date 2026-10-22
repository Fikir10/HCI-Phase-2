/* Inventory home screen placeholder.  */
(()=>{
const S={sort:'att',cat:'all',q:'',flash:null};
const $=s=>document.querySelector(s);
const esc=s=>s.replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';');
const cap=s=>s[0].toUpperCase()+s.slice(1);
const num=n=>+n.toFixed(2);
const MEASURED=['Gal','Oz','Lb'];
const days=i=>i.exp?(new Date(i.exp)-new Date(Data.TODAY))/864e5:999;
const score=i=>{const s=Data.status(i);return s==='out'?0:s==='low'?1:days(i)<=3?2:3};
const CAT={fridge:0,pantry:1,freezer:2};
const SORTS={att:(a,b)=>score(a)-score(b)||days(a)-days(b)||a.name.localeCompare(b.name),
 exp:(a,b)=>days(a)-days(b)||a.name.localeCompare(b.name),
 cat:(a,b)=>CAT[a.cat]-CAT[b.cat]||a.name.localeCompare(b.name),
 az:(a,b)=>a.name.localeCompare(b.name)};
const fmt=d=>{const[,m,x]=d.split('-');return +m+'/'+ +x};
let cur=null;

const row=i=>{const s=Data.status(i),n=esc(i.name),amt=num(i.qty)+' '+i.unit;
 const ctl=MEASURED.includes(i.unit)
   ?`<button class="inv-amt" data-use aria-label="${n}, ${amt}. Log how much you used">${amt}</button>`
   :`<span class="inv-st"><button data-d="-1" aria-label="Use one ${n}">−</button><span class="inv-q">${amt}</span><button data-d="1" aria-label="Add one ${n}">+</button></span>`;
 const slot=s!=='ok'?`<span class="inv-bd ${s}">${s==='out'?'Out':'Low'}</span>`:(S.sort==='exp'&&i.exp?`<span class="muted">${fmt(i.exp)}</span>`:'');
 return `<div class="inv-row${S.flash===i.id?' new':''}" data-id="${i.id}"><span class="inv-nm">${n}</span>${ctl}<span class="inv-slot">${slot}</span></div>`};
    
const sub=()=>{const a=Data.inv();$('#inv-sub').textContent=`${a.length} Items | ${a.filter(i=>Data.status(i)!=='ok').length} Need Attention`};
const closeSheet=()=>{$('#inv-sheet').hidden=true;cur=null};
const openSheet=id=>{const i=Data.get(id);cur=id;$('#inv-sh-n').textContent=`${i.name} · ${num(i.qty)} ${i.unit}`;$('#inv-sheet').hidden=false};
const use=f=>{const i=Data.get(cur),left=f>=1?0:num(i.qty*(1-f));
    Data.adjust(cur,left-i.qty);
    document.querySelector(`.inv-row[data-id="${cur}"]`).outerHTML=row(Data.get(cur));sub();closeSheet()};

const list=()=>{closeSheet();const q=S.q.trim().toLowerCase();
 const a=Data.inv().filter(i=>(S.cat==='all'||i.cat===S.cat)&&i.name.toLowerCase().includes(q)).sort(SORTS[S.sort]);
 let h='',last;
 a.forEach(i=>{if(S.sort==='cat'&&i.cat!==last){h+=`<div class="inv-gh">${cap(i.cat)}</div>`;last=i.cat}h+=row(i)});
 const el=$('#inv-list');el.innerHTML=h||'<p class="muted inv-none">No items match.</p>';
 const f=el.querySelector('.new');if(f){el.scrollTop=f.offsetTop-el.clientHeight/2;S.flash=null}
 sub()};

App.screens.inventory={
    reveal(id){S.q='';S.cat='all';S.flash=id}, //call before App.go('inventory') after adding an item
    render(root){
     if(!root.dataset.built){root.dataset.built=1;
        root.innerHTML=`<header class="inv-hd"><div><h1 class="ttl">Kitchen Inventory</h1><div id="inv-sub" class="muted"></div></div><button id="inv-add" aria-label="Add item">+</button></header>
<input id="inv-q" type="search" placeholder="Search items" autocomplete="off">
<div class="inv-ctl"><select id="inv-sort" aria-label="Sort by"><option value="att">Needs attention</option><option value="exp">Expiring soon</option><option value="cat">By location</option><option value="az">A to Z</option></select>
<select id="inv-cat" aria-label="Filter by location"><option value="all">All</option><option value="fridge">Fridge</option><option value="pantry">Pantry</option><option value="freezer">Freezer</option></select></div>
<div id="inv-list"></div>
<div id="inv-sheet" hidden><div class="inv-sh-t"><b id="inv-sh-n"></b><br><span class="muted">How much did you use?</span></div>
<div class="inv-sh-b"><button data-f="0.25">¼</button><button data-f="0.5">½</button><button data-f="0.75">¾</button><button data-f="1">All</button></div>
<button class="inv-sh-x">Cancel</button></div>`;
   $('#inv-add').onclick=App.openAdd;
   $('#inv-q').oninput=e=>{S.q=e.target.value;list()};
   $('#inv-sort').onchange=e=>{S.sort=e.target.value;list()};
   $('#inv-cat').onchange=e=>{S.cat=e.target.value;list()};
   $('#inv-list').onclick=e=>{const b=e.target.closest('button');if(!b)return;
    const r=b.closest('.inv-row');
    if(b.dataset.use!==undefined){openSheet(r.dataset.id);return}
    r.outerHTML=row(Data.adjust(r.dataset.id,+b.dataset.d));sub()};
   $('#inv-sheet').onclick=e=>{const b=e.target.closest('button');if(!b)return;b.dataset.f?use(+b.dataset.f):closeSheet()}}
  $('#inv-q').value=S.q;$('#inv-sort').value=S.sort;$('#inv-cat').value=S.cat;list()}};
})();
