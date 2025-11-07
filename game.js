// --- DADOS E VARIÁVEIS DO JOGO ---

const ZONAS = [
    { nome: "FLORESTA PROIBIDA", lvlMin: 1, inimigos: ["GOBLIN", "SLIME", "LOBO SELVAGEM"], boss: { nome: "REI GOBLIN", sprite: "👑" }, sprite: "🌳", exploresNeeded: 3 }, // 3 explorações para habilitar o Boss
    { nome: "CAVERNAS SOMBRIAS", lvlMin: 5, inimigos: ["MORCEGO GIGANTE", "ARANHA VENENOSA", "ESQUELETO"], boss: { nome: "O ABOMINÁVEL", sprite: "💀" }, sprite: "⛰️", exploresNeeded: 4 },
    { nome: "RUÍNAS ESQUECIDAS", lvlMin: 10, inimigos: ["FANTASMA", "GOLEM DE PEDRA", "MÚMIA"], boss: { nome: "LICH ANTIGO", sprite: "👻" }, sprite: "🏛️", exploresNeeded: 5 },
    { nome: "MONTANHAS VULCÂNICAS", lvlMin: 15, inimigos: ["SALAMANDRA", "ELEMENTAR DE FOGO", "DRAGÃOZINHO"], boss: { nome: "DRAKE DE LAVA", sprite: "🐉" }, sprite: "🌋", exploresNeeded: 5 },
    { nome: "CASTELO DO CAOS", lvlMin: 20, inimigos: ["GUARDA NEGRO", "DEMÔNIO MENOR", "VAMPIRO"], boss: { nome: "O TIRANO SUPREMO", sprite: "😈" }, sprite: "🏰", exploresNeeded: 6 }
];

// --- SKILL TREE: Habilidades Ativas e Passivas ---
const SKILLS = {
    // ATIVAS (Equipáveis, usam o slot 'special')
    ACTIVE: {
        'GUERREIRO': {
            'FURIA': { id: 'FURIA', nome: "Fúria do Machado (Padrão)", custo: 3, descricao: "Dano alto com chance (20%) de dobrar. (CD: 3)", effect: 'default', dmgMult: 1.5 },
            'SHIELD_BASH': { id: 'SHIELD_BASH', nome: "Golpe de Escudo", custo: 2, descricao: "Dano médio. Reduz DEF do inimigo em 5 permanentemente. (CD: 2)", effect: 'perm_def_down', dmgMult: 1.0 },
            'CHARGE': { id: 'CHARGE', nome: "Investida", custo: 4, descricao: "Dano muito alto. Ignora DEF do inimigo. (CD: 4)", effect: 'ignore_def', dmgMult: 2.2 }
        },
        'MAGO': {
            'ARCANE_EXPLOSION': { id: 'ARCANE_EXPLOSION', nome: "Explosão Arcana (Padrão)", custo: 3, descricao: "Dano muito alto. Reduz a DEF do inimigo pela metade (1 turno). (CD: 3)", effect: 'temp_def_down', dmgMult: 2.0 },
            'FIREBALL': { id: 'FIREBALL', nome: "Bola de Fogo", custo: 2, descricao: "Dano alto. Causa dano de fogo extra no próximo turno. (CD: 2)", effect: 'dot', dmgMult: 1.5 },
            'FREEZE': { id: 'FREEZE', nome: "Congelamento", custo: 4, descricao: "Dano baixo. Impede o inimigo de atacar no próximo turno. (CD: 4)", effect: 'stun', dmgMult: 0.5 }
        },
        'ARQUEIRO': {
            'PRECISION_SHOT': { id: 'PRECISION_SHOT', nome: "Tiro Preciso (Padrão)", custo: 3, descricao: "Dano alto com chance (50%) de crítico (x1.5). (CD: 3)", effect: 'default', dmgMult: 1.2 },
            'POISON_ARROW': { id: 'POISON_ARROW', nome: "Flecha Envenenada", custo: 2, descricao: "Dano médio. Causa dano de veneno por 3 turnos. (CD: 2)", effect: 'poison', dmgMult: 1.0 },
            'MULTISHOT': { id: 'MULTISHOT', nome: "Tiro Múltiplo", custo: 4, descricao: "Dano médio. Ataca 3 inimigos na onda. (CD: 4)", effect: 'multi_target', dmgMult: 1.0 }
        }
    },
    // PASSIVAS (Melhorias permanentes, custo único)
    PASSIVE: {
        'HEAVY_BLOW': { nome: "Golpe Pesado", custo: 1, descricao: "Chance de 30% de dano +50% no ATK BÁSICO.", atkMult: 0.3, extraDmg: 0.5 },
        'LIFE_DRAIN': { nome: "Drenagem de Vida", custo: 1, descricao: "Cura por 50% do dano causado (ATK BÁSICO).", lifesteal: 0.5 },
        'FAST_SHOT': { nome: "Tiro Rápido", custo: 1, descricao: "Pequena chance (20%) de atacar duas vezes no ATK BÁSICO.", extraHitChance: 0.2 },
        'TAUNT': { nome: "Provocação", custo: 2, descricao: "Aumenta DEF em +10 permanentemente.", defBonus: 10 },
        'FOCUS': { nome: "Foco Arcana", custo: 2, descricao: "Aumenta ATK em +8 permanentemente.", atkBonus: 8 },
        'EVASION': { nome: "Evasão", custo: 2, descricao: "Aumenta DEF em +5 e HP Máx em +15 permanentemente.", defBonus: 5, hpBonus: 15 }
    }
};

const BASE_STATS = {
    'GUERREIRO': { hp: 160, atk: 21, def: 12, sprite: '🛡️' }, 
    'MAGO': { hp: 110, atk: 26, def: 6, sprite: '🔮' },       
    'ARQUEIRO': { hp: 120, atk: 23, def: 8, sprite: '🏹' }     
};

let player;
let isAnimating = false;
let zonaAtual = 0;
let turnCount = 0; 
let isGodModeActive = false; 
let exploresCompleted = 0; // Contador de explorações

// --- SISTEMA DE ONDA E ALVOS ---
let currentWave = [];
let waveIndex = 0;
let totalWaves = 0;
let currentTargetIndex = 0;

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
        this.statPoints = 0;
        this.skillPoints = 0;
        this.secretKey = false;
        
        // Habilidades
        this.unlockedActiveSkills = {}; 
        this.unlockedPassiveSkills = {}; 
        
        const defaultSkill = SKILLS.ACTIVE[className]['FURIA'] || SKILLS.ACTIVE[className]['ARCANE_EXPLOSION'] || SKILLS.ACTIVE[className]['PRECISION_SHOT'];
        this.equippedActiveSkill = defaultSkill;
        
        // Adiciona a habilidade padrão ao desbloqueio no início
        this.unlockedActiveSkills[defaultSkill.id] = defaultSkill;
        
        // Cooldown
        this.lastSpecialTurn = -this.equippedActiveSkill.custo; 
        
        // Efeitos
        this.enemyDots = {}; 
        this.isStunned = false; 
    }

    levelUp() {
        this.lvl++;
        this.exp -= this.expToNextLvl;
        this.expToNextLvl = Math.floor(this.expToNextLvl * 1.5);
        this.statPoints += 3; 
        this.skillPoints += 1;
        this.hpMax += 15; 
        this.hp = this.hpMax;
        
        // Progressão Automática
        this.attack++;
        this.defense++;
        this.hpMax += 1; 
        this.hp += 1;
        this.statPoints -= 3;
        
        logMessage(`[LVL UP] VOCÊ ALCANÇOU O NÍVEL ${this.lvl}!`);
        logMessage(`[LVL UP] Status aprimorados automaticamente!`);
        logMessage(`[LVL UP] VOCÊ GANHOU 1 PONTO DE HABILIDADE (SP)!`);
        
        if (currentWave.length === 0) {
            showMainMenu();
        }
    }
}

// --- CLASSE INIMIGO ---
class Enemy {
    constructor(lvl, isBoss = false) {
        const zona = ZONAS[zonaAtual];
        let name, hpBase, atkBase, defBase, sprite;

        // Progressão de atributos ajustada
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
        this.id = Math.random(); 
        this.hp = hpBase;
        this.attack = atkBase;
        this.defense = defBase;
        this.expReward = Math.floor(lvl * (isBoss ? 50 : 25)) + (isBoss ? 200 : 50); 
        this.goldReward = Math.floor(Math.random() * (isBoss ? 70 : 25) * lvl) + 20;
        this.isBoss = isBoss;
        this.sprite = sprite;
        this.initialHp = hpBase;
        
        // Efeitos de Status
        this.isStunned = false;
        this.dotTurns = 0; 
        this.poisonTurns = 0; 
        this.dotDamage = 0;
        this.initialDefense = defBase;
    }
}

// --- GERENCIAMENTO DE TELAS E UI ---

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

function updateStats() {
    if (!player) return;

    const skill = player.equippedActiveSkill;
    const turnsRemaining = Math.max(0, skill.custo - (turnCount - player.lastSpecialTurn));
    const cooldownStatus = turnsRemaining > 0 ? `(CD: ${turnsRemaining})` : `(PRONTO!)`;
    const keyStatus = player.secretKey ? '🔑 (POSSUI)' : '(NÃO)';

    const passiveSkillsList = Object.keys(player.unlockedPassiveSkills).length > 0
        ? Object.values(player.unlockedPassiveSkills).map(s => s.nome).join(', ')
        : 'Nenhuma';

    // --- Atualização do Status Box (Geral) ---
    const statsHtml = `
        <p>ZONA: ${ZONAS[zonaAtual].sprite} ${ZONAS[zonaAtual].nome} | EXPLORAÇÕES: ${exploresCompleted}/${ZONAS[zonaAtual].exploresNeeded}</p>
        <p>NOME: ${player.name} | NÍVEL: ${player.lvl} (SP: ${player.skillPoints}) | OURO: ${player.gold} | POÇÕES: ${player.potions}</p>
        <p>HP: ${Math.max(0, player.hp)}/${player.hpMax} | ATK: ${player.attack} | DEF: ${player.defense}</p>
        <p>HABILIDADE EQUIPADA: ${skill.nome} (${skill.custo} CD) ${cooldownStatus}</p>
        <p>PASSIVAS: ${passiveSkillsList} | CHAVE SECRETA: ${keyStatus}</p>
        <p>EXP: ${player.exp}/${player.expToNextLvl}</p>
    `;
    
    document.getElementById('player-stats').innerHTML = `<h2>STATUS GERAL</h2>${statsHtml}`;
    document.getElementById('player-stats-summary').innerHTML = statsHtml;
    
    // Atualiza HUD de Batalha
    const heroHpPercent = (player.hp / player.hpMax) * 100;
    document.getElementById('hero-hp-bar').style.width = heroHpPercent + '%';
    document.getElementById('player-hp-hud').textContent = Math.max(0, player.hp);
    document.getElementById('player-hp-max-hud').textContent = player.hpMax;

    const hudEnemy = document.getElementById('hud-enemy');
    const enemyModel = document.getElementById('enemy-model');
    
    const currentEnemy = currentWave[currentTargetIndex];

    if (currentEnemy) {
        hudEnemy.classList.remove('hidden-enemy-hud');
        enemyModel.classList.remove('hidden-enemy');
        enemyModel.classList.add('monster-appeared'); 

        const waveStatus = totalWaves > 0 ? `(Onda ${waveIndex + 1}/${totalWaves})` : '';
        let enemyStatus = '';
        if (currentEnemy.dotTurns > 0) enemyStatus += ' 🔥';
        if (currentEnemy.poisonTurns > 0) enemyStatus += ' ☣️';
        if (currentEnemy.isStunned) enemyStatus += ' 🥶';

        document.getElementById('enemy-name-display').textContent = `${currentEnemy.sprite} ${currentEnemy.name} ${enemyStatus} ${waveStatus} (Lvl ${currentEnemy.lvl})`;
        
        const enemyHpPercent = (currentEnemy.hp / currentEnemy.initialHp) * 100;
        document.getElementById('enemy-hp-bar').style.width = enemyHpPercent + '%';
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
    // Adiciona a nova mensagem ao topo
    // logBox.innerHTML = `<p>${message}</p>` + logBox.innerHTML;
    // Mantendo a mensagem no final para melhor leitura do log de combate
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

// --- FUNÇÕES DE INÍCIO E PROGRESSÃO ---

function showClassSelection() {
    // 1. Captura o nome digitado e remove espaços extras
    const name = document.getElementById('name-input').value.trim(); 
    
    // 2. VERIFICAÇÃO CRÍTICA: Se o nome estiver vazio, retorna erro.
    if (!name) {
        logMessage("[ERRO] DIGITE SEU NOME PARA CONTINUAR.");
        return;
    }
    
    // 3. Atualiza a área inicial com as opções de classe
    const initialArea = document.getElementById('initial-area');
    initialArea.innerHTML = `
        <p class="ascii-font">ESCOLHA SUA CLASSE, ${name}:</p>
        <button onclick="startGame('${name}', 'GUERREIRO')">🛡️ GUERREIRO (HP/DEF)</button>
        <button onclick="startGame('${name}', 'MAGO')">🔮 MAGO (ATK Alto)</button>
        <button onclick="startGame('${name}', 'ARQUEIRO')">🏹 ARQUEIRO (Equilibrado)</button>
    `;
}

function startGame(name, className) {
    player = new Player(name, className);
    exploresCompleted = 0;
    
    document.getElementById('hero-name-display').textContent = player.name;
    document.getElementById('hero-sprite').textContent = player.sprite;
    document.getElementById('player-lvl-hud').textContent = player.lvl;
    document.getElementById('battle-display').style.display = 'flex';
    
    logMessage(`[INÍCIO] O ${className} ${name} INICIA A AVENTURA!`);
    updateStats();
    changeScreen('main'); 
    showMainMenu();
}

function showMainMenu() {
    changeScreen('main'); 
    
    currentWave = []; 
    updateStats();
    
    const zona = ZONAS[zonaAtual];
    let advanceButton = "";
    let bossButton = "";

    // Botão de Avançar (só aparece se o nível for alto o suficiente)
    if (ZONAS[zonaAtual + 1] && player.lvl >= ZONAS[zonaAtual + 1].lvlMin) {
        advanceButton = `<button onclick="advanceZone()" class="btn-advance">➡️ AVANÇAR PARA ${ZONAS[zonaAtual + 1].nome}</button>`;
    }

    // Botão de Boss (só aparece se as explorações necessárias forem completadas)
    if (exploresCompleted >= zona.exploresNeeded) {
        bossButton = `<button onclick="startWaves(true)" class="btn-boss-ready">2. DESAFIAR ${zona.boss.nome} (CHEFE) 😈</button>`;
    } else {
        bossButton = `<button disabled>2. DESAFIAR ${zona.boss.nome} (Faltam ${zona.exploresNeeded - exploresCompleted} explorações)</button>`;
    }

    const buttons = `
        <p>AÇÃO NA ${zona.nome} ${zona.sprite}:</p>
        <button onclick="startWaves(false)">1. EXPLORAR (MONSTROS COMUNS)</button>
        ${bossButton}
        <button onclick="inspectZone()">3. INSPECIONAR ZONA (BUSCAR SEGREDO)</button>
        <button onclick="openShop()">4. CENTRO DE TREINAMENTO (SKILL TREE & EQUIPAR)</button>
        ${advanceButton}
    `;
    updateActions(buttons);
}

function advanceZone() {
    if (ZONAS[zonaAtual + 1] && player.lvl >= ZONAS[zonaAtual + 1].lvlMin) {
        zonaAtual++;
        exploresCompleted = 0; // Reseta o contador para a nova zona
        logMessage(`[ZONA] VOCÊ ENTROU NA ${ZONAS[zonaAtual].nome}!`);
        showMainMenu();
    } else {
        logMessage("[ZONA] NÍVEL INSUFICIENTE PARA AVANÇAR.");
        showMainMenu();
    }
}

function inspectZone() {
    logMessage(`[AÇÃO] VOCÊ PROCURA POR SINAIS E PISTAS na ${ZONAS[zonaAtual].nome}...`);
    
    if (player.secretKey && !isGodModeActive) {
        player.secretKey = false; 
        logMessage("🔑 Você usa a Chave Secreta em uma pedra marcada.");
        logMessage(`[PISTA SECRETA] Uma inscrição aparece: "O modo dos Deuses foi um presente do... <span style='color:red'>...MODE</span>".`);
        logMessage("A chave se desintegra. Você pode tentar o código no Centro de Treinamento.");
    } else if (isGodModeActive) {
        logMessage("[INSPEÇÃO] O local parece vazio. O poder já está com você.");
    } else {
        logMessage("[INSPEÇÃO] Você encontra apenas terra e cascalho. Talvez outro item seja necessário.");
    }
    
    updateStats();
    setTimeout(showMainMenu, 2000);
}

// --- FUNÇÕES DE ONDAS E COMBATE ---

function startWaves(isBoss) {
    waveIndex = 0;
    currentTargetIndex = 0;
    turnCount = 0; 
    
    // Reseta cooldown no início da batalha
    player.lastSpecialTurn = -player.equippedActiveSkill.custo; 
    
    const zona = ZONAS[zonaAtual];
    const baseLvl = zona.lvlMin + Math.floor(Math.random() * 3);
    
    // Se for chefe, são sempre 3 ondas (incluindo o chefe na última)
    // Se for exploração normal, são 1 ou 2 ondas
    totalWaves = isBoss ? 3 : (Math.random() < 0.5 ? 2 : 1); 
    
    logMessage(`[BATALHA] ENCONTRADO ${totalWaves} ONDA(S) DE INIMIGOS!`);
    
    generateWave(isBoss, baseLvl);
}

function generateWave(isBoss, baseLvl) {
    currentWave = [];
    currentTargetIndex = 0; 
    
    if (waveIndex >= totalWaves) {
        victoryEnd(isBoss);
        return;
    }

    let enemyCount = 0;
    let lvlMonstro = baseLvl + waveIndex;

    if (isBoss && waveIndex === totalWaves - 1) {
        enemyCount = 1;
        lvlMonstro = Math.max(player.lvl, baseLvl) + 2; 
        currentWave.push(new Enemy(lvlMonstro, true));
        logMessage(`[ONDA ${waveIndex + 1}] CHEFE ${currentWave[0].sprite} ${currentWave[0].name} APARECEU!`);
    } else {
        enemyCount = Math.floor(Math.random() * 3) + 1; 
        for (let i = 0; i < enemyCount; i++) {
            currentWave.push(new Enemy(lvlMonstro, false));
        }
        logMessage(`[ONDA ${waveIndex + 1}] ENCONTRADO ${enemyCount} MONSTRO(S) COMUNS!`);
    }

    updateStats(); 
    showBattleMenu();
}

function showBattleMenu() {
    updateStats();
    if (isAnimating || currentWave.length === 0) return;
    
    const skill = player.equippedActiveSkill;
    const turnsRemaining = Math.max(0, skill.custo - (turnCount - player.lastSpecialTurn));
    const isSpecialReady = turnsRemaining === 0;

    const specialButtonText = isSpecialReady 
        ? `2. ${skill.nome}` 
        : `2. ${skill.nome} (CD: ${turnsRemaining})`;

    // Cria botões de alvo
    let targetButtons = '<p>Selecione o Alvo (T):</p>';
    currentWave.forEach((enemy, index) => {
        const isTarget = index === currentTargetIndex;
        let status = '';
        if (enemy.dotTurns > 0) status += '🔥';
        if (enemy.poisonTurns > 0) status += '☣️';
        if (enemy.isStunned) status += '🥶';
        targetButtons += `<button onclick="setTarget(${index})" class="${isTarget ? 'btn-target-active' : 'btn-target'}">T${index + 1}: ${enemy.sprite} ${enemy.name} ${status} (${Math.max(0, enemy.hp)} HP)</button>`;
    });

    const actionButtons = `
        <button onclick="playerAttack('normal')">1. ATK BÁSICO</button>
        <button onclick="playerAttack('special')" ${!isSpecialReady ? 'disabled' : ''}>${specialButtonText}</button>
        <button onclick="usePotion()">3. USAR POÇÃO (${player.potions})</button>
        <button onclick="attemptToFlee()">4. TENTAR FUGIR</button>
    `;

    updateActions(targetButtons + actionButtons);
}

function setTarget(index) {
    currentTargetIndex = index;
    showBattleMenu(); 
}

function playerAttack(type) {
    const currentEnemy = currentWave[currentTargetIndex];
    if (!currentEnemy || isAnimating) return;
    
    isAnimating = true;

    if (type === 'special') {
        const skill = player.equippedActiveSkill;
        const turnsRemaining = Math.max(0, skill.custo - (turnCount - player.lastSpecialTurn));
        if (turnsRemaining > 0) {
            logMessage(`[ERRO] HABILIDADE EM COOLDOWN. FALTAM ${turnsRemaining} TURNOS.`);
            isAnimating = false;
            return;
        }
        player.lastSpecialTurn = turnCount; 
    }
    
    turnCount++; 
    triggerAnimation('hero-sprite', 'attacking');

    let damage = 0;
    
    if (type === 'normal') {
        damage = player.attack + Math.floor(Math.random() * 8);
        logMessage(`[AÇÃO] ${player.class} USA ATK BÁSICO no T${currentTargetIndex + 1}.`);
        
        // Aplica Passivas ao ATK BÁSICO
        damage = applyPassiveEffects(damage);
        
    } else if (type === 'special') {
        const skill = player.equippedActiveSkill;
        damage = player.attack * skill.dmgMult + Math.floor(Math.random() * 10);
        logMessage(`[HABILIDADE] ${skill.nome} USADA no T${currentTargetIndex + 1}.`);
        
        // Aplica Efeitos Ativos
        damage = applyActiveSkillEffect(currentEnemy, skill, damage);
    }
    
    // Calculo de Dano
    const finalDamage = Math.max(0, Math.floor(damage - (currentEnemy.isBoss && type === 'special' && player.equippedActiveSkill.effect === 'ignore_def' ? 0 : currentEnemy.defense)));
    currentEnemy.hp -= finalDamage;
    logMessage(`[DANO] CAUSOU ${finalDamage} DE DANO ao ${currentEnemy.name}!`);
    
    // Reverte a DEF temporária (se for o caso da Explosão Arcana)
    if (type === 'special' && player.equippedActiveSkill.effect === 'temp_def_down') {
         // Não reverte aqui, o DOT faz isso na função enemyTurn
    }

    triggerAnimation('enemy-sprite', 'receiving-damage'); 

    updateStats(); 

    if (currentEnemy.hp <= 0) {
        logMessage(`[DERROTA] ${currentEnemy.name} (T${currentTargetIndex + 1}) FOI DERROTADO!`);
        handleEnemyDefeat(currentEnemy);
    } else {
        // Verifica TIRO RÁPIDO para ataque extra
        if (type === 'normal' && player.unlockedPassiveSkills['FAST_SHOT'] && Math.random() < player.unlockedPassiveSkills['FAST_SHOT'].extraHitChance) {
             setTimeout(() => fastShotAttack(currentEnemy), 500); 
        } else {
            setTimeout(enemyTurn, 800);
        }
    }
}

function applyPassiveEffects(baseDamage) {
    let damage = baseDamage;
    
    // GOLPE PESADO (Heavy Blow)
    if (player.unlockedPassiveSkills['HEAVY_BLOW'] && Math.random() < player.unlockedPassiveSkills['HEAVY_BLOW'].atkMult) {
        damage *= (1 + player.unlockedPassiveSkills['HEAVY_BLOW'].extraDmg);
        logMessage(`[PASSIVA] GOLPE PESADO ativou!`);
    }
    
    // DRENAGEM DE VIDA (Life Drain)
    if (player.unlockedPassiveSkills['LIFE_DRAIN']) {
        const heal = Math.floor(damage * player.unlockedPassiveSkills['LIFE_DRAIN'].lifesteal);
        player.hp = Math.min(player.hpMax, player.hp + heal);
        logMessage(`[PASSIVA] DRENAGEM DE VIDA curou ${heal} HP.`);
    }

    return damage;
}

function applyActiveSkillEffect(enemy, skill, baseDamage) {
    let damage = baseDamage;
    
    switch (skill.effect) {
        case 'default':
            if (skill.id === 'FURIA' && Math.random() < 0.2) {
                 damage *= 2;
                 logMessage("[EFEITO] FÚRIA ATIVOU! DANO DOBRADO!");
            } else if (skill.id === 'PRECISION_SHOT' && Math.random() < 0.5) {
                damage *= 1.5;
                logMessage("[EFEITO] TIRO PRECISO (CRÍTICO)!");
            }
            break;
            
        case 'temp_def_down':
            enemy.defense = Math.max(0, enemy.defense / 2);
            // Armazena a mudança de defesa para reverter no DOT
            enemy.tempDefDown = true;
            logMessage(`[EFEITO] DEFESA REDUZIDA temporariamente!`);
            break;

        case 'perm_def_down':
            enemy.initialDefense = Math.max(0, enemy.initialDefense - 5);
            enemy.defense = enemy.initialDefense;
            logMessage(`[EFEITO] DEFESA REDUZIDA permanentemente em 5!`);
            break;
            
        case 'ignore_def':
            logMessage("[EFEITO] DEFESA IGNORADA!");
            break;
            
        case 'dot':
            enemy.dotTurns = 2; 
            enemy.dotDamage = player.attack * 0.2; 
            logMessage(`[EFEITO] O alvo está pegando 🔥 FOGO!`);
            break;

        case 'poison':
            enemy.poisonTurns = 3;
            enemy.dotDamage = player.attack * 0.15;
            logMessage(`[EFEITO] O alvo está ☣️ ENVENENADO!`);
            break;
            
        case 'stun':
            enemy.isStunned = true;
            logMessage(`[EFEITO] O alvo está 🥶 CONGELADO e não atacará no próximo turno!`);
            break;
            
        case 'multi_target':
            let targetsHit = 0;
            // Cria uma cópia da wave para evitar problemas de índice ao remover
            const waveCopy = [...currentWave]; 
            // O alvo principal já foi atacado. Ataque adicional em mais 2.
            for (let i = 0; i < waveCopy.length && targetsHit < 2; i++) {
                if (waveCopy[i].id !== enemy.id) { 
                    const extraDamage = Math.max(0, Math.floor(player.attack * 0.5 - waveCopy[i].defense));
                    waveCopy[i].hp -= extraDamage;
                    logMessage(`[DANO MÚLTIPLO] T${currentWave.indexOf(waveCopy[i]) + 1} recebeu ${extraDamage} de DANO!`);
                    targetsHit++;
                    
                    if (waveCopy[i].hp <= 0) {
                        logMessage(`[DERROTA] ${waveCopy[i].name} (T${currentWave.indexOf(waveCopy[i]) + 1}) FOI ELIMINADO pelo ataque múltiplo!`);
                        handleEnemyDefeat(waveCopy[i]);
                    }
                }
            }
            break;
    }
    return damage;
}


function fastShotAttack(currentEnemy) {
    if (currentEnemy.hp <= 0) {
        setTimeout(enemyTurn, 500);
        return;
    }
    
    logMessage(`[PASSIVA] TIRO RÁPIDO ativou! ATAQUE EXTRA!`);
    triggerAnimation('hero-sprite', 'attacking');
    
    let damage = player.attack + Math.floor(Math.random() * 8);
    damage = applyPassiveEffects(damage); 
    
    const finalDamage = Math.max(0, Math.floor(damage - currentEnemy.defense));
    currentEnemy.hp -= finalDamage;
    logMessage(`[DANO] CAUSOU ${finalDamage} de DANO extra!`);
    
    if (currentEnemy.hp <= 0) {
        logMessage(`[DERROTA] ${currentEnemy.name} (T${currentTargetIndex + 1}) FOI DERROTADO!`);
        handleEnemyDefeat(currentEnemy);
    } else {
        setTimeout(enemyTurn, 800);
    }
    updateStats(); 
}

function handleEnemyDefeat(defeatedEnemy) {
    const index = currentWave.findIndex(e => e.id === defeatedEnemy.id);
    if (index !== -1) {
        currentWave.splice(index, 1);
    }

    // Processa recompensas
    player.exp += defeatedEnemy.expReward;
    player.gold += defeatedEnemy.goldReward;
    logMessage(`[LOOT] +${defeatedEnemy.expReward} EXP, +${defeatedEnemy.goldReward} OURO.`);

    // Drop de Poção
    if (Math.random() < (defeatedEnemy.isBoss ? 0.6 : 0.3)) { 
        player.potions++;
        logMessage(`[LOOT] ENCONTROU 1 POÇÃO!`);
    }

    // Level Up
    if (player.exp >= player.expToNextLvl) {
        player.levelUp();
    }
    
    // Atualiza o alvo para o próximo inimigo restante
    if (currentTargetIndex >= currentWave.length) {
        currentTargetIndex = Math.max(0, currentWave.length - 1);
    }

    if (currentWave.length > 0) {
        updateStats();
        // Não chama enemyTurn imediatamente, é chamado após o ataque normal/fastshot
    } else {
        waveIndex++;
        if (waveIndex < totalWaves) {
            logMessage(`[PROGRESSO] ONDA ${waveIndex} DE ${totalWaves} COMPLETA!`);
            setTimeout(() => generateWave(defeatedEnemy.isBoss, defeatedEnemy.lvl), 1500);
        } else {
            victoryEnd(defeatedEnemy.isBoss);
        }
    }
}

function usePotion() {
    if (isAnimating) return;
    isAnimating = true;

    if (player.potions > 0) {
        const heal = Math.floor(player.hpMax * 0.35) + 30; 
        player.hp = Math.min(player.hpMax, player.hp + heal);
        player.potions--;
        logMessage(`[CURA] VOCÊ USOU POÇÃO E RECUPEROU ${heal} HP.`);
        updateStats();
        turnCount++; 
        setTimeout(enemyTurn, 500);
    } else {
        logMessage("[ERRO] SEM POÇÕES RESTANTES!");
        isAnimating = false;
        showBattleMenu();
    }
}

function applyDotEffects() {
    let anyDot = false;
    currentWave.forEach(enemy => {
        if (enemy.hp <= 0) return; 
        
        // Aplica DANO DE FOGO (DOT)
        if (enemy.dotTurns > 0) {
            const damage = Math.floor(enemy.dotDamage + Math.random() * 2);
            enemy.hp -= damage;
            enemy.dotTurns--;
            logMessage(`[DOT 🔥] ${enemy.name} recebeu ${damage} de DANO de FOGO. (Restam ${enemy.dotTurns}T)`);
            anyDot = true;
        }
        
        // Aplica DANO DE VENENO (POISON)
        if (enemy.poisonTurns > 0) {
            const damage = Math.floor(enemy.dotDamage + Math.random() * 1);
            enemy.hp -= damage;
            enemy.poisonTurns--;
            logMessage(`[DOT ☣️] ${enemy.name} recebeu ${damage} de DANO de VENENO. (Restam ${enemy.poisonTurns}T)`);
            anyDot = true;
        }
        
        // Reverte DEF temporária (Explosão Arcana)
        if (enemy.tempDefDown) {
            enemy.defense = enemy.initialDefense;
            enemy.tempDefDown = false;
            logMessage(`[EFEITO] DEFESA do inimigo voltou ao normal: ${enemy.defense.toFixed(1)}`);
        }
        
        // Verifica se o inimigo morreu pelo DOT
        if (enemy.hp <= 0 && currentWave.includes(enemy)) {
             logMessage(`[DERROTA] ${enemy.name} (T${currentWave.indexOf(enemy) + 1}) FOI DERROTADO pelo dano de status!`);
             handleEnemyDefeat(enemy);
        }
    });
    return anyDot;
}


function enemyTurn() {
    if (player.hp <= 0) return gameOver();
    
    // 1. Aplica DOTs e reverte DEF antes do ataque inimigo
    applyDotEffects();
    
    if (currentWave.length === 0) {
        isAnimating = false;
        return;
    }
    
    const enemySprite = document.getElementById('enemy-sprite');

    // 2. Inimigos atacam
    currentWave.forEach(attacker => {
        if (attacker.hp > 0) {
            if (attacker.isStunned) {
                logMessage(`[ATRASO] ${attacker.name} está 🥶 CONGELADO e perdeu o turno!`);
                attacker.isStunned = false; // Stun dura 1 turno
                return;
            }

            enemySprite.style.animation = 'attack-move 0.3s ease-in-out reverse'; 
            setTimeout(() => enemySprite.style.animation = '', 300);

            const damage = attacker.attack + Math.floor(Math.random() * 5);
            const finalDamage = Math.max(0, Math.floor(damage - player.defense));
            player.hp -= finalDamage;
            logMessage(`[ATAQUE] ${attacker.name} ATACOU, CAUSANDO ${finalDamage} DE DANO!`);

            triggerAnimation('hero-sprite', 'receiving-damage');
        }
    });

    updateStats();
    
    if (player.hp <= 0) {
        setTimeout(gameOver, 500);
    } else {
        setTimeout(showBattleMenu, 800);
    }
}

function victoryEnd(wasBossBattle) {
    logMessage(wasBossBattle ? 
        `[VITÓRIA] A ZONA FOI LIMPA! CHEFE DERROTADO!` : 
        `[VITÓRIA] MONSTROS DERROTADOS!`);
    
    // Se foi uma exploração normal, aumenta o contador
    if (!wasBossBattle) {
        exploresCompleted++;
        logMessage(`[PROGRESSO] Explorações completadas: ${exploresCompleted}/${ZONAS[zonaAtual].exploresNeeded}`);
    }
    
    // CHANCE DE PEGAR CHAVE SECRETA (EASTER EGG)
    if (wasBossBattle && Math.random() < 0.10 && !player.secretKey && !isGodModeActive) { 
         player.secretKey = true;
         logMessage(`[LOOT RARO] 🔑 VOCÊ ENCONTROU UMA CHAVE SECRETA! Guarde-a bem.`);
    }

    currentWave = [];
    totalWaves = 0;
    waveIndex = 0;
    isAnimating = false;
    setTimeout(showMainMenu, 3000);
}

function gameOver() {
    logMessage(`[FIM DE JOGO] VOCÊ FOI DERROTADO NO NÍVEL ${player.lvl}.`);
    document.getElementById('battle-display').style.display = 'none';
    updateActions(`<button onclick="location.reload()">RECOMEÇAR JORNADA</button>`);
    isAnimating = false;
}

function attemptToFlee() {
    if (isAnimating) return;
    isAnimating = true;

    if (Math.random() < 0.5) { // 50% de chance de fugir
        logMessage("[FUGA] VOCÊ CONSEGUE ESCAPAR DA BATALHA!");
        currentWave = [];
        totalWaves = 0;
        waveIndex = 0;
        isAnimating = false;
        setTimeout(showMainMenu, 1500);
    } else {
        logMessage("[FUGA] FALHA NA FUGA! O INIMIGO TE CERCA.");
        isAnimating = false;
        turnCount++;
        setTimeout(enemyTurn, 800);
    }
}


// --- SISTEMA DE CENTRO DE TREINAMENTO (LOJA/SKILL TREE/EQUIPAMENTO) ---
function openShop() {
    changeScreen('shop'); 
    const potionPrice = 30 + (zonaAtual * 5);
    
    // --- SKILLS ATIVAS E EQUIPAMENTO ---
    let activeSkillButtons = '<h3>HABILIDADES ATIVAS (Equipar - 1 por vez):</h3>';
    const classActiveSkills = SKILLS.ACTIVE[player.class];
    
    for (const key in classActiveSkills) {
        const skill = classActiveSkills[key];
        const isUnlocked = player.unlockedActiveSkills[key];
        const isEquipped = player.equippedActiveSkill.id === key;
        const canBuy = player.skillPoints >= skill.custo && !isUnlocked;
        
        activeSkillButtons += `
            <div class="skill-item ${isEquipped ? 'equipped' : ''}">
                <p><strong>${isEquipped ? '✅' : (isUnlocked ? '🌟' : '🔒')} ${skill.nome} (CD: ${skill.custo})</strong></p>
                <p class="desc">${skill.descricao}</p>
                ${isUnlocked ? 
                    `<button onclick="equipSkill('${key}')" ${isEquipped ? 'disabled' : ''}>${isEquipped ? 'EQUIPADO' : 'EQUIPAR'}</button>` :
                    `<button onclick="buySkill('ACTIVE', '${key}', ${skill.custo})" ${!canBuy ? 'disabled' : ''}>COMPRAR (${skill.custo} SP)</button>`
                }
            </div>
        `;
    }

    // --- SKILLS PASSIVAS ---
    let passiveSkillButtons = '<h3>HABILIDADES PASSIVAS (Permanentes - SP):</h3>';
    
    for (const key in SKILLS.PASSIVE) {
        const skill = SKILLS.PASSIVE[key];
        const isUnlocked = player.unlockedPassiveSkills[key];
        const canBuy = player.skillPoints >= skill.custo && !isUnlocked;
        
        passiveSkillButtons += `
            <button onclick="buySkill('PASSIVE', '${key}', ${skill.custo})" ${!canBuy ? 'disabled' : ''} class="${isUnlocked ? 'btn-bought' : ''}">
                ${isUnlocked ? '✅' : `(${skill.custo} SP)`} ${skill.nome}: ${skill.descricao}
            </button>
        `;
    }


    const menu = `
        <p>SEU OURO: <span id="player-gold-shop">${player.gold}</span> | SEUS PONTOS SP: <span id="player-sp-shop">${player.skillPoints}</span> | POÇÕES: ${player.potions}</p>
        
        <div class="shop-group">
            <h3>MERCADOR (OURO)</h3>
            <div class="shop-buttons-area">
                <button onclick="buyItem('potion', ${potionPrice})">COMPRAR POÇÃO (${potionPrice} OURO)</button>
            </div>
        </div>
        
        <div class="shop-group skill-tree-area">
            ${activeSkillButtons}
            ${passiveSkillButtons}
        </div>
        
        <div class="shop-input-area">
            <input type="text" id="easter-egg-input" placeholder="Código secreto (opcional)">
            <button onclick="checkEasterEgg()">🔍 USAR CÓDIGO</button>
        </div>
        
        <button onclick="showMainMenu()" class="btn-return">VOLTAR AO MENU</button>
    `;
    document.getElementById('shop-area').innerHTML = menu;
    updateStats();
}

function equipSkill(skillId) {
    if (player.unlockedActiveSkills[skillId]) {
        const newSkill = player.unlockedActiveSkills[skillId];
        player.equippedActiveSkill = newSkill;
        // Reseta o cooldown para o novo CD da skill
        player.lastSpecialTurn = turnCount - newSkill.custo; 
        logMessage(`[EQUIP] Habilidade Ativa: "${newSkill.nome}" equipada com sucesso!`);
        openShop(); 
    } else {
        logMessage("[ERRO] Habilidade não desbloqueada.");
    }
}

function buySkill(type, skillKey, cost) {
    if (player.skillPoints >= cost) {
        let skill;
        let unlockedSkills;

        if (type === 'ACTIVE') {
            skill = SKILLS.ACTIVE[player.class][skillKey];
            unlockedSkills = player.unlockedActiveSkills;
        } else if (type === 'PASSIVE') {
            skill = SKILLS.PASSIVE[skillKey];
            unlockedSkills = player.unlockedPassiveSkills;
        }

        if (unlockedSkills && skill && !unlockedSkills[skillKey]) {
            player.skillPoints -= cost;
            unlockedSkills[skillKey] = skill;

            // Efeitos permanentes de PASSIVAS
            if (type === 'PASSIVE') {
                if (skill.defBonus) player.defense += skill.defBonus;
                if (skill.atkBonus) player.attack += skill.atkBonus;
                if (skill.hpBonus) {
                    player.hpMax += skill.hpBonus;
                    player.hp += skill.hpBonus;
                }
                logMessage(`[SKILL PERMANENTE] Você aprimorou ${skill.nome}!`);
            } else {
                logMessage(`[SKILL] VOCÊ DESBLOQUEOU A ATIVA ${skill.nome}!`);
            }
            
        } else if (unlockedSkills && skill && unlockedSkills[skillKey]) {
            logMessage(`[ERRO] VOCÊ JÁ POSSUI ESSA HABILIDADE.`);
        } else {
            logMessage(`[ERRO] Tipo de habilidade inválido.`);
        }
    } else {
        logMessage(`[ERRO] PONTOS SP INSUFICIENTES!`);
    }
    updateStats();
    openShop();
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
    openShop(); 
}

function checkEasterEgg() {
    const code = document.getElementById('easter-egg-input').value.toUpperCase().trim();
    document.getElementById('easter-egg-input').value = ""; 
    
    if (code === "GODMODE" && !isGodModeActive) { 
        isGodModeActive = true;
        player.hpMax += 700; 
        player.hp = player.hpMax;
        player.attack += 150;
        player.defense += 80;
        player.gold += 5000;
        player.potions += 20;
        player.secretKey = true; 
        logMessage(`[CHEAT ATIVADO] 🌟 O PODER DE "GODMODE" FOI CONCEDIDO!`);
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
    // Garante que o jogo comece na tela inicial.
    changeScreen('initial'); 
});
// --- Musica ---
let isMusicPlaying = false;
const music = document.getElementById('background-music');
const musicButton = document.getElementById('music-toggle');

function toggleMusic() {
    if (isMusicPlaying) {
        music.pause();
        musicButton.textContent = '🔇 Música Desativada';
        isMusicPlaying = false;
    } else {
        music.muted = false; // Desmuta
        music.play().catch(error => {
            console.error("Erro ao tentar tocar a música:", error);
            musicButton.textContent = '❌ Erro ao Tocar Música';
            // Se o navegador barrar o autoplay, o usuário terá que clicar de novo.
        });
        musicButton.textContent = '🔊 Música Ativada';
        isMusicPlaying = true;
    }
}