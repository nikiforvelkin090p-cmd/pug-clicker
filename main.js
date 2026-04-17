// === КОНФИГ И ДАННЫЕ ===
const ITEMS_DB = {
  upgrades: [
    { id: 'u1', name: 'Крепкие лапки', desc: '+1 к силе клика', cost: 50, type: 'click', value: 1 },
    { id: 'u2', name: 'Острые зубки', desc: '+3 к силе клика', cost: 200, type: 'click', value: 3 },
    { id: 'u3', name: 'Железные нервы', desc: '+10 к силе клика', cost: 1000, type: 'click', value: 10 },
    { id: 'u4', name: 'Супер мопс', desc: '+50 к силе клика', cost: 5000, type: 'click', value: 50 }
  ],
  food: [
    { id: 'f1', name: 'Вкусняшка', desc: 'x2 к клику на 3 мин', cost: 150, type: 'food', mult: 2, dur: 180 },
    { id: 'f2', name: 'Элитный корм', desc: 'x3 к клику на 5 мин', cost: 500, type: 'food', mult: 3, dur: 300 },
    { id: 'f3', name: 'Золотая косточка', desc: 'x5 к клику на 10 мин', cost: 2000, type: 'food', mult: 5, dur: 600 }
  ],
  cases: [
    { id: 'c1', name: 'Обычный кейс', desc: 'Шанс на награду', cost: 2000, type: 'case' },
    { id: 'c2', name: 'Редкий кейс', desc: 'Лучшие шансы', cost: 10000, type: 'case' }
  ],
  furniture: [
    { id: 'm1', name: 'Мягкая подстилка', slot: 'mat', mult: 1.2, cost: 1000 },
    { id: 't1', name: 'Пищащий мяч', slot: 'toy', mult: 1.15, cost: 800 },
    { id: 't2', name: 'Косточка', slot: 'toy', mult: 1.1, cost: 600 },
    { id: 'd1', name: 'Картина', slot: 'decor', mult: 1.05, cost: 500 },
    { id: 'd2', name: 'Коврик', slot: 'decor', mult: 1.05, cost: 500 },
    { id: 'd3', name: 'Вазон', slot: 'decor', mult: 1.05, cost: 500 },
    { id: 'd4', name: 'Лампа', slot: 'decor', mult: 1.08, cost: 1200 }
  ]
};

// === СОСТОЯНИЕ ===
let state = {
  kibble: 0,
  clickBase: 1,
  permMult: 1.0,
  boost: { mult: 1, end: 0 },
  inventory: [],
  slots: { mat: null, toy1: null, toy2: null, decor1: null, decor2: null, decor3: null },
  stats: { clicks: 0, earned: 0, cases: 0 },
  lastSave: Date.now()
};

// === УТИЛИТЫ ===
const $ = (id) => document.getElementById(id);
const fmt = (n) => Math.floor(n).toLocaleString();
const rand = (min, max) => Math.random() * (max - min) + min;

// === СОХРАНЕНИЕ ===
function save() {
  state.lastSave = Date.now();
  try {
    localStorage.setItem('pug_save', JSON.stringify(state));
  } catch(e) {
    console.warn('Save error:', e);
  }
}

function load() {
  try {
    const raw = localStorage.getItem('pug_save');
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
      state.inventory = state.inventory || [];
      state.slots = state.slots || { mat: null, toy1: null, toy2: null, decor1: null, decor2: null, decor3: null };
      state.stats = state.stats || { clicks: 0, earned: 0, cases: 0 };
    }
  } catch(e) {
    console.warn('Load error:', e);
  }
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
  }
  const tempMult = state.boost.end > now ? state.boost.mult : 1;
  const furnMult = getFurnitureMult();
  return state.clickBase * state.permMult * tempMult * furnMult;
}

// === ИНТЕРФЕЙС ===
function updateUI() {
  const kibbleEl = $('ui-kibble');
  const multEl = $('ui-mult');
  const boostEl = $('ui-boost');
  const boostTimeEl = $('ui-boost-time');
  
  if (kibbleEl) kibbleEl.textContent = fmt(state.kibble);
  if (multEl) {
    const currentMult = state.permMult * getFurnitureMult() * (state.boost.end > Date.now() ? state.boost.mult : 1);
    multEl.textContent = `x${currentMult.toFixed(2)}`;
  }
  
  if (boostEl && boostTimeEl) {
    const boostActive = state.boost.end > Date.now();
    boostEl.style.display = boostActive ? 'block' : 'none';
    if (boostActive) {
      const sec = Math.ceil((state.boost.end - Date.now()) / 1000);
      boostTimeEl.textContent = `${Math.floor(sec/60)}:${(sec%60).toString().padStart(2,'0')}`;
    }
  }
  
  renderInventory();
  renderStats();
}

function showModal(modalId) {
  const overlay = $('overlay');
  const modal = $(modalId);
  if (overlay) overlay.style.display = 'block';
  if (modal) modal.classList.add('open');
  if (modalId === 'modal-shop') renderShop('upgrades');
  updateUI();
}

function closeModal() {
  const overlay = $('overlay');
  if (overlay) overlay.style.display = 'none';
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
  save();
}

// === МАГАЗИН ===
let currentTab = 'upgrades';

function renderShop(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  
  const container = $('shop-content');
  if (!container) return;
  
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
  if (!list) return;
  
  const item = list.find(i => i.id === id);
  if (!item || state.kibble < item.cost) return;
  
  state.kibble -= item.cost;
  
  if (type === 'upgrades') {
    state.clickBase += item.value;
  } else if (type === 'food') {
    state.boost = { mult: item.mult, end: Date.now() + item.dur * 1000 };
  } else if (type === 'cases') {
    state.stats.cases++;
    openCase(id === 'c2');
  } else if (type === 'furniture') {
    addToInventory(item.id, 1);
  }
  
  updateUI();
  renderShop(currentTab);
  save();
}

function openCase(isRare) {
  const roll = Math.random();
  let reward = '';
  
  if (isRare) {
    if (roll < 0.25) {
      const amount = Math.floor(rand(2000, 5000));
      state.kibble += amount;
      reward = `💰 +${amount} 🦴`;
    } else if (roll < 0.50) {
      const foods = ITEMS_DB.food;
      const f = foods[Math.floor(Math.random() * foods.length)];
      state.boost = { mult: f.mult, end: Date.now() + f.dur * 1000 };
      reward = `🍖 ${f.name} (x${f.mult} на ${f.dur/60} мин)`;
    } else if (roll < 0.85) {
      const mults = [1.1, 1.15, 1.2, 1.25, 1.3, 1.5];
      const m = mults[Math.floor(Math.random() * mults.length)];
      state.permMult *= m;
      reward = `✨ Навсегда x${m.toFixed(2)} к клику!`;
    } else {
      const furns = ITEMS_DB.furniture;
      const f = furns[Math.floor(Math.random() * furns.length)];
      addToInventory(f.id, 1);
      reward = `🛋️ ${f.name} (x${f.mult})`;
    }
  } else {
    if (roll < 0.50) {
      const amount = Math.floor(rand(200, 800));
      state.kibble += amount;
      reward = `💰 +${amount} 🦴`;
    } else if (roll < 0.75) {
      const amount = Math.floor(rand(50, 200));
      state.kibble += amount;
      reward = `💵 Мелочь: +${amount} 🦴`;
    } else if (roll < 0.88) {
      const f = ITEMS_DB.food[0];
      state.boost = { mult: f.mult, end: Date.now() + f.dur * 1000 };
      reward = `🍖 ${f.name} (x${f.mult} на ${f.dur/60} мин)`;
    } else if (roll < 0.96) {
      const mults = [1.05, 1.1, 1.15];
      const m = mults[Math.floor(Math.random() * mults.length)];
      state.permMult *= m;
      reward = `✨ Навсегда x${m.toFixed(2)} к клику!`;
    } else {
      const furns = ITEMS_DB.furniture.filter(f => f.cost <= 800);
      const f = furns[Math.floor(Math.random() * furns.length)];
      addToInventory(f.id, 1);
      reward = `🛋️ ${f.name} (x${f.mult})`;
    }
  }
  
  setTimeout(() => alert(`📦 Кейс открыт!\n\n${reward}`), 100);
  updateUI();
}

// === ИНВЕНТАРЬ ===
function addToInventory(id, count) {
  const existing = state.inventory.find(i => i.id === id);
  if (existing) {
    existing.count += count;
  } else {
    state.inventory.push({ id, count, equipped: false });
  }
}

function renderInventory() {
  const slotIds = ['mat', 'toy1', 'toy2', 'decor1', 'decor2', 'decor3'];
  slotIds.forEach(sid => {
    const el = $(`slot-${sid}`);
    if (!el) return;
    const itemId = state.slots[sid];
    el.className = `slot ${itemId ? 'filled' : ''}`;
    el.textContent = itemId ? '✅' : '';
  });

  const listEl = $('inv-list');
  if (!listEl) return;
  
  listEl.innerHTML = '';
  if (state.inventory.length === 0) {
    listEl.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Пусто. Купите что-нибудь в магазине!</p>';
    return;
  }
  
  state.inventory.forEach(inv => {
    const item = ITEMS_DB.furniture.find(i => i.id === inv.id);
    if (!item) return;
    
    const div = document.createElement('div');
    div.className = 'inv-item';
    const isEquipped = Object.values(state.slots).includes(inv.id);
    
    div.innerHTML = `
      <div class="inv-info">
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
  
  let slotKey = null;
  
  if (item.slot === 'mat') {
    if (!state.slots.mat) slotKey = 'mat';
  } else if (item.slot === 'toy') {
    if (!state.slots.toy1) slotKey = 'toy1';
    else if (!state.slots.toy2) slotKey = 'toy2';
  } else if (item.slot === 'decor') {
    if (!state.slots.decor1) slotKey = 'decor1';
    else if (!state.slots.decor2) slotKey = 'decor2';
    else if (!state.slots.decor3) slotKey = 'decor3';
  }
  
  if (!slotKey) {
    alert('Нет свободных слотов для этого предмета!');
    return;
  }
  
  // Снять если уже надето
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
  if (!list) return;
  
  list.innerHTML = `
    <li><span>Всего кликов</span> <b>${fmt(state.stats.clicks)}</b></li>
    <li><span>Всего заработано</span> <b>${fmt(state.stats.earned)} 🦴</b></li>
    <li><span>Кейсов открыто</span> <b>${state.stats.cases}</b></li>
    <li><span>Сила клика (база)</span> <b>${state.clickBase}</b></li>
    <li><span>Постоянный множитель</span> <b>x${state.permMult.toFixed(2)}</b></li>
    <li><span>Множитель мебели</span> <b>x${getFurnitureMult().toFixed(2)}</b></li>
  `;
}

// === ИНИЦИАЛИЗАЦИЯ ===
function initGame() {
  console.log('Initializing game...');
  
  // VK Bridge
  if (window.vkBridge) {
    window.vkBridge.send('VKWebAppInit').catch(() => {});
  }
  
  // Загрузка
  load();
  updateUI();
  
  // Клик по мопсу
  const clickZone = $('click-zone');
  if (clickZone) {
    clickZone.addEventListener('click', (e) => {
      e.preventDefault();
      const val = getClickValue();
      state.kibble += val;
      state.stats.clicks++;
      state.stats.earned += val;
      
      // Плавающий текст
      const float = document.createElement('div');
      float.className = 'float-text';
      float.textContent = `+${fmt(val)}`;
      const rect = clickZone.getBoundingClientRect();
      float.style.left = `${e.clientX - rect.left - 20}px`;
      float.style.top = `${e.clientY - rect.top - 20}px`;
      
      const floatContainer = $('float-texts');
      if (floatContainer) {
        floatContainer.appendChild(float);
        setTimeout(() => float.remove(), 800);
      }
      
      updateUI();
      save();
    });
    
    // Предотвращение двойного тапа на мобильных
    clickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      clickZone.click();
    }, { passive: false });
  }
  
  // Кнопки меню
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = `modal-${btn.dataset.modal}`;
      showModal(modalId);
    });
  });
  
  // Закрытие модалок
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });
  
  const overlay = $('overlay');
  if (overlay) {
    overlay.addEventListener('click', closeModal);
  }
  
  // Табы магазина
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      renderShop(tab.dataset.tab);
    });
  });
  
  // Покупки в магазине
  const shopContent = $('shop-content');
  if (shopContent) {
    shopContent.addEventListener('click', (e) => {
      const btn = e.target.closest('.buy-btn');
      if (btn && !btn.disabled) {
        buyItem(btn.dataset.id, btn.dataset.type);
      }
    });
  }
  
  // Инвентарь
  const invList = $('inv-list');
  if (invList) {
    invList.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.classList.contains('unequip')) {
        unequipItem(btn.dataset.id);
      } else {
        equipItem(btn.dataset.id);
      }
    });
  }
  
  // Таймер буста
  setInterval(() => {
    if (state.boost.end > Date.now()) {
      updateUI();
    }
  }, 1000);
  
  // Автосохранение
  setInterval(save, 10000);
  
  console.log('Game initialized!');
}

// Запуск когда страница загрузится
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
