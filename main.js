// === БАЗА ПРЕДМЕТОВ ===
const DB = {
  up: [
    {id:'u1',n:'Тренировка лапок',desc:'+1 к силе клика',c:50,v:1},
    {id:'u2',n:'Утренняя зарядка',desc:'+3 к силе клика',c:200,v:3},
    {id:'u3',n:'Спортивная форма',desc:'+10 к силе клика',c:1000,v:10},
    {id:'u4',n:'Олимпийский чемпион',desc:'+50 к силе клика',c:5000,v:50}
  ],
  food: [
    {id:'f1',n:'Вкусняшка',desc:'x2 к клику на 3 мин',c:150,m:2,t:180},
    {id:'f2',n:'Элитный корм',desc:'x3 к клику на 5 мин',c:500,m:3,t:300},
    {id:'f3',n:'Золотая косточка',desc:'x5 к клику на 10 мин',c:2000,m:5,t:600}
  ],
  case: [
    {id:'c1',n:'Обычный кейс',desc:'Шанс на награду',c:2000},
    {id:'c2',n:'Редкий кейс',desc:'Лучшие шансы',c:10000}
  ],
  furn: [
    // Матрасы (mat)
    {id:'m1',n:'Мягкий коврик',desc:'Под мопсом',s:'mat',m:1.2,c:1000,emoji:'🟫'},
    {id:'m2',n:'Пушистый плед',desc:'Под мопсом',s:'mat',m:1.3,c:2500,emoji:'🛏️'},
    
    // Игрушки (toy) - макс 2
    {id:'t1',n:'Мячик',desc:'Рядом',s:'toy',m:1.15,c:800,emoji:'⚽'},
    {id:'t2',n:'Косточка',desc:'Рядом',s:'toy',m:1.1,c:600,emoji:'🦴'},
    {id:'t3',n:'Пищалка',desc:'Рядом',s:'toy',m:1.12,c:900,emoji:'🎾'},
    
    // Декор (dec) - макс 3
    {id:'d1',n:'Картина',desc:'На стену',s:'dec',m:1.05,c:500,emoji:'🖼️'},
    {id:'d2',n:'Окно',desc:'На стену',s:'dec',m:1.05,c:500,emoji:'🪟'},
    {id:'d3',n:'Шкаф',desc:'В угол',s:'dec',m:1.05,c:500,emoji:'🚪'},
    {id:'d4',n:'Лампа',desc:'Свет',s:'dec',m:1.08,c:1200,emoji:'💡'},
    {id:'d5',n:'Ваза',desc:'Декор',s:'dec',m:1.06,c:800,emoji:'🏺'}
  ]
};

// === СОСТОЯНИЕ ===
let S = {
  k:0, cb:1, pm:1, bs:{m:1,e:0}, inv:[], sl:{}, st:{c:0,e:0}, ls:Date.now()
};

const E = id => document.getElementById(id);
const F = n => Math.floor(n).toLocaleString();

function save() { 
  S.ls=Date.now(); 
  try{localStorage.setItem('pug_save',JSON.stringify(S))}catch(e){} 
}

function load() { 
  try{
    const r=localStorage.getItem('pug_save'); 
    if(r){
      const p=JSON.parse(r);
      S={...S,...p};
      S.inv=S.inv||[]; S.sl=S.sl||{}; S.st=S.st||{c:0,e:0};
    }
  }catch(e){} 
}

function calcMult() {
  let m=S.pm;
  if(S.bs.e>Date.now()) m*=S.bs.m;
  Object.values(S.sl).forEach(id=>{
    const it=DB.furn.find(x=>x.id===id);
    if(it) m*=it.m;
  });
  return m;
}

function clickVal() { return S.cb * calcMult(); }

// === UI ===
function ui() {
  try {
    if(E('ui-kibble')) E('ui-kibble').textContent = F(S.k);
    if(E('ui-mult')) E('ui-mult').textContent = 'x'+calcMult().toFixed(2);
    
    const b=E('ui-boost'), bt=E('ui-boost-time');
    if(b&&bt) {
      if(S.bs.e>Date.now()) {
        b.style.display='block';
        const sec=Math.ceil((S.bs.e-Date.now())/1000);
        bt.textContent = Math.floor(sec/60)+':'+(sec%60).toString().padStart(2,'0');
      } else b.style.display='none';
    }
    
    // Визуализация комнаты
    updateRoomVisuals();
    
    renderInv(); 
    renderStats();
  } catch(err) { console.warn('UI error:',err); }
}

// 🎨 ЛОГИКА ОТОБРАЖЕНИЯ В КОМНАТЕ
function updateRoomVisuals() {
  // Скрываем всё
  ['dec-wardrobe','dec-window','dec-lamp','toy-ball','toy-bone','mat-rug'].forEach(id=>{
    if(E(id)) E(id).style.display='none';
  });

  // Показываем купленное
  Object.values(S.sl).forEach(id=>{
    const it=DB.furn.find(x=>x.id===id);
    if(!it) return;

    // Декор
    if(it.s==='dec') {
      if(id==='d3' && E('dec-wardrobe')) E('dec-wardrobe').style.display='block'; // Шкаф
      if(id==='d2' && E('dec-window')) E('dec-window').style.display='block';     // Окно
      if(id==='d4' && E('dec-lamp')) E('dec-lamp').style.display='block';        // Лампа
    }
    // Игрушки
    if(it.s==='toy') {
      if(id==='t1' && E('toy-ball')) E('toy-ball').style.display='block';
      if(id==='t2' && E('toy-bone')) E('toy-bone').style.display='block';
    }
    // Матрас
    if(it.s==='mat' && E('mat-rug')) E('mat-rug').style.display='block';
  });
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
    d.innerHTML = `<div class="item-info"><b>${it.n}</b><small>${it.desc||''}</small></div><button ${S.k<it.c?'disabled':''}>${it.c}🦴</button>`;
    d.querySelector('button').onclick=()=>buy(it,t);
    c.appendChild(d);
  });
}

function buy(it,type) {
  if(S.k<it.c) return; S.k-=it.c;
  if(type==='up') S.cb+=it.v;
  if(type==='food') S.bs={m:it.m,e:Date.now()+it.t*1000};
  if(type==='case') { openCase(it.id); S.st.c++; }
  if(type==='furn') { 
    const ex=S.inv.find(x=>x.id===it.id); 
    if(ex)ex.c++; else S.inv.push({id:it.id,c:1,emoji:it.emoji}); 
  }
  ui(); shop(tab); save();
}

function openCase(id) {
  const isRare = id==='c2';
  const r=Math.random();
  let text='';
  if(isRare){
    if(r<0.25){S.k+=3000; text='💰 3000 корма';}
    else if(r<0.5){S.bs={m:5,e:Date.now()+600000}; text='🍖 x5 на 10 мин';}
    else if(r<0.85){S.pm*=1.3; text='✨ Навсегда x1.3';}
    else { const f=DB.furn[0]; const ex=S.inv.find(x=>x.id===f.id); if(ex)ex.c++; else S.inv.push({id:f.id,c:1,emoji:f.emoji}); text='🛋️ '+f.n; }
  }else{
    if(r<0.5){S.k+=400; text='💰 400 корма';}
    else if(r<0.8){S.bs={m:2,e:Date.now()+180000}; text='🍖 x2 на 3 мин';}
    else if(r<0.95){S.pm*=1.1; text='✨ Навсегда x1.1';}
    else { const f=DB.furn[2]; const ex=S.inv.find(x=>x.id===f.id); if(ex)ex.c++; else S.inv.push({id:f.id,c:1,emoji:f.emoji}); text='🛋️ '+f.n; }
  }
  setTimeout(()=>alert(' Кейс:\n'+text),50);
  ui(); save();
}

// === ИНВЕНТАРЬ ===
function renderInv() {
  const m=Object.keys(S.sl).filter(k=>k.startsWith('mat')).length;
  const t=Object.keys(S.sl).filter(k=>k.startsWith('toy')).length;
  const d=Object.keys(S.sl).filter(k=>k.startsWith('dec')).length;
  if(E('slot-mat')) E('slot-mat').textContent=`${m}/1`;
  if(E('slot-toy')) E('slot-toy').textContent=`${t}/2`;
  if(E('slot-dec')) E('slot-dec').textContent=`${d}/3`;

  const list=E('inv-items'); if(!list) return; list.innerHTML='';
  if(!S.inv.length) { list.innerHTML='<p style="padding:20px;text-align:center;color:#999">Пусто</p>'; return; }
  
  S.inv.forEach(inv=>{
    const it=DB.furn.find(x=>x.id===inv.id); if(!it) return;
    const d=document.createElement('div'); d.className='item';
    const eq=Object.values(S.sl).includes(it.id);
    d.innerHTML=`<div class="item-info"><b>${inv.emoji||''} ${it.n}</b><small>x${inv.count} • x${it.m}</small></div><button>${eq?'Снять':'Надеть'}</button>`;
    d.querySelector('button').onclick=()=>{
      if(eq){ Object.keys(S.sl).forEach(k=>{if(S.sl[k]===it.id) delete S.sl[k]}); }
      else {
        let key=null;
        if(it.s==='mat' && !S.sl['mat']) key='mat';
        if(it.s==='toy'){ if(!S.sl['toy1']) key='toy1'; else if(!S.sl['toy2']) key='toy2'; }
        if(it.s==='dec'){ if(!S.sl['dec1']) key='dec1'; else if(!S.sl['dec2']) key='dec2'; else if(!S.sl['dec3']) key='dec3'; }
        if(key) S.sl[key]=it.id; else alert('Нет мест!');
      }
      ui(); save();
    };
    list.appendChild(d);
  });
}

function renderStats() {
  const l=E('stats-list'); if(!l) return;
  l.innerHTML = `<li>Клики: <b>${F(S.st.c)}</b></li><li>Заработано: <b>${F(S.st.e)}🦴</b></li><li>База: <b>${S.cb}</b></li><li>Множитель: <b>x${calcMult().toFixed(2)}</b></li>`;
}

// === ЗАПУСК ===
function init() {
  console.log('🐶 Start');
  if(window.vkBridge) vkBridge.send('VKWebAppInit').catch(()=>{});
  load(); ui();
  
  const cz=E('click-zone'); 
  if(cz) {
    const click=e=>{
      e?.preventDefault();
      const v=clickVal(); S.k+=v; S.st.c++; S.st.e+=v;
      const ft=document.createElement('div'); ft.className='float'; ft.textContent='+'+F(v);
      const rect=cz.getBoundingClientRect();
      ft.style.left=(e?.clientX||rect.left+75)-rect.left-10+'px';
      ft.style.top=(e?.clientY||rect.top+75)-rect.top-10+'px';
      const fc=E('float-container'); if(fc){fc.appendChild(ft); setTimeout(()=>ft.remove(),600);}
      ui(); save();
    };
    cz.onclick=click; cz.ontouchstart=e=>{e.preventDefault(); click(e);};
  }
  
  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{
    const m=E('modal-'+b.dataset.open); if(m){m.classList.add('open');E('overlay').style.display='block'; if(m.id==='modal-shop')shop(tab);}
  });
  document.querySelectorAll('.close').forEach(b=>b.onclick=()=>{document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'));E('overlay').style.display='none'; save();});
  E('overlay')?.addEventListener('click',()=>{document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'));E('overlay').style.display='none'; save();});
  document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>shop(b.dataset.tab));
  
  setInterval(()=>{if(S.bs.e>Date.now())ui()},1000);
  setInterval(save,10000);
  console.log('✅ Ready');
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
