/* Shared data layer (Alex). Everyone reads/writes through Data. Never touch localStorage directly. Data.reset() restores demo data. */
const Data=(()=>{
const TODAY='2026-10-17'; // fixed demo date so "expiring soon" stays stable
// name, location, qty, unit, lowAt (low when qty <= lowAt), expires
const SEED=[
['Whole Milk','fridge',1,'Gal',1,'2026-10-20'],['Eggs','fridge',0,'Ct',3,null],['Cheddar Cheese','fridge',2,'Lb',1,'2026-11-14'],
['Chicken Breast','fridge',2,'Lb',2,'2026-10-19'],['Butter','fridge',4,'Ct',1,'2026-11-30'],['Greek Yogurt','fridge',3,'Ct',2,'2026-10-24'],
['Orange Juice','fridge',32,'Oz',16,'2026-10-29'],['Strawberries','fridge',1,'Lb',1,'2026-10-18'],['Baby Spinach','fridge',5,'Oz',3,'2026-10-19'],
['Bell Peppers','fridge',3,'Ct',1,'2026-10-25'],['Carrots','fridge',2,'Lb',1,'2026-11-05'],['Deli Turkey','fridge',8,'Oz',4,'2026-10-22'],
['Leftover Pasta','fridge',1,'Ct',0,'2026-10-19'],['Hummus','fridge',2,'Ct',1,'2026-11-02'],
['Pasta Sauce','pantry',2,'Ct',1,null],['Wheat Bread','pantry',14,'Slices',6,'2026-10-26'],['Rice','pantry',5,'Lb',2,null],
['Spaghetti','pantry',3,'Lb',1,null],['Olive Oil','pantry',16,'Oz',8,null],['Peanut Butter','pantry',1,'Ct',1,null],
['Cereal','pantry',2,'Ct',1,null],['Flour','pantry',4,'Lb',2,null],['Sugar','pantry',1,'Lb',1,null],['Canned Beans','pantry',4,'Ct',2,null],
['Tortillas','pantry',8,'Ct',4,'2026-10-28'],['Oatmeal','pantry',18,'Oz',8,null],['Coffee','pantry',12,'Oz',6,null],
['Onions','pantry',3,'Ct',2,'2026-11-03'],['Potatoes','pantry',5,'Lb',2,null],
['Frozen Peas','freezer',2,'Ct',1,null],['Ice Cream','freezer',1,'Ct',1,null],['Frozen Pizza','freezer',2,'Ct',1,null],
['Ground Beef','freezer',2,'Lb',1,'2026-12-01'],['Waffles','freezer',8,'Ct',4,null],['Frozen Berries','freezer',1,'Lb',1,null]];
// name, qty, unit, location, purchased
const SHOP=[['Eggs',12,'Ct','fridge',false],['Whole Milk',1,'Gal','fridge',false],['Peanut Butter',1,'Ct','pantry',false],['Bananas',6,'Ct','pantry',false],['Dish Soap',1,'Ct','pantry',true]];
const load=(k,seed,mk)=>{try{const s=localStorage.getItem(k);if(s)return JSON.parse(s)}catch(e){}return seed.map(mk)};
const inv=load('kk_inv_v1',SEED,(a,n)=>({id:'i'+n,name:a[0],cat:a[1],qty:a[2],unit:a[3],lowAt:a[4],exp:a[5]}));
const shop=load('kk_shop_v1',SHOP,(a,n)=>({id:'s'+n,name:a[0],qty:a[1],unit:a[2],cat:a[3],purchased:a[4]}));
const save=()=>{try{localStorage.setItem('kk_inv_v1',JSON.stringify(inv));localStorage.setItem('kk_shop_v1',JSON.stringify(shop))}catch(e){}};
const get=id=>inv.find(i=>i.id===id);
return{TODAY,inv:()=>inv,shop:()=>shop,get,
 status:i=>i.qty<=0?'out':i.qty<=i.lowAt?'low':'ok',
 addItem:o=>{o.id='i'+Date.now();inv.push(o);save();return o.id},
 adjust:(id,d)=>{const i=get(id);i.qty=Math.max(0,i.qty+d);save();return i},
 addShop:o=>{o.id='s'+Date.now();o.purchased=false;shop.push(o);save();return o.id},
 togglePurchased:id=>{const s=shop.find(x=>x.id===id);s.purchased=!s.purchased;save()},
 removeShop:id=>{shop.splice(shop.findIndex(x=>x.id===id),1);save()},
 reset:()=>{try{localStorage.removeItem('kk_inv_v1');localStorage.removeItem('kk_shop_v1')}catch(e){}location.reload()}};
})();
