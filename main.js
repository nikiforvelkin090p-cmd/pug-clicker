let kibble = 0;
let clickPower = 1;
let upgradeCost = 15;

const counterEl = document.getElementById('kibble-counter');
const clickBtn = document.getElementById('click-btn');
const upgradeBtn = document.getElementById('upgrade-btn');
const container = document.querySelector('.game-container');

// Ждем полной загрузки страницы и VK Bridge
window.addEventListener('load', () => {
    if (window.vkBridge) {
        window.vkBridge.send('VKWebAppInit').then(() => {
            console.log('VK Mini App готов');
        }).catch(err => console.warn('VK Bridge не инициализирован:', err));
    }
    loadGame();
});

function loadGame() {
    try {
        const saved = localStorage.getItem('pugSave');
        if (saved) {
            const data = JSON.parse(saved);
            kibble = data.kibble || 0;
            clickPower = data.clickPower || 1;
            upgradeCost = data.upgradeCost || 15;
        }
    } catch (e) {
        console.warn('Ошибка загрузки сохранения:', e);
    }
    updateUI();
}

clickBtn.addEventListener('click', (e) => {
    kibble += clickPower;
    showFloatingText(e, `+${clickPower} 🦴`);
    updateUI();
    saveGame();
});

upgradeBtn.addEventListener('click', () => {
    if (kibble >= upgradeCost) {
        kibble -= upgradeCost;
        clickPower++;
        upgradeCost = Math.floor(upgradeCost * 1.5);
        updateUI();
        saveGame();
    }
});

function updateUI() {
    counterEl.textContent = `${kibble} 🦴`;
    upgradeBtn.textContent = `Улучшить клик (Цена: ${upgradeCost} 🦴)`;
    upgradeBtn.disabled = kibble < upgradeCost;
}

function saveGame() {
    try {
        localStorage.setItem('pugSave', JSON.stringify({ kibble, clickPower, upgradeCost }));
    } catch (e) {
        console.warn('Не удалось сохранить:', e);
    }
}

function showFloatingText(e, text) {
    const el = document.createElement('div');
    el.className = 'float-text';
    el.textContent = text;
    
    // Позиционируем рядом с местом клика
    const rect = clickBtn.getBoundingClientRect();
    const x = e.clientX - rect.left - 20;
    const y = e.clientY - rect.top;
    
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    
    container.appendChild(el);
    setTimeout(() => el.remove(), 800);
}
