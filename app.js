/* Shell (Fikir): tab nav, Add Item overlay, toast. Each screen registers App.screens.<tab>={render(root){...}}; render runs every time the tab is opened. */
const App={screens:{},
 go(t){document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id==='panel-'+t));
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));
  App.screens[t].render(document.getElementById('panel-'+t))},
 openAdd(){const a=document.getElementById('add');App.screens.add.render(a);a.hidden=false},
 closeAdd(){document.getElementById('add').hidden=true},
 toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(App.tt);App.tt=setTimeout(()=>t.classList.remove('show'),2200)},
 init(){document.querySelectorAll('#nav button').forEach(b=>b.onclick=()=>App.go(b.dataset.tab));App.go('inventory')}};
addEventListener('DOMContentLoaded',App.init);
