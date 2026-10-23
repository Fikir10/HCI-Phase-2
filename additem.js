/* Add Item screen (Fikir). */
(()=>{
const $=s=>document.querySelector(s);
const num=n=>+n.toFixed(2);
const STEP={Ct:1,Slices:1,Loaf:1,Gal:.5,Lb:.5,Oz:4};
const DEF={Ct:[2,1],Slices:[8,2],Loaf:[2,1],Gal:[1,.5],Lb:[2,.5],Oz:[16,8]}; // [amount, low-at]
const UNITS=[['Ct','Count'],['Oz','Ounces'],['Lb','Pounds'],['Gal','Gallons'],['Loaf','Loaves'],['Slices','Slices']];
const st=(id,v,l)=>`<span class="add-st"><button data-t="${id}" data-d="-1" aria-label="Decrease ${l}">−</button><input id="${id}" type="number" inputmode="decimal" min="0" value="${v}" aria-label="${l}"><button data-t="${id}" data-d="1" aria-label="Increase ${l}">+</button></span>`;
const err=m=>{$('#add-err').textContent=m};

App.screens.add={render(root){
    let cat='fridge';
    root.innerHTML=`<header class="add-hd"><button id="add-back" aria-label="Back">‹</button><h1 class="ttl">Add Item</h1></header>
<div class="add-r"><label for="add-name">Name</label><input id="add-name" maxlength="24" placeholder="e.g., Cheddar Cheese" autocomplete="off"></div>
<div class="add-r"><label>Where</label><span class="add-seg"><button data-c="fridge" class="on">Fridge</button><button data-c="pantry">Pantry</button><button data-c="freezer">Freezer</button></span></div>
<div class="add-r"><label for="add-unit">Unit</label><select id="add-unit">${UNITS.map(u=>`<option value="${u[0]}">${u[1]}</option>`).join('')}</select></div>
<div class="add-r"><label>Amount</label>${st('add-qty',2,'amount')}</div>
<div class="add-r"><label for="add-exp">Expires</label><input id="add-exp" type="date"></div>
<div class="add-r"><label>Low at</label>${st('add-low',1,'low level')}</div>
<p id="add-err" role="alert"></p>
<button id="add-save">Save to Inventory</button>`;
 $('#add-back').onclick=App.closeAdd;
 root.querySelectorAll('.add-seg button').forEach(b=>b.onclick=()=>{cat=b.dataset.c;root.querySelectorAll('.add-seg button').forEach(x=>x.classList.toggle('on',x===b))});
 $('#add-unit').onchange=e=>{const d=DEF[e.target.value];$('#add-qty').value=d[0];$('#add-low').value=d[1]};
 root.querySelectorAll('.add-st button').forEach(b=>b.onclick=()=>{const el=$('#'+b.dataset.t);
  el.value=Math.min(999,Math.max(0,num((+el.value||0)+ +b.dataset.d*STEP[$('#add-unit').value])))});
 $('#add-save').onclick=()=>{const n=$('#add-name').value.trim(),u=$('#add-unit').value,q=num(+$('#add-qty').value||0);
  if(!n){err('Please enter an item name.');$('#add-name').focus();return}
  if(q<=0){err('Amount must be more than 0.');return}
  const ex=Data.inv().find(i=>i.name.toLowerCase()===n.toLowerCase()&&i.unit===u);
  let id;
  if(ex){Data.adjust(ex.id,q);id=ex.id}
  else id=Data.addItem({name:n,cat,qty:q,unit:u,lowAt:num(+$('#add-low').value||0),exp:$('#add-exp').value||null});
  App.closeAdd();App.screens.inventory.reveal(id);App.go('inventory');
  App.toast(ex?`Added ${q} ${u} to ${ex.name}`:`Added ${n}`)};
 setTimeout(()=>$('#add-name').focus(),50)}};
})();

