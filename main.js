// Ждем, пока загрузится VK Bridge
window.onload = function() {
    // Инициализация ВК
    if (window.vkBridge) {
        window.vkBridge.send("VKWebAppInit");
    }
    
    startGame();
};

let kibble = 0;
let clickPower = 1;
let upgradeCost = 15;

const counterEl = document.getElementById('kibble-counter');
const clickBtn = document.getElementById('click-btn');
const upgradeBtn = document.getElementById('upgrade-btn');

function startGame() {
    // Загружаем сохранение (если есть)
    const savedData = localStorage.getItem('pugSave');
    if (savedData) {
        const data = JSON.parse(savedData);
        kibble = data.kibble;
        clickPower = data.clickPower;
        upgradeCost = data.upgradeCost;
    }
    
    updateUI();
}

// Обработка клика по мопсу
clickBtn.addEventListener('click', () => {
    kibble += clickPower;
    updateUI();
    saveGame();
});

// Обработка покупки улучшения
upgradeBtn.addEventListener('click', () => {
    if (kibble >= upgradeCost) {
        kibble -= upgradeCost;
        clickPower++; // Увеличиваем силу клика
        upgradeCost = Math.floor(upgradeCost * 1.5); // Увеличиваем цену
        updateUI();
        saveGame();
    }
});

// Обновление экрана
function updateUI() {
    counterEl.textContent = `${kibble} 🦴`;
    upgradeBtn.textContent = `Купить миску (Цена: ${upgradeCost} 🦴)`;
    
    // Если денег не хватает, делаем кнопку серой
    if (kibble < upgradeCost) {
        upgradeBtn.disabled = true;
    } else {
        upgradeBtn.disabled = false;
    }
}

// Сохранение прогресса в браузер
function saveGame() {
    const data = {
        kibble: kibble,
        clickPower: clickPower,
        upgradeCost: upgradeCost
    };
    localStorage.setItem('pugSave', JSON.stringify(data));
}
