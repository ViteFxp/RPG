// --- VARIÁVEIS GLOBAIS ---
let player;
let currentEnemy;

// --- CLASSE JOGADOR (Em JavaScript) ---
class Player {
    constructor(name) {
        this.name = name;
        this.lvl = 1;
        this.hp = 120;
        this.hpMax = 120;
        this.attack = 18;
        this.defense = 5;
        this.exp = 0;
        this.expToNextLvl = 100;
        this.gold = 50;
        this.potions = 2;
    }

    // Lógica para subir de nível
    levelUp() {
        this.lvl++;
        this.exp -= this.expToNextLvl;
        this.expToNextLvl = Math.floor(this.expToNextLvl * 1.5);
        this.hpMax += 25;
        this.hp = this.hpMax;
        this.attack += 6;
        this.defense += 3;
        logMessage(`** LVL UP! ** Você alcançou o Nível ${this.lvl}!`);
    }
}

// --- CLASSE INIMIGO ---
class Enemy {
    constructor(lvl) {
        const names = ["Goblin", "Slime", "Orc Selvagem", "Serpente"];
        this.name = names[Math.floor(Math.random() * names.length)];
        this.lvl = lvl;
        this.hp = 30 + (lvl * 18);
        this.attack = 10 + (lvl * 4);
        this.defense = 3 + lvl;
        this.expReward = 60 + (lvl * 20);
        this.goldReward = Math.floor(Math.random() * (15 * lvl - 5 * lvl + 1)) + 5 * lvl;
    }
}

// --- FUNÇÕES DE INTERFACE ---

function logMessage(message) {
    const logBox = document.getElementById('log-box');
    logBox.innerHTML += `<p>${message}</p>`;
    // Rolagem automática para o final
    logBox.scrollTop = logBox.scrollHeight;
}

function updateStats() {
    if (player) {
        document.getElementById('player-name').textContent = player.name;
        document.getElementById('player-lvl').textContent = player.lvl;
        document.getElementById('player-hp').textContent = player.hp;
        document.getElementById('player-hp-max').textContent = player.hpMax;
        document.getElementById('player-exp').textContent = player.exp;
        document.getElementById('player-exp-next').textContent = player.expToNextLvl;
        document.getElementById('player-gold').textContent = player.gold;
        document.getElementById('player-potions').textContent = player.potions;
    }

    if (currentEnemy) {
        document.getElementById('enemy-name').textContent = currentEnemy.name;
        document.getElementById('enemy-hp').textContent = `${currentEnemy.hp} / ${new Enemy(currentEnemy.lvl).hp}`; // HP inicial do inimigo (aproximado)
    } else {
        document.getElementById('enemy-name').textContent = '---';
        document.getElementById('enemy-hp').textContent = '---';
    }
}

function updateActions(buttonsHtml) {
    document.getElementById('action-area').innerHTML = buttonsHtml;
}

// --- FUNÇÕES DO JOGO ---

function startGame() {
    const name = document.getElementById('name-input').value.trim();
    if (name === "") {
        alert("Por favor, digite o nome do seu herói!");
        return;
    }
    
    player = new Player(name);
    logMessage(`Aventureiro ${name}, sua jornada começa agora!`);
    updateStats();
    showMainMenu();
}

function showMainMenu() {
    currentEnemy = null;
    updateStats();
    const buttons = `
        <button onclick="hunt()">1. Caçar (Encontrar um monstro)</button>
        <button onclick="openShop()">2. Visitar a Loja</button>
        <button onclick="logMessage('Seus stats foram atualizados.'); updateStats()">3. Ver Stats</button>
    `;
    updateActions(buttons);
}

function hunt() {
    const enemyLvl = Math.max(1, player.lvl + Math.floor(Math.random() * 3) - 1);
    currentEnemy = new Enemy(enemyLvl);
    logMessage(`!!! Um ${currentEnemy.name} (LVL ${currentEnemy.lvl}) apareceu! !!!`);
    showBattleMenu();
}

function showBattleMenu() {
    updateStats();
    const buttons = `
        <button onclick="attack('normal')">1. Ataque Normal</button>
        <button onclick="attack('powerful')">2. Ataque Poderoso</button>
        <button onclick="usePotion()">3. Usar Poção (${player.potions})</button>
    `;
    updateActions(buttons);
}

function attack(type) {
    if (!currentEnemy) return;

    let damage = 0;
    if (type === 'normal') {
        damage = player.attack + Math.floor(Math.random() * 10) - 5;
        logMessage("Você ataca com precisão.");
    } else if (type === 'powerful') {
        if (Math.random() < 0.2) {
            logMessage("Seu ataque poderoso falhou!");
            enemyTurn();
            return;
        }
        damage = player.attack + Math.floor(Math.random() * 10) + 5;
        logMessage("Ataque Devastador!");
    }

    const finalDamage = Math.max(0, damage - currentEnemy.defense);
    currentEnemy.hp -= finalDamage;
    logMessage(`Você causou ${finalDamage} de dano ao ${currentEnemy.name}!`);

    if (currentEnemy.hp <= 0) {
        victory();
    } else {
        enemyTurn();
    }
}

function usePotion() {
    if (player.potions > 0) {
        const heal = Math.floor(Math.random() * 16) + 25; // 25 a 40
        player.hp = Math.min(player.hpMax, player.hp + heal);
        player.potions--;
        logMessage(`[CURA] Você usou uma Poção e recuperou ${heal} HP.`);
        // A cura gasta o turno
        enemyTurn(); 
    } else {
        logMessage("[ATENÇÃO] Você não tem poções restantes!");
        showBattleMenu(); // Volta ao menu de batalha
    }
}

function enemyTurn() {
    if (player.hp <= 0) return gameOver();

    const damage = currentEnemy.attack + Math.floor(Math.random() * 6) - 3;
    const finalDamage = Math.max(0, damage - player.defense);
    player.hp -= finalDamage;
    logMessage(`${currentEnemy.name} atacou, causando ${finalDamage} de dano!`);

    if (player.hp <= 0) {
        gameOver();
    } else {
        // Se o herói ainda estiver vivo, volta ao menu de batalha
        showBattleMenu();
    }
    updateStats();
}

function victory() {
    logMessage(`*** VITÓRIA! ${currentEnemy.name} derrotado! ***`);
    player.exp += currentEnemy.expReward;
    player.gold += currentEnemy.goldReward;
    logMessage(`Ganhou ${currentEnemy.expReward} EXP e ${currentEnemy.goldReward} Ouro.`);

    if (player.exp >= player.expToNextLvl) {
        player.levelUp();
    }
    
    setTimeout(showMainMenu, 3000); // Volta ao menu principal após 3 segundos
}

function gameOver() {
    logMessage(`*** FIM DE JOGO! Você foi derrotado no Nível ${player.lvl}. ***`);
    updateActions(`<button onclick="location.reload()">Recomeçar</button>`);
}

function openShop() {
    const potionPrice = 30;
    logMessage("Bem-vindo à Loja! Poção Pequena de Cura custa 30 Ouro.");
    
    const buttons = `
        <button onclick="buyItem('potion', ${potionPrice})">Comprar Poção (${potionPrice} Ouro)</button>
        <button onclick="showMainMenu()">Sair da Loja</button>
    `;
    updateActions(buttons);
}

function buyItem(item, price) {
    if (player.gold >= price) {
        player.gold -= price;
        player.potions++;
        logMessage(`[COMPRA] Poção adquirida. Ouro restante: ${player.gold}.`);
    } else {
        logMessage(`[ATENÇÃO] Ouro insuficiente! Precisa de ${price} Ouro.`);
    }
    updateStats();
}