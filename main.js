// === БАЗА ПРЕДМЕТОВ ===
// 📍 ВСЕ КАРТИНКИ И ЭМОДЗИ ЗДЕСЬ! МЕНЯЙ ЧТО ХОЧЕШЬ
const DB = {
  // Прокачка клика
  up: [
    {id:'u1',n:'Тренировка лапок',desc:'+1 к силе клика',c:50,v:1},
    {id:'u2',n:'Утренняя зарядка',desc:'+3 к силе клика',c:200,v:3},
    {id:'u3',n:'Спортивная форма',desc:'+10 к силе клика',c:1000,v:10},
    {id:'u4',n:'Олимпийский чемпион',desc:'+50 к силе клика',c:5000,v:50}
  ],
  // Еда (временный буст)
  food: [
    {id:'f1',n:'Вкусняшка',desc:'x2 к клику на 3 мин',c:150,m:2,t:180,emoji:'🍖'},
    {id:'f2',n:'Элитный корм',desc:'x3 к клику на 5 мин',c:500,m:3,t:300,emoji:'🥩'},
    {id:'f3',n:'Золотая косточка',desc:'x5 к клику на 10 мин',c:2000,m:5,t:600,emoji:'🦴'}
  ],
  // Кейсы
  case: [
    {id:'c1',n:'Обычный кейс',desc:'Шанс на награду',c:2000},
    {id:'c2',n:'Редкий кейс',desc:'Лучшие шансы',c:10000}
  ],
  // Мебель и декор
  // 📍 ЧТОБЫ ИЗМЕНИТЬ КАРТИНКУ ПРЕДМЕТА - МЕНЯЙ emoji НА СВОЁ ИЗОБРАЖЕНИЕ
  furn: [
    // Подстилки (mat)
    {id:'m1',n:'Мягкий коврик',desc:'Под мопсом',s:'mat',m:1.2,c:1000,emoji:'🟫'},
    {id:'m2',n:'Пушистый плед',desc:'Под мопсом',s:'mat',m:1.3,c:2500,emoji:'🛏️'},
    
    // Игрушки (toy) - максимум 2
    {id:'t1',n:'Мячик',desc:'Рядом с мопсом',s:'toy',m:1.15,c:800,emoji:'⚽'},
    {id:'t2',n:'Косточка',desc:'Рядом с мопсом',s:'toy',m:1.1,c:600,emoji:'🦴'},
    {id:'t3',n:'Пищалка',desc:'Рядом с мопсом',s:'toy',m:1.12,c:900,emoji:'🎾'},
    
    // Декор (dec) - максимум 3
    {id:'d1',n:'Картина',desc:'На стену',s:'dec',m:1.05,c:500,emoji:'🖼️'},
    {id:'d2',n:'Окно',desc:'На стену',s:'dec',m:1.05,c:500,emoji:'🪟'},
    {id:'d3',n:'Шкаф',desc:'В комнату',s:'dec',m:1.05,c:500,emoji:'🚪'},
    {id:'d4',n:'Ваза',desc:'На полку',s:'dec',m:1.08,c:1200,emoji:'🏺'},
    {id:'d5',n:'Лампа',desc:'В комнату',s:'dec',m:1.06,c:800,emoji:'💡'}
  ]
};

// === СОСТОЯНИЕ ИГРЫ ===
let S = {
  k:0,          // Корм
  cb:1,         // База клика
  pm:1,         // Постоянный множитель
  bs:{m:1,e:0}, // Буст (множитель, время окончания)
  inv:[],       // Инвентарь [{id, count}]
  sl:{},        // Экипировка {slotId: itemId}
  st:{c:0,e:0}, // Статистика (клики, заработано)
  ls:Date.now()
};

// === УТИЛИТЫ ===
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
      const parsed=JSON.parse(r);
      S={...S,...parsed};
      S.inv=S.inv||[];
      S.sl=S.sl||{};
      S.st=S.st||{c:0,e:0};
    }
  }catch(e){} 
}

// === РАСЧЁТ МНОЖИТЕЛЕЙ ===
function calcMult() {
  let m=S.pm;
  // Временный буст
  if(S.bs.e>Date.now()) m*=S.bs.m;
  // Мебель
  Object.values(S.sl).forEach(itemId=>{
    const it=DB.furn.find(x=>x.id===itemId);
    if(it) m*=it.m;
  });
  return m;
}

function clickVal() { return S.cb * calcMult(); }

// === ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ===
function ui() {
  try {
    if(E('ui-kibble')) E('ui-kibble').textContent = F(S.k);
    if(E('ui-mult')) E('ui-mult').textContent = 'x'+calcMult().toFixed(2);
    
    // Буст
    const b=E('ui-boost'), bt=E('ui-boost-time');
    if(b&&bt) {
      if(S.bs.e>Date.now()) {
        b.style.display='block';
        const sec=Math.ceil((S.bs.e-Date.now())/1000);
        bt.textContent = Math.floor(sec/60)+':'+(sec%60).toString().padStart(2,'0');
      } else b.style.display='none';
    }
    
    // ВИЗУАЛИЗАЦИЯ ПРЕДМЕТОВ В КОМНАТЕ
    updateRoomVisuals();
    
    renderInv(); 
    renderStats();
  } catch(err) { console.warn('UI error:',err); }
}

// 🎨 ОТОБРАЖЕНИЕ ПРЕДМЕТОВ В КОМНАТЕ
function updateRoomVisuals() {
  // Скрываем всё сначала
  ['dec-window','dec-picture','dec-wardrobe','toy-ball','toy-bone','mat-rug'].forEach(id=>{
    const el=E(id); if(el) el.style.display='none';
  });
  
  // Показываем экипированное
  Object.values(S.sl).forEach(itemId=>{
    const it=DB.furn.find(x=>x.id===itemId);
    if(!it) return;
    
    // Декор
    if(it.s==='dec'){
      if(itemId==='d1' && E('dec-picture')) E('dec-picture').style.display='block'; // Картина
      if(itemId==='d2' && E('dec-window')) E('dec-window').style.display='block'; // Окно
      if(itemId==='d3' && E('dec-wardrobe')) E('dec-wardrobe').style.display='block'; // Шкаф
    }
    // Игрушки
    if(it.s==='toy'){
      if(itemId==='t1' && E('toy-ball')) E('toy-ball').style.display='block'; // Мяч
      if(itemId==='t2' && E('toy-bone')) E('toy-bone').style.display='block'; // Кость
      if(itemId==='t3' && E('toy-ball')) E('toy-ball').style.display='block'; // Пищалка (вместо мяча)
    }
    // Подстилка
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
    const d=document.createElement('div'); 
    d.className='item';
    const canBuy=S.k>=it.c;
    d.innerHTML = `
      <div class="item-info">
        <b>${it.n}</b>
        <small>${it.desc||''}</small>
      </div>
      <button ${canBuy?'':'disabled'}>${it.c}🦴</button>
    `;
    d.querySelector('button').onclick=()=>buy(it,t);
    c.appendChild(d);
  });
}

function buy(it,type) {
  if(S.k<it.c) return; 
  S.k-=it.c;
  
  if(type==='up') {
    S.cb+=it.v;
  }
  if(type==='food') {
    S.bs={m:it.m,e:Date.now()+it.t*1000};
  }
  if(type==='case') { 
    openCase(it.id); 
    S.st.c++; 
  }
  if(type==='furn') { 
    const ex=S.inv.find(x=>x.id===it.id); 
    if(ex)ex.c++; 
    else S.inv.push({id:it.id,c:1,emoji:it.emoji}); 
  }
  
  ui(); shop(tab); save();
}

// 📦 ОТКРЫТИЕ КЕЙСА С ПОДРОБНЫМ ОПИСАНИЕМ
function openCase(caseId) {
  const isRare = caseId==='c2';
  const r=Math.random();
  let rewardText='';
  let rewardEmoji='';
  
  if(isRare){
    // Редкий кейс - лучшие шансы
    if(r<0.25){
      const amount=Math.floor(Math.random()*3000+2000);
      S.k+=amount;
      rewardText=`💰 ${amount} корма`;
      rewardEmoji='💰';
    }else if(r<0.50){
      const f=DB.food[Math.floor(Math.random()*DB.food.length)];
      S.bs={m:f.m,e:Date.now()+f.t*1000};
      rewardText=`🍖 ${f.n} (x${f.m} на ${f.t/60} мин)`;
      rewardEmoji='🍖';
    }else if(r<0.85){
      const mults=[1.1,1.15,1.2,1.25,1.3,1.5];
      const m=mults[Math.floor(Math.random()*mults.length)];
      S.pm*=m;
      rewardText=`✨ Навсегда x${m.toFixed(2)} к клику!`;
      rewardEmoji='✨';
    }else{
      const f=DB.furn[Math.floor(Math.random()*DB.furn.length)];
      const ex=S.inv.find(x=>x.id===f.id);
      if(ex)ex.c++; else S.inv.push({id:f.id,c:1,emoji:f.emoji});
      rewardText=`🛋️ ${f.n} (x${f.m})`;
      rewardEmoji='🛋️';
    }
  }else{
    // Обычный кейс - сложнее
    if(r<0.50){
      const amount=Math.floor(Math.random()*400+200);
      S.k+=amount;
      rewardText=`💰 ${amount} корма`;
      rewardEmoji='💰';
    }else if(r<0.75){
      const amount=Math.floor(Math.random()*150+50);
      S.k+=amount;
      rewardText=`🪙 ${amount} корма`;
      rewardEmoji='🪙';
    }else if(r<0.88){
      const f=DB.food[0];
      S.bs={m:f.m,e:Date.now()+f.t*1000};
      rewardText=`🍖 ${f.n} (x${f.m})`;
      rewardEmoji='🍖';
    }else if(r<0.96){
      const mults=[1.05,1.1,1.15];
      const m=mults[Math.floor(Math.random()*mults.length)];
      S.pm*=m;
      rewardText=`✨ Навсегда x${m.toFixed(2)}!`;
      rewardEmoji='✨';
    }else{
      const cheap=DB.furn.filter(f=>f.c<=1000);
      const f=cheap[Math.floor(Math.random()*cheap.length)];
      const ex=S.inv.find(x=>x.id===f.id);
      if(ex)ex.c++; else S.inv.push({id:f.id,c:1,emoji:f.emoji});
      rewardText=`🛋️ ${f.n}`;
      rewardEmoji='🛋️';
    }
  }
  
  // Показываем ЧТО именно выпало
  setTimeout(()=>{
    alert(`📦 ${isRare?'РЕДКИЙ кейс':'Обычный кейс'}\n\n🎁 ${rewardEmoji} ${rewardText}`);
  },50);
  
  ui(); save();
}

// === ИНВЕНТАРЬ ===
function renderInv() {
  // Считаем слоты
  const matCount=Object.keys(S.sl).filter(k=>k.startsWith('mat')).length;
  const toyCount=Object.keys(S.sl).filter(k=>k.startsWith('toy')).length;
  const decCount=Object.keys(S.sl).filter(k=>k.startsWith('dec')).length;
  
  if(E('slot-mat')) E('slot-mat').textContent=`${matCount}/1`;
  if(E('slot-toy')) E('slot-toy').textContent=`${toyCount}/2`;
  if(E('slot-dec')) E('slot-dec').textContent=`${decCount}/3`;
  
  // Список предметов
  const list=E('inv-items'); if(!list) return; list.innerHTML='';
  
  if(!S.inv.length) { 
    list.innerHTML='<p style="padding:20px;text-align:center;color:#999">Пусто. Купите что-нибудь!</p>'; 
    return; 
  }
  
  S.inv.forEach(inv=>{
    const it=DB.furn.find(x=>x.id===inv.id); 
    if(!it) return;
    
    const d=document.createElement('div'); 
    d.className='item';
    
    // Проверяем, надето ли
    const isEquipped=Object.values(S.sl).includes(it.id);
    const emoji=inv.emoji||it.emoji||'📦';
    
    d.innerHTML=`
      <div class="item-info">
        <b>${emoji} ${it.n}</b>
        <small>x${inv.count} • Множитель: x${it.m}</small>
      </div>
      <button>${isEquipped?'Снять':'Надеть'}</button>
    `;
    
    d.querySelector('button').onclick=()=>{
      if(isEquipped){
        // Снять
        Object.keys(S.sl).forEach(k=>{
          if(S.sl[k]===it.id) delete S.sl[k];
        });
      }else{
        // Надеть - ищем свободный слот
        let slotKey=null;
        if(it.s==='mat'){
          if(!S.sl['mat']) slotKey='mat';
        }else if(it.s==='toy'){
          if(!S.sl['toy1']) slotKey='toy1';
          else if(!S.sl['toy2']) slotKey='toy2';
        }else if(it.s==='dec'){
          if(!S.sl['dec1']) slotKey='dec1';
          else if(!S.sl['dec2']) slotKey='dec2';
          else if(!S.sl['dec3']) slotKey='dec3';
        }
        
        if(slotKey){
          S.sl[slotKey]=it.id;
        }else{
          alert('Нет свободных слотов! Снимите что-нибудь.');
        }
      }
      ui(); save();
    };
    
    list.appendChild(d);
  });
}

function renderStats() {
  const l=E('stats-list'); if(!l) return;
  l.innerHTML = `
    <li>🖱️ Всего кликов</li><li><b>${F(S.st.c)}</b></li>
    <li>💰 Заработано корма</li><li><b>${F(S.st.e)} 🦴</b></li>
    <li>⚡ Сила клика (база)</li><li><b>${S.cb}</b></li>
    <li>📈 Постоянный множитель</li><li><b>x${S.pm.toFixed(2)}</b></li>
    <li>🛋️ Множитель мебели</li><li><b>x${(calcMult()/(S.pm*(S.bs.e>Date.now()?S.bs.m:1))).toFixed(2)}</b></li>
  `;
}

// === ЗАПУСК ИГРЫ ===
function init() {
  console.log('🐶 Мопс Кликер запускается...');
  
  // VK Bridge
  if(window.vkBridge) vkBridge.send('VKWebAppInit').catch(()=>{});
  
  load(); 
  ui();
  
  // Клик по мопсу
  const cz=E('click-zone'); 
  if(cz) {
    const handleClick=(e)=>{
      e?.preventDefault();
      const v=clickVal(); 
      S.k+=v; 
      S.st.c++; 
      S.st.e+=v;
      
      // Плавающий текст
      const ft=document.createElement('div'); 
      ft.className='float'; 
      ft.textContent='+'+F(v);
      const rect=cz.getBoundingClientRect();
      ft.style.left=(e?.clientX||rect.left+80)-rect.left-10+'px';
      ft.style.top=(e?.clientY||rect.top+80)-rect.top-10+'px';
      const fc=E('float-container'); 
      if(fc){
        fc.appendChild(ft); 
        setTimeout(()=>ft.remove(),600);
      }
      
      ui(); save();
    };
    
    cz.onclick=handleClick; 
    cz.ontouchstart=e=>{e.preventDefault(); handleClick(e);};
  }
  
  // Открытие меню
  document.querySelectorAll('[data-open]').forEach(b=>{
    b.onclick=()=>{
      const m=E('modal-'+b.dataset.open); 
      if(m){
        m.classList.add('open');
        E('overlay').style.display='block'; 
        if(m.id==='modal-shop') shop(tab);
      }
    }
  });
  
  // Закрытие меню
  document.querySelectorAll('.close').forEach(b=>{
    b.onclick=()=>{
      document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'));
      E('overlay').style.display='none'; 
      save();
    }
  });
  
  E('overlay')?.addEventListener('click',()=>{
    document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'));
    E('overlay').style.display='none'; 
    save();
  });
  
  // Табы магазина
  document.querySelectorAll('.tab').forEach(b=>{
    b.onclick=()=>shop(b.dataset.tab);
  });
  
  // Таймер буста
  setInterval(()=>{
    if(S.bs.e>Date.now()) ui();
  },1000);
  
  // Автосохранение
  setInterval(save,10000);
  
  console.log('✅ Готово! Тапай по мопсу!');
}

// Запуск
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); 
else init();
