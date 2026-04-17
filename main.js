// === КОНФИГ И ДАННЫЕ ===
const ITEMS_DB = {
  upgrades: [
    { id: 'u1', name: 'Крепкие лапки', desc: '+1 к силе клика', cost: 50, type: 'click', value: 1 },
    { id: 'u2', name: 'Острые зубки', desc: '+3 к силе клика', cost: 200, type: 'click', value: 3 },
    { id: 'u3', name: 'Железные нервы', desc: '+10 к силе клика', cost: 1000, type: 'click', value: 10 }
  ],
  food: [
    { id: 'f1', name: 'Вкусняшка', desc: 'x2 к клику на 5 мин', cost: 150, type: 'food', mult: 2, dur: 300 },
    { id: 'f2', name: 'Элитный корм', desc: 'x3 к клику на 10 мин', cost: 500, type: 'food', mult: 3, dur: 600 }
  ],
  cases: [
    { id: 'c1', name: 'Обычный кейс', desc: 'Шанс на буст, еду или монеты', cost: 300, type: 'case' }
  ],
  furniture: [
    { id: 'm1', name: 'Мягкая подстилка', slot: 'mat', mult: 1.2 },
    { id: 't1', name: 'Пищащий мяч', slot: 'toy', mult: 1.15 },
    { id: 't2', name: 'Косточка', slot: 'toy', mult: 1.1 },
    { id: 'd1', name: 'Картина', slot: 'decor', mult: 1.05 },
    { id: 'd2', name: 'Коврик', slot: 'decor', mult: 1.05 },
    { id: 'd3', name: 'Вазон', slot: 'decor', mult: 1.05 }
  ]
};

// === СОСТОЯНИЕ ===
let state = {
  kibble: 0,
  clickBase: 1,
  permMult: 1.0,
  boost: { mult: 1, end: 0 },
  inventory: [], // { id, count, equipped }
  slots: { mat: null, toy1: null, toy2: null, decor1: null, decor2: null, decor3: null },
  stats: { clicks: 0, earned: 0, cases: 0 },
  code: '',
  lastSave: Date.now()
};

// === УТИЛИТЫ ===
const $ = id => document.getElementById(id);
const fmt = n => Math.floor(n).toLocaleString();
const rand = (min, max) => Math.random() * (max - min) + min;
const generateCode = () => 'PUG-' + Math.random().toString(36).substr(2, 6).toUpperCase();

// === СОХРАНЕНИЕ / ЗАГРУЗКА ===
function save() {
  state.lastSave = Date.now();
  try { localStorage.setItem('pug_save', JSON.stringify(state)); } catch(e) {}
}

function load() {
  try {
    const raw = localStorage.getItem('pug_save');
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
      // Защита от пустых полей
      state.inventory = state.inventory || [];
      state.slots = state.slots || { mat: null, toy1: null, toy2: null, decor1: null, decor2: null, decor3: null };
      state.stats = state.stats || { clicks: 0, earned: 0, cases: 0 };
    }
    if (!state.code) state.code = generateCode();
  } catch(e) { console.warn('Load error', e); }
}

// === РАСЧЁТЫ ===
function getFurnitureMult() {
  let m = 1;
  Object.values(state.slots).forEach(id => {
    if (!id) return;
    const item = ITEMS_DB.furniture.find(i => i.id === id);
    if (item) m *= item.mult;
  });
  return m;
}

function getClickValue() {
  const now = Date.now();
  if (state.boost.end && now > state.boost.end) {
    state.boost = { mult: 1, end: 0 };
    save();
  }
  const tempMult = state.boost.mult;
  const furnMult = getFurnitureMult();
  return state.clickBase * state.permMult * tempMult * furnMult;
}

// === ИНТЕРФЕЙС ===
function updateUI() {
  $('ui-kibble').textContent = fmt(state.kibble);
  $('ui-mult').textContent = `x${(state.permMult * getFurnitureMult() * (state.boost.end > Date.now() ? state.boost.mult : 1)).toFixed(2)}`;
  
  const boostActive = state.boost.end > Date.now();
  $('ui-boost').style.display = boostActive ? 'block' : 'none';
  if (boostActive) {
    const sec = Math.ceil((state.boost.end - Date.now()) / 1000);
    $('ui-boost-time').textContent = `${Math.floor(sec/60)}:${(sec%60).toString().padStart(2,'0')}`;
  }
  
  renderInventory();
  renderStats();
  $('pug-code').textContent = state.code;
}

function showModal(id) {
  $('overlay').style.display = 'block';
  $(id).classList.add('open');
  if (id === 'modal-shop') renderShop('upgrades');
  updateUI();
}

function closeModal() {
  $('overlay').style.display = 'none';
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
  save();
}

// === МАГАЗИН ===
let currentTab = 'upgrades';
function renderShop(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  const container = $('shop-content');
  container.innerHTML = '';
  
  const list = ITEMS_DB[tab] || [];
  list.forEach(item => {
    const canBuy = state.kibble >= item.cost;
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = `
      <div class="shop-info">
        <h4>${item.name}</h4>
        <p>${item.desc || ''}</p>
      </div>
      <button class="buy-btn" ${canBuy ? '' : 'disabled'} data-id="${item.id}" data-type="${tab}">
        ${item.cost} 🦴
      </button>
    `;
    container.appendChild(div);
  });
}

function buyItem(id, type) {
  const list = ITEMS_DB[type];
  const item = list.find(i => i.id === id);
  if (!item || state.kibble < item.cost) return;
  
  state.kibble -= item.cost;
  
  if (type === 'upgrades') {
    state.clickBase += item.value;
  } else if (type === 'food') {
    state.boost = { mult: item.mult, end: Date.now() + item.dur * 1000 };
  } else if (type === 'cases') {
    state.stats.cases++;
    openCase();
  } else if (type === 'furniture') {
    addToInventory(item.id, 1);
  }
  
  updateUI();
  renderShop(currentTab);
  save();
}

function openCase() {
  const roll = Math.random();
  let reward = '';
  if (roll < 0.4) {
    const amount = Math.floor(rand(100, 500));
    state.kibble += amount;
    reward = `💰 +${amount} `;
  } else if (roll < 0.7) {
    const foods = ITEMS_DB.food;
    const f = foods[Math.floor(Math.random() * foods.length)];
    state.boost = { mult: f.mult, end: Date.now() + f.dur * 1000 };
    reward = ` Буст x${f.mult} на ${f.dur/60} мин`;
  } else if (roll < 0.9) {
    const mults = [1.1, 1.15, 1.2, 1.25, 1.5, 2.0, 3.0];
    const m = mults[Math.floor(Math.random() * mults.length)];
    state.permMult *= m;
    reward = `✨ Навсегда x${m} к клику`;
  } else {
    const amount = Math.floor(rand(500, 2000));
    state.kibble += amount;
    reward = `💎 Редкость! +${amount} 🦴`;
  }
  alert(`Кейс открыт!\n${reward}`);
}

// === ИНВЕНТАРЬ ===
function addToInventory(id, count) {
  const existing = state.inventory.find(i => i.id === id);
  if (existing) existing.count += count;
  else state.inventory.push({ id, count, equipped: false });
}

function renderInventory() {
  // Slots
  const slotIds = ['mat', 'toy1', 'toy2', 'decor1', 'decor2', 'decor3'];
  slotIds.forEach(sid => {
    const el = $(`slot-${sid}`);
    const itemId = state.slots[sid];
    el.className = `slot ${itemId ? 'filled' : ''}`;
    el.textContent = itemId ? '' : '';
    el.title = itemId || 'Пусто';
  });

  // List
  const listEl = $('inv-list');
  listEl.innerHTML = '';
  state.inventory.forEach(inv => {
    const item = ITEMS_DB.furniture.find(i => i.id === inv.id);
    if (!item) return;
    
    const div = document.createElement('div');
    div.className = 'inv-item';
    const isEquipped = Object.values(state.slots).includes(inv.id);
    
    div.innerHTML = `
      <div>
        <b>${item.name}</b> <small>x${inv.count}</small><br>
        <small>Множитель: x${item.mult}</small>
      </div>
      <div class="inv-actions">
        ${isEquipped 
          ? `<button class="unequip" data-id="${inv.id}">Снять</button>` 
          : `<button data-id="${inv.id}">Надеть</button>`}
      </div>
    `;
    listEl.appendChild(div);
  });
}

function equipItem(id) {
  const item = ITEMS_DB.furniture.find(i => i.id === id);
  if (!item) return;
  
  const slotKey = item.slot === 'mat' ? 'mat' : 
                  item.slot === 'toy' ? (state.slots.toy1 ? 'toy2' : 'toy1') :
                  (state.slots.decor1 ? (state.slots.decor2 ? 'decor3' : 'decor2') : 'decor1');
                  
  if (!slotKey) return alert('Нет свободных слотов!');
  
  // Снять если уже надето в другом слоте
  Object.keys(state.slots).forEach(k => {
    if (state.slots[k] === id) state.slots[k] = null;
  });
  
  state.slots[slotKey] = id;
  updateUI();
  save();
}

function unequipItem(id) {
  Object.keys(state.slots).forEach(k => {
    if (state.slots[k] === id) state.slots[k] = null;
  });
  updateUI();
  save();
}

// === СТАТИСТИКА ===
function renderStats() {
  const list = $('stats-list');
  list.innerHTML = `
    <li><span>Всего кликов</span> <b>${fmt(state.stats.clicks)}</b></li>
    <li><span>Всего заработано</span> <b>${fmt(state.stats.earned)} 🦴</b></li>
    <li><span>Кейсов открыто</span> <b>${state.stats.cases}</b></li>
    <li><span>Сила клика (база)</span> <b>${state.clickBase}</b></li>
    <li><span>Постоянный множитель</span> <b>x${state.permMult.toFixed(2)}</b></li>
  `;
}

// === ИНИЦИАЛИЗАЦИЯ ===
window.addEventListener('load', () => {
  if (window.vkBridge) window.vkBridge.send('VKWebAppInit').catch(() => {});
  load();
  updateUI();
  
  // Клик
  $('click-zone').addEventListener('click', (e) => {
    const val = getClickValue();
    state.kibble += val;
    state.stats.clicks++;
    state.stats.earned += val;
    
    // Текст
    const float = document.createElement('div');
    float.className = 'float-text';
    float.textContent = `+${fmt(val)}`;
    float.style.left = `${e.clientX - $('float-texts').getBoundingClientRect().left - 20}px`;
    float.style.top = `${e.clientY - $('float-texts').getBoundingClientRect().top - 20}px`;
    $('float-texts').appendChild(float);
    setTimeout(() => float.remove(), 800);
    
    updateUI();
    save();
  });

  // Модальные окна
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => showModal(`modal-${btn.dataset.modal}`));
  });
  document.querySelectorAll('.close-btn').forEach(btn => btn.addEventListener('click', closeModal));
  $('overlay').addEventListener('click', closeModal);

  // Табы магазина
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => renderShop(tab.dataset.tab));
  });

  // Покупки (делегирование)
  $('shop-content').addEventListener('click', (e) => {
    const btn = e.target.closest('.buy-btn');
    if (btn) buyItem(btn.dataset.id, btn.dataset.type);
  });

  // Инвентарь (делегирование)
  $('inv-list').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.classList.contains('unequip')) unequipItem(btn.dataset.id);
    else equipItem(btn.dataset.id);
  });

  // Таймер буста
  setInterval(() => {
    if (state.boost.end > Date.now()) updateUI();
  }, 1000);
});
