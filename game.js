// --- DADOS E VARIÁVEIS DO JOGO ---

const ZONAS = [
    { nome: "Floresta Proibida", lvlMin: 1, inimigos: ["Goblin", "Slime", "Lobo Selvagem"], boss: { nome: "Rei Goblin", sprite: "👑" }, sprite: "🌳" },
    { nome: "Cavernas Sombrias", lvlMin: 5, inimigos: ["Morcego Gigante", "Aranha Venenosa", "Esqueleto"], boss: { nome: "O Abominável", sprite: "💀" }, sprite: "⛰️" },
    { nome: "Ruínas Esquecidas", lvlMin: 10, inimigos: ["Fantasma", "Golem de Pedra", "Múmia"], boss: { nome: "Lich Antigo", sprite: "👻" }, sprite: "🏛️" },
    { nome: "Montanhas Vulcânicas", lvlMin: 15, inimigos: ["Salamandra", "Elementar de Fogo", "Dragãozinho"], boss: { nome: "Drake de Lava", sprite: "🐉" }, sprite: "🌋" },
    { nome: "Castelo do Caos", lvlMin: 20, inimigos: ["Guarda Negro", "Demônio Menor", "Vampiro"], boss: { nome: "O Tirano Supremo", sprite: "😈" }, sprite: "🏰" }
];

const BASE_STATS = {
    'Guerreiro': { hp: 150, atk: 20, def: 10, sprite: '🛡️' },
    'Mago': { hp: 100, atk: 25, def: 5, sprite: '🔮' },
    'Arqueiro': { hp: 110, atk: 22, def: 7, sprite: '🏹' }
};

let player;
let currentEnemy;
let isAnimating = false;
let zonaAtual = 0;

// --- CLASSE JOGADOR (Mantida) ---
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

        logMessage(`** LVL UP! ** Você alcançou o Nível ${this.lvl} e ganhou 5 Pontos de Habilidade!`);
        
        if (!currentEnemy) {
            showStatDistribution();
        }
    }
}

// --- CLASSE INIMIGO (Mantida) ---
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
        this.initialHp = hpBase; // Adicionado para cálculo de HUD
    }
}

// --- FUNÇÕES DE INTERFACE E ANIMAÇÃO ---

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

function updateStats() {
    if (!player) return;

    // --- Atualização do Status Box (Geral) ---
    document.getElementById('current-zone').textContent = ZONAS[zonaAtual].sprite + " " + ZONAS[zonaAtual].nome;
    document.getElementById('player-name').textContent = player.name;
    document.getElementById('player-class').textContent = player.class;
    document.getElementById('player-lvl').textContent = player.lvl;
    document.getElementById('player-atk').textContent = player.attack;
    document.getElementById('player-def').textContent = player.defense;
    document.getElementById('player-hp').textContent = Math.max(0, player.hp);
    document.getElementById('player-hp-max').textContent = player.hpMax;
    document.getElementById('player-exp').textContent = player.exp;
    document.getElementById('player-exp-next').textContent = player.expToNextLvl;
    document.getElementById('player-gold').textContent = player.gold;
    document.getElementById('player-potions').textContent = player.potions;
    document.getElementById('stat-points').textContent = player.statPoints;

    // --- Atualização do HUD do Herói ---
    const heroHpPercent = (player.hp / player.hpMax) * 100;
    document.getElementById('hero-hp-bar').style.width = heroHpPercent + '%';
    document.getElementById('hero-name-display').textContent = player.name;
    document.getElementById('hero-sprite').textContent = player.sprite;

    document.getElementById('player-lvl-hud').textContent = player.lvl;
    document.getElementById('player-hp-hud').textContent = Math.max(0, player.hp);
    document.getElementById('player-hp-max-hud').textContent = player.hpMax;

    // --- Atualização do HUD do Inimigo ---
    const hudEnemy = document.getElementById('hud-enemy');
    const enemyModel = document.getElementById('enemy-model');
    
    if (currentEnemy) {
        hudEnemy.classList.remove('hidden-enemy-hud');
        enemyModel.classList.remove('hidden-enemy');
        enemyModel.classList.add('monster-appeared'); // Garante a animação de aparição

        const enemyHpPercent = (currentEnemy.hp / currentEnemy.initialHp) * 100;
        document.getElementById('enemy-hp-bar').style.width = enemyHpPercent + '%';
        document.getElementById('enemy-name-display').textContent = currentEnemy.name + ` (Lvl ${currentEnemy.lvl})`;
        document.getElementById('enemy-sprite').textContent = currentEnemy.sprite;
        
        // Exibe stats detalhados do inimigo
        document.getElementById('enemy-hp-detail').textContent = Math.max(0, currentEnemy.hp);
        document.getElementById('enemy-atk-detail').textContent = currentEnemy.attack;
        document.getElementById('enemy-def-detail').textContent = currentEnemy.defense;

    } else {
        hudEnemy.classList.add('hidden-enemy-hud');
        enemyModel.classList.add('hidden-enemy');
        enemyModel.classList.remove('monster-appeared'); // Remove a animação ao sair
    }
}

function updateActions(buttonsHtml) {
    document.getElementById('action-area').innerHTML = buttonsHtml;
}

// --- FUNÇÕES DE FLUXO DO JOGO ---

function showStatDistribution() {
    logMessage(`⭐ VOCÊ TEM ${player.statPoints} PONTOS PARA DISTRIBUIR!`);
    
    const currentHpDisplay = player.hpMax; 
    
    const buttons = `
        <p>Pontos Restantes: <span style="color:#ffcc00">${player.statPoints}</span></p>
        <button onclick="distributePoint('HP', 10)">+10 HP Máx (Atual: ${currentHpDisplay})</button>
        <button onclick="distributePoint('ATK', 3)">+3 ATK (Atual: ${player.attack})</button>
        <button onclick="distributePoint('DEF', 2)">+2 DEF (Atual: ${player.defense})</button>
        <button onclick="showMainMenu()" ${player.statPoints > 0 ? 'disabled' : ''}>Continuar Jornada</button>
    `;
    updateActions(buttons);
}

function distributePoint(stat, amount) {
    if (player.statPoints <= 0) {
        logMessage("Você não tem mais pontos para distribuir. Clique em Continuar.");
        return;
    }
    
    player.statPoints--;
    
    if (stat === 'HP') {
        player.hpMax += amount;
        player.hp += amount;
        logMessage(`+${amount} HP Máximo!`);
    } else if (stat === 'ATK') {
        player.attack += amount;
        logMessage(`+${amount} Ataque!`);
    } else if (stat === 'DEF') {
        player.defense += amount;
        logMessage(`+${amount} Defesa!`);
    }

    updateStats();
    showStatDistribution();
}

function showClassSelection() {
    const name = document.getElementById('name-input').value.trim();
    if (!name) {
        logMessage("Por favor, digite o nome do seu herói primeiro!");
        return;
    }

    document.getElementById('action-area').innerHTML = `
        <p>Escolha a sua vocação, ${name}:</p>
        <button onclick="startGame('${name}', 'Guerreiro')">🛡️ Guerreiro (Fúria do Machado)</button>
        <button onclick="startGame('${name}', 'Mago')">🔮 Mago (Explosão Arcana)</button>
        <button onclick="startGame('${name}', 'Arqueiro')">🏹 Arqueiro (Tiro Preciso)</button>
    `;
}

function startGame(name, className) {
    player = new Player(name, className);
    document.getElementById('battle-display').style.display = 'flex';
    logMessage(`O ${className} ${name} inicia a aventura na ${ZONAS[zonaAtual].nome}!`);
    updateStats();
    showMainMenu();
}

function showMainMenu() {
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
        <p>Ação na ${zona.nome} ${zona.sprite}:</p>
        <button onclick="hunt(false)">1. Explorar (Monstro Comum)</button>
        <button onclick="hunt(true)">2. Desafiar ${zona.boss.nome} (Boss)</button>
        ${advanceButton}
        <button onclick="openShop()">3. Visitar o Mercador</button>
    `;
    updateActions(buttons);
}

function advanceZone() {
    if (ZONAS[zonaAtual + 1] && player.lvl >= ZONAS[zonaAtual + 1].lvlMin) {
        zonaAtual++;
        logMessage(`🎉 Você entrou na ${ZONAS[zonaAtual].nome}! Novos perigos te aguardam.`);
        showMainMenu();
    } else {
        logMessage("Você não está forte o suficiente para avançar ou já está no último mapa.");
        showMainMenu();
    }
}


function hunt(isBoss) {
    const zona = ZONAS[zonaAtual];
    let lvlMonstro = zona.lvlMin + Math.floor(Math.random() * 3);
    
    if (isBoss) {
        lvlMonstro = Math.max(player.lvl, zona.lvlMin) + 2; 
        currentEnemy = new Enemy(lvlMonstro, true);
        logMessage(`⚠️ Você desafiou o CHEFE: ${currentEnemy.sprite} ${currentEnemy.name}! Prepare-se!`);
    } else {
        currentEnemy = new Enemy(lvlMonstro, false);
        logMessage(`!!! ${currentEnemy.sprite} Um ${currentEnemy.name} (LVL ${currentEnemy.lvl}) apareceu! !!!`);
    }
    
    updateStats(); // Força a atualização do HUD
    showBattleMenu();
}

function showBattleMenu() {
    updateStats();
    if (isAnimating) return;
    
    const buttons = `
        <button onclick="playerAttack('normal')">1. Ataque Básico</button>
        <button onclick="playerAttack('special')">2. Habilidade Única</button>
        <button onclick="usePotion()">3. Usar Poção (${player.potions})</button>
        <button onclick="attemptToFlee()">4. Tentar Fugir</button>
    `;
    updateActions(buttons);
}

// NOVA FUNÇÃO: TENTAR FUGIR
function attemptToFlee() {
    if (isAnimating) return;
    isAnimating = true;

    // Chefes não podem ser evitados
    if (currentEnemy.isBoss) {
        logMessage("❌ É impossível fugir de um CHEFE! Você perde o turno.");
        setTimeout(enemyTurn, 800);
        return;
    }
    
    // Chance de fuga: 60% base, mais chance se o nível do jogador for maior
    const fleeChance = 0.6 + ((player.lvl - currentEnemy.lvl) * 0.05);

    if (Math.random() < fleeChance) {
        logMessage("💨 Você fugiu da batalha com sucesso e retornou ao mapa principal.");
        currentEnemy = null;
        isAnimating = false;
        setTimeout(showMainMenu, 500);
    } else {
        logMessage("🏃 Sua tentativa de fuga falhou! O inimigo bloqueou o caminho.");
        setTimeout(enemyTurn, 800); // Fuga falha, inimigo ataca
    }
}


function playerAttack(type) {
    if (!currentEnemy || isAnimating) return;
    isAnimating = true;
    triggerAnimation('hero-sprite', 'attacking');

    let damage = 0;
    
    if (type === 'normal') {
        damage = player.attack + Math.floor(Math.random() * 8);
        logMessage(`${player.class} usa Ataque Básico.`);
    } else if (type === 'special') {
        
        let msg = "";
        
        if (player.class === 'Guerreiro') { 
            damage = player.attack + 20 + Math.floor(Math.random() * 10);
            if (Math.random() < 0.1) {
                 damage *= 2;
                 msg = "💥 GUERREIRO ATIVOU FÚRIA! Dano Dobrado!";
            } else {
                 msg = "Guerreiro usa Fúria do Machado!";
            }
        }
        
        if (player.class === 'Mago') { 
            damage = player.attack + 30 + Math.floor(Math.random() * 15);
            currentEnemy.defense = Math.max(0, currentEnemy.defense / 2); 
            msg = "⚡ MAGO LANÇA EXPLOSÃO ARCANA! (Reduz Defesa do inimigo)";
        }
        
        if (player.class === 'Arqueiro') { 
            damage = player.attack + 15 + Math.floor(Math.random() * 10);
            if (Math.random() < 0.4) {
                damage = damage * 1.5;
                msg = "🎯 ARQUEIRO ACERTA TIRO PRECISO! (Crítico)";
            } else {
                msg = "Arqueiro usa Tiro Preciso.";
            }
        }
        
        logMessage(msg);
    }
    
    const finalDamage = Math.max(0, Math.floor(damage - currentEnemy.defense));
    currentEnemy.hp -= finalDamage;
    logMessage(`Causou ${finalDamage} de dano ao ${currentEnemy.name}!`);
    
    if (player.class === 'Mago' && type === 'special') {
         // Restaura a DEF original após o ataque
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
        logMessage(`[CURA] Você usou uma Poção e recuperou ${heal} HP.`);
        updateStats();
        setTimeout(enemyTurn, 500);
    } else {
        logMessage("[ATENÇÃO] Você não tem poções restantes!");
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
    logMessage(`${currentEnemy.name} atacou, causando ${finalDamage} de dano!`);

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
        `👑 O GRANDE CHEFE ${currentEnemy.name} foi derrotado!`: 
        `*** VITÓRIA! ${currentEnemy.name} derrotado! ***`);
    
    player.exp += currentEnemy.expReward;
    player.gold += currentEnemy.goldReward;
    logMessage(`Ganhou ${currentEnemy.expReward} EXP e ${currentEnemy.goldReward} Ouro.`);
    
    if (Math.random() < (isBoss ? 0.7 : 0.4)) {
        player.potions++;
        logMessage(`Você encontrou 1 Poção em meio aos espólios!`);
    }

    if (player.exp >= player.expToNextLvl) {
        player.levelUp();
    }
    
    if (isBoss && ZONAS[zonaAtual + 1]) {
        logMessage(`🗺️ Você derrotou o Guardião da ${zonaVencida}! Se estiver no nível certo, poderá avançar.`);
    } else if (isBoss && !ZONAS[zonaAtual + 1]) {
        logMessage("✨ PARABÉNS! Você completou a jornada épica!");
    }

    currentEnemy = null;
    updateStats(); 
    isAnimating = false;
    setTimeout(showMainMenu, 3000);
}

function gameOver() {
    logMessage(`*** FIM DE JOGO! Você foi derrotado no Nível ${player.lvl}. ***`);
    document.getElementById('battle-display').style.display = 'none';
    updateActions(`<button onclick="location.reload()">Recomeçar Jornada</button>`);
    isAnimating = false;
}

// --- SISTEMA DE LOJA (MERCADOR) ---
function openShop() {
    const potionPrice = 30 + (zonaAtual * 5);
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
    openShop();
}