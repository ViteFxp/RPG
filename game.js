// --- DADOS E VARIÁVEIS DO JOGO ---

const ZONAS = [
    { nome: "FLORESTA PROIBIDA", lvlMin: 1, inimigos: ["GOBLIN", "SLIME", "LOBO SELVAGEM"], boss: { nome: "REI GOBLIN", sprite: "👑" }, sprite: "🌳" },
    { nome: "CAVERNAS SOMBRIAS", lvlMin: 5, inimigos: ["MORCEGO GIGANTE", "ARANHA VENENOSA", "ESQUELETO"], boss: { nome: "O ABOMINÁVEL", sprite: "💀" }, sprite: "⛰️" },
    { nome: "RUÍNAS ESQUECIDAS", lvlMin: 10, inimigos: ["FANTASMA", "GOLEM DE PEDRA", "MÚMIA"], boss: { nome: "LICH ANTIGO", sprite: "👻" }, sprite: "🏛️" },
    { nome: "MONTANHAS VULCÂNICAS", lvlMin: 15, inimigos: ["SALAMANDRA", "ELEMENTAR DE FOGO", "DRAGÃOZINHO"], boss: { nome: "DRAKE DE LAVA", sprite: "🐉" }, sprite: "🌋" },
    { nome: "CASTELO DO CAOS", lvlMin: 20, inimigos: ["GUARDA NEGRO", "DEMÔNIO MENOR", "VAMPIRO"], boss: { nome: "O TIRANO SUPREMO", sprite: "😈" }, sprite: "🏰" }
];

const BASE_STATS = {
    'GUERREIRO': { hp: 150, atk: 20, def: 10, sprite: '🛡️' },
    'MAGO': { hp: 100, atk: 25, def: 5, sprite: '🔮' },
    'ARQUEIRO': { hp: 110, atk: 22, def: 7, sprite: '🏹' }
};

let player;
let currentEnemy;
let isAnimating = false;
let zonaAtual = 0;

// --- CLASSE JOGADOR e INIMIGO (Mantidas) ---
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
        this.statPoints = 0;
    }

    levelUp() {
        this.lvl++;
        this.exp -= this.expToNextLvl;
        this.expToNextLvl = Math.floor(this.expToNextLvl * 1.5);
        this.statPoints += 5;
        this.hpMax += 10;
        this.hp = this.hpMax;
        logMessage(`[LVL UP] VOCÊ ALCANÇOU O NÍVEL ${this.lvl}! PONTOS GANHOS.`);
        
        // Se subir de nível no menu principal, vai para a tela de stats
        if (!currentEnemy) {
            changeScreen('stats'); 
        }
    }
}

class Enemy {
    constructor(lvl, isBoss = false) {
        const zona = ZONAS[zonaAtual];
        let name, hpBase, atkBase, sprite;

        if (isBoss) {
            name = zona.boss.nome;
            hpBase = 50 + (lvl * 30);
            atkBase = 15 + (lvl * 8);
            sprite = zona.boss.sprite;
        } else {
            name = zona.inimigos[Math.floor(Math.random() * zona.inimigos.length)];
            hpBase = 30 + (lvl * 18);
            atkBase = 10 + (lvl * 4);
            sprite = '👹';
        }

        this.name = name;
        this.lvl = lvl;
        this.hp = hpBase;
        this.attack = atkBase;
        this.defense = 3 + lvl;
        this.expReward = (isBoss ? 200 : 60) + (lvl * (isBoss ? 40 : 20));
        this.goldReward = Math.floor(Math.random() * (isBoss ? 50 : 15) * lvl) + 10;
        this.isBoss = isBoss;
        this.sprite = sprite;
        this.initialHp = hpBase;
    }
}

// --- GERENCIAMENTO DE TELAS ---

function changeScreen(screenId) {
    const screens = document.querySelectorAll('.game-screen');
    screens.forEach(screen => {
        screen.classList.remove('active-screen');
    });

    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) {
        targetScreen.classList.add('active-screen');
    }
}

// --- FUNÇÕES DE INTERFACE ---

function updateStats() {
    if (!player) return;

    // --- Atualização do Status Box (Geral) ---
    const statsHtml = `
        <p>ZONA: ${ZONAS[zonaAtual].sprite} ${ZONAS[zonaAtual].nome} | NÍVEL: ${player.lvl} (PONTOS: ${player.statPoints})</p>
        <p>NOME: ${player.name} | CLASSE: ${player.class} | OURO: ${player.gold} | POÇÕES: ${player.potions}</p>
        <p>HP: ${Math.max(0, player.hp)}/${player.hpMax} | ATK: ${player.attack} | DEF: ${player.defense} | EXP: ${player.exp}/${player.expToNextLvl}</p>
    `;
    
    // Atualiza o painel geral
    document.getElementById('player-stats').innerHTML = `<h2>STATUS GERAL</h2>${statsHtml}`;
    // Atualiza o painel de resumo na tela de distribuição/loja
    document.getElementById('player-stats-summary').innerHTML = statsHtml;
    document.getElementById('player-gold-shop').textContent = player.gold;
    
    // --- Atualização do HUD de Batalha ---
    const heroHpPercent = (player.hp / player.hpMax) * 100;
    document.getElementById('hero-hp-bar').style.width = heroHpPercent + '%';
    document.getElementById('hero-name-display').textContent = player.name;
    document.getElementById('hero-sprite').textContent = player.sprite;
    document.getElementById('player-lvl-hud').textContent = player.lvl;
    document.getElementById('player-hp-hud').textContent = Math.max(0, player.hp);
    document.getElementById('player-hp-max-hud').textContent = player.hpMax;

    const hudEnemy = document.getElementById('hud-enemy');
    const enemyModel = document.getElementById('enemy-model');
    
    if (currentEnemy) {
        hudEnemy.classList.remove('hidden-enemy-hud');
        enemyModel.classList.remove('hidden-enemy');
        enemyModel.classList.add('monster-appeared'); 

        const enemyHpPercent = (currentEnemy.hp / currentEnemy.initialHp) * 100;
        document.getElementById('enemy-hp-bar').style.width = enemyHpPercent + '%';
        document.getElementById('enemy-name-display').textContent = currentEnemy.name + ` (Lvl ${currentEnemy.lvl})`;
        document.getElementById('enemy-sprite').textContent = currentEnemy.sprite;
        
        document.getElementById('enemy-hp-detail').textContent = Math.max(0, currentEnemy.hp);
        document.getElementById('enemy-atk-detail').textContent = currentEnemy.attack;
        document.getElementById('enemy-def-detail').textContent = currentEnemy.defense;

    } else {
        hudEnemy.classList.add('hidden-enemy-hud');
        enemyModel.classList.add('hidden-enemy');
        enemyModel.classList.remove('monster-appeared');
    }
}

function updateActions(buttonsHtml) {
    document.getElementById('action-area').innerHTML = buttonsHtml;
}

function logMessage(message) {
    const logBox = document.getElementById('log-box');
    logBox.innerHTML += `<p>${message}</p>`;
    logBox.scrollTop = logBox.scrollHeight;
}

function triggerAnimation(targetElementId, animationClass) {
    const el = document.getElementById(targetElementId);
    el.classList.add(animationClass);
    setTimeout(() => {
        el.classList.remove(animationClass);
        isAnimating = false;
    }, 400); 
}


// --- FUNÇÕES DE FLUXO DO JOGO ---

function showClassSelection() {
    const name = document.getElementById('name-input').value.trim();
    if (!name) {
        logMessage("[ERRO] DIGITE SEU NOME PARA CONTINUAR.");
        return;
    }
    
    const initialArea = document.getElementById('initial-area');
    initialArea.innerHTML = `
        <p class="ascii-font">ESCOLHA SUA CLASSE, ${name}:</p>
        <button onclick="startGame('${name}', 'GUERREIRO')">🛡️ GUERREIRO (FÚRIA DO MACHADO)</button>
        <button onclick="startGame('${name}', 'MAGO')">🔮 MAGO (EXPLOSÃO ARCANA)</button>
        <button onclick="startGame('${name}', 'ARQUEIRO')">🏹 ARQUEIRO (TIRO PRECISO)</button>
    `;
}


function startGame(name, className) {
    player = new Player(name, className);
    document.getElementById('battle-display').style.display = 'flex';
    logMessage(`[INÍCIO] O ${className} ${name} INICIA A AVENTURA!`);
    updateStats();
    changeScreen('main'); // Vai para a tela principal
    showMainMenu();
}

function showStatDistribution() {
    changeScreen('stats');
    logMessage(`[LVL UP] VOCÊ TEM ${player.statPoints} PONTOS PARA DISTRIBUIR!`);
    
    const currentHpDisplay = player.hpMax; 
    
    const buttons = `
        <p>PONTOS RESTANTES: <span style="color:#ff0000">${player.statPoints}</span></p>
        <button class="btn-stat" onclick="distributePoint('HP', 10)">+10 HP MÁX (ATUAL: ${currentHpDisplay})</button>
        <button class="btn-stat" onclick="distributePoint('ATK', 3)">+3 ATK (ATUAL: ${player.attack})</button>
        <button class="btn-stat" onclick="distributePoint('DEF', 2)">+2 DEF (ATUAL: ${player.defense})</button>
        <br>
        <button onclick="showMainMenu()" ${player.statPoints > 0 ? 'disabled' : ''}>CONTINUAR JORNADA</button>
    `;
    document.getElementById('stats-distribution-area').innerHTML = buttons;
    updateStats();
}

function distributePoint(stat, amount) {
    if (player.statPoints <= 0) {
        logMessage("[ERRO] SEM PONTOS.");
        return;
    }
    
    player.statPoints--;
    
    if (stat === 'HP') {
        player.hpMax += amount;
        player.hp += amount;
    } else if (stat === 'ATK') {
        player.attack += amount;
    } else if (stat === 'DEF') {
        player.defense += amount;
    }

    logMessage(`[STATUS] +${amount} EM ${stat}!`);
    updateStats();
    showStatDistribution();
}

function showMainMenu() {
    changeScreen('main'); // Vai para a tela principal
    if (player.statPoints > 0) {
        showStatDistribution();
        return;
    }
    
    currentEnemy = null;
    updateStats();
    
    const zona = ZONAS[zonaAtual];

    let advanceButton = "";
    if (ZONAS[zonaAtual + 1] && player.lvl >= ZONAS[zonaAtual + 1].lvlMin) {
        advanceButton = `<button onclick="advanceZone()" class="btn-advance">➡️ AVANÇAR PARA ${ZONAS[zonaAtual + 1].nome}</button>`;
    }

    const buttons = `
        <p>AÇÃO NA ${zona.nome} ${zona.sprite}:</p>
        <button onclick="hunt(false)">1. EXPLORAR (MONSTRO COMUM)</button>
        <button onclick="hunt(true)">2. DESAFIAR ${zona.boss.nome} (BOSS)</button>
        ${advanceButton}
        <button onclick="openShop()">3. VISITAR O MERCADOR</button>
    `;
    updateActions(buttons);
}

function advanceZone() {
    if (ZONAS[zonaAtual + 1] && player.lvl >= ZONAS[zonaAtual + 1].lvlMin) {
        zonaAtual++;
        logMessage(`[ZONA] VOCÊ ENTROU NA ${ZONAS[zonaAtual].nome}!`);
        showMainMenu();
    } else {
        logMessage("[ZONA] NÍVEL INSUFICIENTE PARA AVANÇAR.");
        showMainMenu();
    }
}

function hunt(isBoss) {
    const zona = ZONAS[zonaAtual];
    let lvlMonstro = zona.lvlMin + Math.floor(Math.random() * 3);
    
    if (isBoss) {
        lvlMonstro = Math.max(player.lvl, zona.lvlMin) + 2; 
        currentEnemy = new Enemy(lvlMonstro, true);
        logMessage(`[BATALHA] CHEFE: ${currentEnemy.sprite} ${currentEnemy.name} APARECEU!`);
    } else {
        currentEnemy = new Enemy(lvlMonstro, false);
        logMessage(`[BATALHA] ${currentEnemy.sprite} ${currentEnemy.name} (LVL ${currentEnemy.lvl}) APARECEU!`);
    }
    
    updateStats();
    showBattleMenu();
}

function showBattleMenu() {
    updateStats();
    if (isAnimating) return;
    
    const buttons = `
        <button onclick="playerAttack('normal')">1. ATK BÁSICO</button>
        <button onclick="playerAttack('special')">2. HABILIDADE ÚNICA</button>
        <button onclick="usePotion()">3. USAR POÇÃO (${player.potions})</button>
        <button onclick="attemptToFlee()">4. TENTAR FUGIR</button>
    `;
    updateActions(buttons);
}

// --- FUNÇÕES DE COMBATE ---

function attemptToFlee() {
    if (isAnimating) return;
    isAnimating = true;

    if (currentEnemy.isBoss) {
        logMessage("[FUGA] É IMPOSSÍVEL FUGIR DE UM CHEFE!");
        setTimeout(enemyTurn, 800);
        return;
    }
    
    const fleeChance = 0.6 + ((player.lvl - currentEnemy.lvl) * 0.05);

    if (Math.random() < fleeChance) {
        logMessage("[FUGA] VOCÊ FUGIU COM SUCESSO!");
        currentEnemy = null;
        isAnimating = false;
        setTimeout(showMainMenu, 500);
    } else {
        logMessage("[FUGA] FALHOU! O INIMIGO BLOQUEOU.");
        setTimeout(enemyTurn, 800);
    }
}


function playerAttack(type) {
    if (!currentEnemy || isAnimating) return;
    isAnimating = true;
    triggerAnimation('hero-sprite', 'attacking');

    let damage = 0;
    
    if (type === 'normal') {
        damage = player.attack + Math.floor(Math.random() * 8);
        logMessage(`[AÇÃO] ${player.class} USA ATK BÁSICO.`);
    } else if (type === 'special') {
        
        let msg = "";
        
        if (player.class === 'GUERREIRO') { 
            damage = player.attack + 20 + Math.floor(Math.random() * 10);
            if (Math.random() < 0.1) {
                 damage *= 2;
                 msg = "[HABILIDADE] GUERREIRO ATIVOU FÚRIA! DANO DOBRADO!";
            } else {
                 msg = "[HABILIDADE] GUERREIRO USA FÚRIA DO MACHADO!";
            }
        }
        
        if (player.class === 'MAGO') { 
            damage = player.attack + 30 + Math.floor(Math.random() * 15);
            currentEnemy.defense = Math.max(0, currentEnemy.defense / 2); 
            msg = "[HABILIDADE] MAGO LANÇA EXPLOSÃO ARCANA!";
        }
        
        if (player.class === 'ARQUEIRO') { 
            damage = player.attack + 15 + Math.floor(Math.random() * 10);
            if (Math.random() < 0.4) {
                damage = damage * 1.5;
                msg = "[HABILIDADE] ARQUEIRO ACERTA TIRO PRECISO! (CRÍTICO)";
            } else {
                msg = "[HABILIDADE] ARQUEIRO USA TIRO PRECISO.";
            }
        }
        
        logMessage(msg);
    }
    
    const finalDamage = Math.max(0, Math.floor(damage - currentEnemy.defense));
    currentEnemy.hp -= finalDamage;
    logMessage(`[DANO] CAUSOU ${finalDamage} DE DANO AO ${currentEnemy.name}!`);
    
    if (player.class === 'MAGO' && type === 'special') {
         currentEnemy.defense = new Enemy(currentEnemy.lvl, currentEnemy.isBoss).defense; 
    }

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
        const heal = Math.floor(player.hpMax * 0.3) + 20;
        player.hp = Math.min(player.hpMax, player.hp + heal);
        player.potions--;
        logMessage(`[CURA] VOCÊ USOU POÇÃO E RECUPEROU ${heal} HP.`);
        updateStats();
        setTimeout(enemyTurn, 500);
    } else {
        logMessage("[ERRO] SEM POÇÕES RESTANTES!");
        isAnimating = false;
        showBattleMenu();
    }
}

function enemyTurn() {
    if (player.hp <= 0) return gameOver();

    const enemySprite = document.getElementById('enemy-sprite');
    enemySprite.style.animation = 'attack-move 0.3s ease-in-out reverse'; 
    setTimeout(() => enemySprite.style.animation = '', 300);

    const damage = currentEnemy.attack + Math.floor(Math.random() * 5);
    const finalDamage = Math.max(0, Math.floor(damage - player.defense));
    player.hp -= finalDamage;
    logMessage(`[ATAQUE] ${currentEnemy.name} ATACOU, CAUSANDO ${finalDamage} DE DANO!`);

    triggerAnimation('hero-sprite', 'receiving-damage');

    updateStats();
    
    if (player.hp <= 0) {
        setTimeout(gameOver, 500);
    } else {
        setTimeout(showBattleMenu, 800);
    }
}

function victory() {
    const isBoss = currentEnemy.isBoss;
    const zonaVencida = ZONAS[zonaAtual].nome;

    logMessage(isBoss ? 
        `[VITÓRIA] CHEFE ${currentEnemy.name} DERROTADO!` : 
        `[VITÓRIA] ${currentEnemy.name} DERROTADO!`);
    
    player.exp += currentEnemy.expReward;
    player.gold += currentEnemy.goldReward;
    logMessage(`[LOOT] +${currentEnemy.expReward} EXP, +${currentEnemy.goldReward} OURO.`);
    
    if (Math.random() < (isBoss ? 0.7 : 0.4)) {
        player.potions++;
        logMessage(`[LOOT] ENCONTROU 1 POÇÃO!`);
    }

    if (player.exp >= player.expToNextLvl) {
        player.levelUp();
    }
    
    if (isBoss && ZONAS[zonaAtual + 1]) {
        logMessage(`[PROGRESSO] GUARDIÃO DA ZONA VENCIDO!`);
    } else if (isBoss && !ZONAS[zonaAtual + 1]) {
        logMessage("[FIM DE JOGO] PARABÉNS! JORNADA COMPLETA!");
    }

    currentEnemy = null;
    updateStats(); 
    isAnimating = false;
    setTimeout(showMainMenu, 3000);
}

function gameOver() {
    logMessage(`[FIM DE JOGO] VOCÊ FOI DERROTADO NO NÍVEL ${player.lvl}.`);
    document.getElementById('battle-display').style.display = 'none';
    updateActions(`<button onclick="location.reload()">RECOMEÇAR JORNADA</button>`);
    isAnimating = false;
}

// --- SISTEMA DE LOJA (MERCADOR) ---
function openShop() {
    changeScreen('shop'); // Vai para a tela da loja
    const potionPrice = 30 + (zonaAtual * 5);
    logMessage(`[MERCADOR] POÇÃO PEQUENA CUSTA ${potionPrice} OURO.`);
    
    const buttons = `
        <p>SEU OURO: <span id="player-gold-shop">${player.gold}</span></p>
        <button onclick="buyItem('potion', ${potionPrice})">COMPRAR POÇÃO (${potionPrice} OURO)</button>
    `;
    document.getElementById('shop-area').innerHTML = buttons;
    updateStats();
}

function buyItem(item, price) {
    if (player.gold >= price) {
        player.gold -= price;
        player.potions++;
        logMessage(`[COMPRA] POÇÃO ADQUIRIDA!`);
    } else {
        logMessage(`[ERRO] OURO INSUFICIENTE!`);
    }
    updateStats();
    openShop(); // Recarrega o menu da loja
}