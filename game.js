// --- DADOS E VARIÁVEIS DO JOGO ---

const BASE_STATS = {
    'Guerreiro': { hp: 150, atk: 20, def: 10, sprite: '🛡️' },
    'Mago': { hp: 100, atk: 25, def: 5, sprite: '🔮' },
    'Arqueiro': { hp: 110, atk: 22, def: 7, sprite: '🏹' }
};

let player;
let currentEnemy;
let isAnimating = false;

// --- CLASSE JOGADOR ---
class Player {
    constructor(name, className) {
        const stats = BASE_STATS[className];
        
        this.name = name;
        this.class = className;
        this.lvl = 1;
        this.hp = stats.hp;
        this.hpMax = stats.hp;
        this.attack = stats.atk;
        this.defense = stats.def;
        this.exp = 0;
        this.expToNextLvl = 100;
        this.gold = 50;
        this.potions = 2;
        this.sprite = stats.sprite;
    }

    // SISTEMA DE LVL: Lógica para subir de nível
    levelUp() {
        this.lvl++;
        this.exp -= this.expToNextLvl;
        this.expToNextLvl = Math.floor(this.expToNextLvl * 1.5);
        
        // Aumenta stats de acordo com a classe
        const hpBonus = (this.class === 'Guerreiro') ? 35 : (this.class === 'Mago' ? 15 : 20);
        const atkBonus = (this.class === 'Mago') ? 8 : 5;
        const defBonus = (this.class === 'Guerreiro') ? 4 : 2;

        this.hpMax += hpBonus;
        this.hp = this.hpMax;
        this.attack += atkBonus;
        this.defense += defBonus;
        logMessage(`** LVL UP! ** Você alcançou o Nível ${this.lvl}! Seu poder aumentou!`);
    }
}

// --- CLASSE INIMIGO ---
class Enemy {
    constructor(lvl) {
        const names = ["Goblin Astuto", "Slime Venenoso", "Orc Selvagem", "Esqueleto Faminto"];
        this.name = names[Math.floor(Math.random() * names.length)];
        this.lvl = lvl;
        this.hp = 30 + (lvl * 18);
        this.attack = 10 + (lvl * 4);
        this.defense = 3 + lvl;
        this.expReward = 60 + (lvl * 20);
        this.goldReward = Math.floor(Math.random() * (15 * lvl)) + 10;
        this.sprite = '👹'; 
    }
}

// --- FUNÇÕES DE INTERFACE E ANIMAÇÃO ---

function logMessage(message) {
    const logBox = document.getElementById('log-box');
    logBox.innerHTML += `<p>${message}</p>`;
    logBox.scrollTop = logBox.scrollHeight;
}

// Função para disparar animações CSS
function triggerAnimation(targetElementId, animationClass) {
    const el = document.getElementById(targetElementId);
    el.classList.add(animationClass);
    setTimeout(() => {
        el.classList.remove(animationClass);
        isAnimating = false;
    }, 400); 
}

function updateStats() {
    if (!player) return;

    // Atualiza os stats do herói (texto)
    document.getElementById('player-name').textContent = player.name;
    document.getElementById('player-class').textContent = player.class;
    document.getElementById('player-lvl').textContent = player.lvl;
    document.getElementById('player-atk').textContent = player.attack;
    document.getElementById('player-def').textContent = player.defense;
    document.getElementById('player-exp').textContent = player.exp;
    document.getElementById('player-exp-next').textContent = player.expToNextLvl;
    document.getElementById('player-gold').textContent = player.gold;
    document.getElementById('player-potions').textContent = player.potions;

    // Atualização da barra de HP do Herói
    const heroHpPercent = (player.hp / player.hpMax) * 100;
    document.getElementById('hero-hp-bar').style.width = heroHpPercent + '%';
    document.getElementById('player-hp').textContent = Math.max(0, player.hp);
    document.getElementById('player-hp-max').textContent = player.hpMax;
    document.getElementById('hero-name-display').textContent = player.name;
    document.getElementById('hero-sprite').textContent = player.sprite;


    if (currentEnemy) {
        // Atualização da barra de HP do Inimigo
        const initialEnemyHp = new Enemy(currentEnemy.lvl).hp;
        const enemyHpPercent = (currentEnemy.hp / initialEnemyHp) * 100;
        document.getElementById('enemy-hp-bar').style.width = enemyHpPercent + '%';
        document.getElementById('enemy-name-display').textContent = currentEnemy.name;
        document.getElementById('enemy-sprite').textContent = currentEnemy.sprite;
    } else {
        // Reseta o display do inimigo quando não há batalha
        document.getElementById('enemy-name-display').textContent = '---';
        document.getElementById('enemy-sprite').textContent = '---';
        document.getElementById('enemy-hp-bar').style.width = '100%';
    }
}

function updateActions(buttonsHtml) {
    document.getElementById('action-area').innerHTML = buttonsHtml;
}

// --- FUNÇÕES DE FLUXO E BATALHA ---

function showClassSelection() {
    const name = document.getElementById('name-input').value.trim();
    if (!name) {
        logMessage("Por favor, digite o nome do seu herói primeiro!");
        return;
    }

    document.getElementById('action-area').innerHTML = `
        <p>Escolha a sua vocação, ${name}:</p>
        <button onclick="startGame('${name}', 'Guerreiro')">🛡️ Guerreiro (Alta Defesa)</button>
        <button onclick="startGame('${name}', 'Mago')">🔮 Mago (Alto Ataque)</button>
        <button onclick="startGame('${name}', 'Arqueiro')">🏹 Arqueiro (Crítico)</button>
    `;
}

function startGame(name, className) {
    player = new Player(name, className);
    document.getElementById('battle-display').style.display = 'flex'; // Mostra a arena
    logMessage(`O ${className} ${name} inicia a aventura!`);
    updateStats();
    showMainMenu();
}

function showMainMenu() {
    currentEnemy = null;
    updateStats();
    const buttons = `
        <button onclick="hunt()">1. Caçar em Campo Aberto</button>
        <button onclick="openShop()">2. Visitar o Mercador</button>
    `;
    updateActions(buttons);
}

function hunt() {
    const enemyLvl = Math.max(1, player.lvl + Math.floor(Math.random() * 3) - 1);
    currentEnemy = new Enemy(enemyLvl);
    logMessage(`!!! ${currentEnemy.sprite} Um ${currentEnemy.name} (LVL ${currentEnemy.lvl}) apareceu! !!!`);
    showBattleMenu();
}

function showBattleMenu() {
    updateStats();
    if (isAnimating) return; // Impede cliques durante animação
    
    const buttons = `
        <button onclick="playerAttack('normal')">1. Ataque Básico</button>
        <button onclick="playerAttack('special')">2. Habilidade de Classe</button>
        <button onclick="usePotion()">3. Usar Poção (${player.potions})</button>
    `;
    updateActions(buttons);
}

function playerAttack(type) {
    if (!currentEnemy || isAnimating) return;
    isAnimating = true;

    // ANIMAÇÃO DE ATAQUE
    triggerAnimation('hero-sprite', 'attacking');

    let damage = 0;
    
    if (type === 'normal') {
        damage = player.attack + Math.floor(Math.random() * 8);
        logMessage(`${player.class} usa Ataque Básico.`);
    } else if (type === 'special') {
        
        let bonus = 0;
        let msg = "";
        
        if (player.class === 'Guerreiro') { bonus = 15; msg = "Guerreiro usa Ataque Pesado!"; }
        if (player.class === 'Mago') { bonus = 25; msg = "Mago lança Bola de Fogo!"; }
        if (player.class === 'Arqueiro') { 
            // Chance de Crítico
            if (Math.random() < 0.25) { 
                bonus = player.attack * 0.5; // Dano extra por crítico
                msg = "🏹 CRÍTICO! Arqueiro acerta um ponto vital!";
            } else {
                bonus = 10;
                msg = "Arqueiro dispara Flecha Rápida.";
            }
        }
        
        damage = player.attack + bonus + Math.floor(Math.random() * 5);
        logMessage(msg);
    }
    
    // Aplicação do Dano
    const finalDamage = Math.max(0, Math.floor(damage - currentEnemy.defense));
    currentEnemy.hp -= finalDamage;
    logMessage(`Causou ${finalDamage} de dano ao ${currentEnemy.name}!`);
    
    // ANIMAÇÃO DE DANO NO INIMIGO
    triggerAnimation('enemy-sprite', 'receiving-damage'); 

    updateStats(); 

    if (currentEnemy.hp <= 0) {
        setTimeout(victory, 800);
    } else {
        setTimeout(enemyTurn, 800);
    }
}

function usePotion() {
    if (isAnimating) return;
    isAnimating = true;

    if (player.potions > 0) {
        const heal = Math.floor(player.hpMax * 0.3) + 20; // Cura baseada no HP máximo
        player.hp = Math.min(player.hpMax, player.hp + heal);
        player.potions--;
        logMessage(`[CURA] Você usou uma Poção e recuperou ${heal} HP.`);
        updateStats();
        setTimeout(enemyTurn, 500); // Passa o turno para o inimigo após curar
    } else {
        logMessage("[ATENÇÃO] Você não tem poções restantes!");
        isAnimating = false; // Permite o próximo clique
        showBattleMenu(); 
    }
}

function enemyTurn() {
    if (player.hp <= 0) return gameOver();

    // ANIMAÇÃO DE ATAQUE DO INIMIGO
    const enemySprite = document.getElementById('enemy-sprite');
    // Usa a mesma animação de ataque, mas inverte a direção (reverse)
    enemySprite.style.animation = 'attack-move 0.3s ease-in-out reverse'; 
    setTimeout(() => enemySprite.style.animation = '', 300);

    const damage = currentEnemy.attack + Math.floor(Math.random() * 5);
    const finalDamage = Math.max(0, Math.floor(damage - player.defense));
    player.hp -= finalDamage;
    logMessage(`${currentEnemy.name} atacou, causando ${finalDamage} de dano!`);

    // ANIMAÇÃO DE DANO NO HERÓI
    triggerAnimation('hero-sprite', 'receiving-damage');

    updateStats();
    
    if (player.hp <= 0) {
        setTimeout(gameOver, 500);
    } else {
        setTimeout(showBattleMenu, 800);
    }
}

// SISTEMA DE LOOT E VITÓRIA
function victory() {
    logMessage(`*** VITÓRIA! ${currentEnemy.name} derrotado! ***`);
    
    // Loot System
    player.exp += currentEnemy.expReward;
    player.gold += currentEnemy.goldReward;
    logMessage(`Ganhou ${currentEnemy.expReward} EXP e ${currentEnemy.goldReward} Ouro.`);
    
    // Chance para Poção Loot (40% de chance)
    if (Math.random() < 0.4) {
        player.potions++;
        logMessage(`Você encontrou 1 Poção em meio aos espólios!`);
    }

    if (player.exp >= player.expToNextLvl) {
        player.levelUp();
    }
    
    currentEnemy = null; // Limpa o inimigo
    updateStats(); 
    isAnimating = false;
    setTimeout(showMainMenu, 3000); // Volta ao menu principal após 3s
}

function gameOver() {
    logMessage(`*** FIM DE JOGO! Você foi derrotado no Nível ${player.lvl}. ***`);
    document.getElementById('battle-display').style.display = 'none'; // Esconde a arena
    updateActions(`<button onclick="location.reload()">Recomeçar Jornada</button>`);
    isAnimating = false;
}

// --- SISTEMA DE LOJA (MERCADOR) ---
function openShop() {
    const potionPrice = 30;
    logMessage(`[MERCADOR] Poção Pequena de Cura custa ${potionPrice} Ouro. Você tem ${player.gold} Ouro.`);
    
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
        logMessage(`[COMPRA] Poção adquirida! Ouro restante: ${player.gold}.`);
    } else {
        logMessage(`[ATENÇÃO] Ouro insuficiente! Você precisa de ${price} Ouro.`);
    }
    updateStats();
    // Mantém o menu da loja ativo para comprar mais
    openShop();
}