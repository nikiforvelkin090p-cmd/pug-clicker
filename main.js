// === ДАННЫЕ ===
const DB = {
  up: [
    {id:'u1',n:'Лапки +1',c:50,v:1}, {id:'u2',n:'Зубки +3',c:200,v:3},
    {id:'u3',n:'Нервы +10',c:1000,v:10}, {id:'u4',n:'Супер +50',c:5000,v:50}
  ],
  food: [
    {id:'f1',n:'Вкусняшка',c:150,m:2,t:180}, {id:'f2',n:'Элита',c:500,m:3,t:300}
  ],
  case: [{id:'c1',n:'Обычный кейс',c:2000}],
  furn: [
    {id:'m1',n:'Подстилка',s:'mat',m:1.2,c:1000},
    {id:'t1',n:'Мяч',s:'toy',m:1.15,c:800}, {id:'t2',n:'Кость',s:'toy',m:1.1,c:600},
    {id:'d1',n:'Картина',s:'dec',m:1.05,c:500}, {id:'d2',n:'Коврик',s:'dec',m:1.05,c:500}
  ]
};

// === СОСТОЯНИЕ ===
let S = {
  k:0, cb:1, pm:1, bs:{m:1,e:0}, inv:[], sl:{}, st:{c:0,e:0}, ls:Date.now()
};

// === УТИЛИТЫ ===
const E = id => document.getElementById(id);
const F = n => Math.floor(n).toLocaleString();

function save() { S.ls=Date.now(); try{localStorage.setItem('pug',JSON.stringify(S))}catch(e){} }
function load() { try{const r=localStorage.getItem('pug'); if(r)S={...S,...JSON.parse(r)}}catch(e){} }

function mult() {
  let m=S.pm;
  if(S.bs.e>Date.now()) m*=S.bs.m;
  Object.values(S.sl).forEach(id=>{
    const it=DB.furn.find(x=>x.id===id); if(it) m*=it.m;
  });
  return m;
}

function clickVal() { return S.cb * mult(); }

// === UI ===
function ui() {
  try {
    if(E('ui-kibble')) E('ui-kibble').textContent = F(S.k);
    if(E('ui-mult')) E('ui-mult').textContent = 'x'+mult().toFixed(2);
    
    const b=E('ui-boost'), bt=E('ui-boost-time');
    if(b&&bt) {
      if(S.bs.e>Date.now()) {
        b.style.display='block';
        const sec=Math.ceil((S.bs.e-Date.now())/1000);
        bt.textContent = Math.floor(sec/60)+':'+(sec%60).toString().padStart(2,'0');
      } else b.style.display='none';
    }
    renderInv(); renderStats();
  } catch(err) { console.warn('UI error:',err); }
}

// === МАГАЗИН ===
let tab='up';
function shop(t) {
  tab=t;
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));
  const c=E('shop-list'); if(!c) return; c.innerHTML='';
  const list=DB[t]||[];
  list.forEach(it=>{
    const d=document.createElement('div'); d.className='item';
    d.innerHTML = `<span>${it.n}<br><small>${it.desc||''}</small></span><button ${S.k<it.c?'disabled':''}>${it.c}🦴</button>`;
    d.querySelector('button').onclick=()=>buy(it,t);
    c.appendChild(d);
  });
}

function buy(it,type) {
  if(S.k<it.c) return; S.k-=it.c;
  if(type==='up') S.cb+=it.v;
  if(type==='food') S.bs={m:it.m,e:Date.now()+it.t*1000};
  if(type==='case') { openCase(); S.st.c++; }
  if(type==='furn') { const ex=S.inv.find(x=>x.id===it.id); if(ex)ex.c++; else S.inv.push({id:it.id,c:1}); }
  ui(); shop(tab); save();
}

function openCase() {
  const r=Math.random();
  if(r<0.6) S.k+=Math.floor(Math.random()*400+100);
  else if(r<0.85) { const f=DB.food[0]; S.bs={m:f.m,e:Date.now()+f.t*1000}; }
  else if(r<0.97) { const m=[1.05,1.1,1.15]; S.pm*=m[Math.floor(Math.random()*m.length)]; }
  else { const f=DB.furn[Math.floor(Math.random()*DB.furn.length)]; const ex=S.inv.find(x=>x.id===f.id); if(ex)ex.c++; else S.inv.push({id:f.id,c:1}); }
  setTimeout(()=>alert('🎁 Награда получена!'),50);
  ui(); save();
}

// === ИНВЕНТАРЬ ===
function renderInv() {
  const slots=E('inv-slots'); if(!slots) return;
  slots.innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap">'+
    ['mat','toy','toy','dec','dec','dec'].map((s,i)=>`<div class="slot ${S.sl[s+i]? 'eq':''}">${S.sl[s+i]?'✅':''}</div>`).join('')+
    '</div>';
  
  const list=E('inv-items'); if(!list) return; list.innerHTML='';
  if(!S.inv.length) { list.innerHTML='<p style="padding:20px;text-align:center;color:#999">Пусто</p>'; return; }
  S.inv.forEach(inv=>{
    const it=DB.furn.find(x=>x.id===inv.id); if(!it) return;
    const d=document.createElement('div'); d.className='item';
    const eq=Object.values(S.sl).includes(it.id);
    d.innerHTML=`<span><b>${it.n}</b> x${inv.c}<br><small>x${it.m}</small></span><button>${eq?'Снять':'Надеть'}</button>`;
    d.querySelector('button').onclick=()=>{
      if(eq) Object.keys(S.sl).forEach(k=>{if(S.sl[k]===it.id)delete S.sl[k]});
      else {
        const key=it.s+(it.s==='mat'?'':Object.keys(S.sl).filter(k=>k.startsWith(it.s)).length);
        if(!S.sl[key]) S.sl[key]=it.id; else alert('Нет места!');
      }
      ui(); save();
    };
    list.appendChild(d);
  });
}

function renderStats() {
  const l=E('stats-list'); if(!l) return;
  l.innerHTML = `<li>Клики: <b>${F(S.st.c)}</b></li><li>Заработано: <b>${F(S.st.e)}🦴</b></li><li>База клика: <b>${S.cb}</b></li><li>Множитель: <b>x${mult().toFixed(2)}</b></li>`;
}

// === ЗАПУСК ===
function init() {
  console.log('🐶 Start');
  if(window.vkBridge) vkBridge.send('VKWebAppInit').catch(()=>{});
  load(); ui();
  
  // Клик
  const cz=E('click-zone'); if(cz) {
    const click=e=>{
      e?.preventDefault();
      const v=clickVal(); S.k+=v; S.st.c++; S.st.e+=v;
      // Текст
      const ft=document.createElement('div'); ft.className='float'; ft.textContent='+'+F(v);
      const rect=cz.getBoundingClientRect();
      ft.style.left=(e?.clientX||rect.left+50)-rect.left-10+'px';
      ft.style.top=(e?.clientY||rect.top+50)-rect.top-10+'px';
      const fc=E('float-container'); if(fc){fc.appendChild(ft); setTimeout(()=>ft.remove(),600);}
      ui(); save();
    };
    cz.onclick=click; cz.ontouchstart=e=>{e.preventDefault(); click(e);};
  }
  
  // Меню
  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{
    const m=E('modal-'+b.dataset.open); if(m){m.classList.add('open');E('overlay').style.display='block'; if(m.id==='modal-shop')shop(tab);}
  });
  document.querySelectorAll('.close').forEach(b=>b.onclick=()=>{document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'));E('overlay').style.display='none'; save();});
  E('overlay')?.addEventListener('click',()=>{document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'));E('overlay').style.display='none'; save();});
  
  // Табы
  document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>shop(b.dataset.tab));
  
  setInterval(()=>{if(S.bs.e>Date.now())ui()},1000);
  setInterval(save,10000);
  console.log('✅ Ready');
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
