// --- DADOS E VARIÁVEIS DO JOGO ---

const ZONAS = [
    { nome: "FLORESTA PROIBIDA", lvlMin: 1, inimigos: ["GOBLIN", "SLIME", "LOBO SELVAGEM"], boss: { nome: "REI GOBLIN", sprite: "👑" }, sprite: "🌳" },
    { nome: "CAVERNAS SOMBRIAS", lvlMin: 5, inimigos: ["MORCEGO GIGANTE", "ARANHA VENENOSA", "ESQUELETO"], boss: { nome: "O ABOMINÁVEL", sprite: "💀" }, sprite: "⛰️" },
    { nome: "RUÍNAS ESQUECIDAS", lvlMin: 10, inimigos: ["FANTASMA", "GOLEM DE PEDRA", "MÚMIA"], boss: { nome: "LICH ANTIGO", sprite: "👻" }, sprite: "🏛️" },
    { nome: "MONTANHAS VULCÂNICAS", lvlMin: 15, inimigos: ["SALAMANDRA", "ELEMENTAR DE FOGO", "DRAGÃOZINHO"], boss: { nome: "DRAKE DE LAVA", sprite: "🐉" }, sprite: "🌋" },
    { nome: "CASTELO DO CAOS", lvlMin: 20, inimigos: ["GUARDA NEGRO", "DEMÔNIO MENOR", "VAMPIRO"], boss: { nome: "O TIRANO SUPREMO", sprite: "😈" }, sprite: "🏰" }
];

// --- BALANCEAMENTO DE CLASSE ---
const BASE_STATS = {
    'GUERREIRO': { hp: 160, atk: 21, def: 12, sprite: '🛡️' }, 
    'MAGO': { hp: 110, atk: 26, def: 6, sprite: '🔮' },       
    'ARQUEIRO': { hp: 120, atk: 23, def: 8, sprite: '🏹' }     
};

let player;
let currentEnemy;
let isAnimating = false;
let zonaAtual = 0;
let turnCount = 0; 
const SPECIAL_COOLDOWN = 3; 
let isGodModeActive = false; // Flag para o Easter Egg

// --- CLASSE JOGADOR (Adicionado item Chave Secreta) ---
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
        this.lastSpecialTurn = -SPECIAL_COOLDOWN; 
        this.secretKey = false; // Inventário da Chave Secreta
    }

    levelUp() {
        this.lvl++;
        this.exp -= this.expToNextLvl;
        this.expToNextLvl = Math.floor(this.expToNextLvl * 1.5);
        this.statPoints += 6; 
        this.hpMax += 15; // Aumento de HP no level up ligeiramente maior.
        this.hp = this.hpMax;
        logMessage(`[LVL UP] VOCÊ ALCANÇOU O NÍVEL ${this.lvl}! PONTOS GANHOS.`);
        
        if (!currentEnemy) {
            changeScreen('stats'); 
        }
    }
}

// --- CLASSE INIMIGO (Balanceamento Aprimorado) ---
class Enemy {
    constructor(lvl, isBoss = false) {
        const zona = ZONAS[zonaAtual];
        let name, hpBase, atkBase, defBase, sprite;

        // Progressão de atributos ajustada (escalonamento mais linear e recompensador)
        const hpMultiplier = isBoss ? 45 : 25;
        const atkMultiplier = isBoss ? 10 : 6;
        const defMultiplier = isBoss ? 5 : 3;

        if (isBoss) {
            name = zona.boss.nome;
            hpBase = 100 + (lvl * hpMultiplier); 
            atkBase = 20 + (lvl * atkMultiplier); 
            defBase = 8 + (lvl * defMultiplier);
            sprite = zona.boss.sprite;
        } else {
            name = zona.inimigos[Math.floor(Math.random() * zona.inimigos.length)];
            hpBase = 50 + (lvl * hpMultiplier); 
            atkBase = 15 + (lvl * atkMultiplier);
            defBase = 5 + (lvl * defMultiplier);
            sprite = '👹';
        }

        this.name = name;
        this.lvl = lvl;
        this.hp = hpBase;
        this.attack = atkBase;
        this.defense = defBase;
        // Recompensa de EXP/Gold ajustada
        this.expReward = Math.floor(lvl * (isBoss ? 50 : 25)) + (isBoss ? 200 : 50); 
        this.goldReward = Math.floor(Math.random() * (isBoss ? 70 : 25) * lvl) + 20;
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

// --- FUNÇÕES DE INTERFACE (Modificada para mostrar Cooldown e Chave Secreta) ---

function updateStats() {
    if (!player) return;

    // Calcula o Cooldown
    const turnsRemaining = Math.max(0, SPECIAL_COOLDOWN - (turnCount - player.lastSpecialTurn));
    const cooldownStatus = turnsRemaining > 0 ? `(CD: ${turnsRemaining})` : `(PRONTO!)`;
    
    // Status da Chave Secreta
    const keyStatus = player.secretKey ? '🔑 (POSSUI)' : '(NÃO)';

    // --- Atualização do Status Box (Geral) ---
    const statsHtml = `
        <p>ZONA: ${ZONAS[zonaAtual].sprite} ${ZONAS[zonaAtual].nome} | NÍVEL: ${player.lvl} (PONTOS: ${player.statPoints})</p>
        <p>NOME: ${player.name} | CLASSE: ${player.class} | OURO: ${player.gold} | POÇÕES: ${player.potions}</p>
        <p>HP: ${Math.max(0, player.hp)}/${player.hpMax} | ATK: ${player.attack} | DEF: ${player.defense} | SKILL: ${cooldownStatus} | CHAVE SECRETA: ${keyStatus}</p>
        <p>EXP: ${player.exp}/${player.expToNextLvl}</p>
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
    changeScreen('main'); 
    showMainMenu();
}

function showStatDistribution() {
    changeScreen('stats');
    logMessage(`[LVL UP] VOCÊ TEM ${player.statPoints} PONTOS PARA DISTRIBUIR!`);
    
    const currentHpDisplay = player.hpMax; 
    
    const buttons = `
        <p>PONTOS RESTANTES: <span style="color:#ff0000">${player.statPoints}</span></p>
        <button class="btn-stat" onclick="distributePoint('HP', 15)">+15 HP MÁX (ATUAL: ${currentHpDisplay})</button>
        <button class="btn-stat" onclick="distributePoint('ATK', 4)">+4 ATK (ATUAL: ${player.attack})</button>
        <button class="btn-stat" onclick="distributePoint('DEF', 3)">+3 DEF (ATUAL: ${player.defense})</button>
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
    changeScreen('main'); 
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
        <button onclick="inspectZone()">4. INSPECIONAR ZONA (BUSCAR SEGREDO)</button>
        <button onclick="openShop()">5. VISITAR O MERCADOR</button>
    `;
    updateActions(buttons);
}

function inspectZone() {
    logMessage(`[AÇÃO] VOCÊ PROCURA POR SINAIS E PISTAS na ${ZONAS[zonaAtual].nome}...`);
    
    // Se a chave for encontrada e o Easter Egg ainda não tiver sido ativado
    if (player.secretKey && !isGodModeActive) {
        player.secretKey = false; // A chave é consumida/usada para revelar a pista
        logMessage("🔑 Você usa a Chave Secreta em uma pedra marcada.");
        // Pista: O código é o nome do criador do modo mais apelão dos jogos.
        logMessage(`[PISTA SECRETA] Uma inscrição aparece na pedra: "O modo dos Deuses foi um presente do... <span style='color:red'>...MODE</span>".`);
        logMessage("A chave se desintegra. Você pode tentar o código na loja.");
    } else if (isGodModeActive) {
        logMessage("[INSPEÇÃO] O local parece vazio. O poder já está com você.");
    } else {
        logMessage("[INSPEÇÃO] Você encontra apenas terra e cascalho. Talvez outro item seja necessário.");
    }
    
    updateStats();
    setTimeout(showMainMenu, 2000);
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
    turnCount = 0; // Reinicia o contador de turnos ao iniciar uma nova batalha
    
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
    
    const turnsRemaining = Math.max(0, SPECIAL_COOLDOWN - (turnCount - player.lastSpecialTurn));
    const isSpecialReady = turnsRemaining === 0;

    const specialButtonText = isSpecialReady 
        ? `2. HABILIDADE ÚNICA` 
        : `2. HABILIDADE ÚNICA (CD: ${turnsRemaining})`;

    const buttons = `
        <button onclick="playerAttack('normal')">1. ATK BÁSICO</button>
        <button onclick="playerAttack('special')" ${!isSpecialReady ? 'disabled' : ''}>${specialButtonText}</button>
        <button onclick="usePotion()">3. USAR POÇÃO (${player.potions})</button>
        <button onclick="attemptToFlee()">4. TENTAR FUGIR</button>
    `;
    updateActions(buttons);
}

// --- FUNÇÕES DE COMBATE ---

function attemptToFlee() {
    if (isAnimating) return;
    isAnimating = true;
    turnCount++; // A fuga conta como um turno
    updateStats();

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
    
    // Verifica cooldown
    if (type === 'special') {
        const turnsRemaining = SPECIAL_COOLDOWN - (turnCount - player.lastSpecialTurn);
        if (turnsRemaining > 0) {
            logMessage(`[ERRO] HABILIDADE EM COOLDOWN. FALTAM ${turnsRemaining} TURNOS.`);
            return;
        }
        player.lastSpecialTurn = turnCount; // Reseta o cooldown
    }
    
    isAnimating = true;
    turnCount++; // Conta o turno do jogador
    triggerAnimation('hero-sprite', 'attacking');

    let damage = 0;
    
    if (type === 'normal') {
        damage = player.attack + Math.floor(Math.random() * 8);
        logMessage(`[AÇÃO] ${player.class} USA ATK BÁSICO.`);
    } else if (type === 'special') {
        let msg = "";
        
        // --- BALANCEAMENTO DE SKILLS ---
        if (player.class === 'GUERREIRO') { 
            damage = player.attack * 1.5 + Math.floor(Math.random() * 12); // Dano forte
            if (Math.random() < 0.2) { // 20% de chance de Fúria (Dano x2)
                 damage *= 2;
                 msg = "[HABILIDADE] GUERREIRO ATIVOU FÚRIA! DANO DOBRADO!";
            } else {
                 msg = "[HABILIDADE] GUERREIRO USA FÚRIA DO MACHADO!";
            }
        }
        
        if (player.class === 'MAGO') { 
            damage = player.attack * 2 + Math.floor(Math.random() * 10); // Dano muito alto
            const oldDef = currentEnemy.defense;
            currentEnemy.defense = Math.max(0, currentEnemy.defense / 2); // Reduz DEF pela metade (efeito de 1 turno)
            msg = `[HABILIDADE] MAGO LANÇA EXPLOSÃO ARCANA! DEFESA REDUZIDA (${oldDef.toFixed(1)} -> ${currentEnemy.defense.toFixed(1)})`;
        }
        
        if (player.class === 'ARQUEIRO') { 
            damage = player.attack * 1.2 + Math.floor(Math.random() * 8); 
            if (Math.random() < 0.5) { // 50% de chance de acerto crítico (Dano x1.5)
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
    
    // Reverte o efeito da habilidade do MAGO (redução de defesa) após o dano
    if (player.class === 'MAGO' && type === 'special') {
         // Cria um novo inimigo temporário para obter a defesa base do nível
         currentEnemy.defense = new Enemy(currentEnemy.lvl, currentEnemy.isBoss).defense; 
         logMessage(`[EFEITO] DEFESA do inimigo voltou ao normal: ${currentEnemy.defense.toFixed(1)}`);
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
        const heal = Math.floor(player.hpMax * 0.35) + 30; // Cura um pouco maior
        player.hp = Math.min(player.hpMax, player.hp + heal);
        player.potions--;
        logMessage(`[CURA] VOCÊ USOU POÇÃO E RECUPEROU ${heal} HP.`);
        updateStats();
        turnCount++; // A poção conta como um turno
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
    // Animação de ataque do inimigo
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
    
    // CHANCE DE PEGAR CHAVE SECRETA (EASTER EGG)
    if (isBoss && Math.random() < 0.10 && !player.secretKey && !isGodModeActive) { // 10% de chance, se for Boss, e só se não tiver a chave/cheat ativo
         player.secretKey = true;
         logMessage(`[LOOT RARO] 🔑 VOCÊ ENCONTROU UMA CHAVE SECRETA! Guarde-a bem.`);
    }

    if (Math.random() < (isBoss ? 0.6 : 0.3)) { // Chance de poção ajustada
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
        <div class="shop-input-area">
            <input type="text" id="easter-egg-input" placeholder="Código secreto (opcional)">
            <button onclick="checkEasterEgg()">🔍 USAR CÓDIGO</button>
        </div>
        <button onclick="buyItem('potion', ${potionPrice})">COMPRAR POÇÃO (${potionPrice} OURO)</button>
        <button onclick="showMainMenu()">VOLTAR AO MENU</button>
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

// --- EASTER EGG ---
function checkEasterEgg() {
    const code = document.getElementById('easter-egg-input').value.toUpperCase().trim();
    document.getElementById('easter-egg-input').value = ""; // Limpa o campo
    
    if (code === "GODMODE" && !isGodModeActive) { // Ativa apenas uma vez
        isGodModeActive = true;
        player.hpMax += 700; // Buff ainda maior!
        player.hp = player.hpMax;
        player.attack += 150;
        player.defense += 80;
        player.gold += 5000;
        player.potions += 20;
        logMessage(`[CHEAT ATIVADO] 🌟 O PODER DE "GODMODE" FOI CONCEDIDO!`);
        logMessage(`Você se tornou invencível! (Quase...)`);
        updateStats();
    } else if (code === "GODMODE" && isGodModeActive) {
        logMessage(`[CHEAT] O código GODMODE já está ativo!`);
    } else if (code.length > 0) {
        logMessage(`[CÓDIGO] "${code}" não é válido. Tente procurar por pistas na Zona.`);
    } else {
         logMessage(`[CÓDIGO] O campo estava vazio.`);
    }
    openShop();
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    // Garante que o input de nome está visível na primeira tela
    changeScreen('initial');
});