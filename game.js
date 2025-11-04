Ótima ideia\! Adicionar um **cooldown** (tempo de recarga) à habilidade única de cada classe trará mais estratégia e balanceamento ao combate.

Para implementar isso, faremos modificações no arquivo `game.js`.

### 🧠 Arquivo: `game.js` (Lógica de Cooldown)

Vamos adicionar uma nova variável no objeto `Player` para rastrear o estado do cooldown e modificar as funções de ataque e menu de batalha.

```javascript
// --- DADOS E VARIÁVEIS DO JOGO ---
// (ZONAS e BASE_STATS permanecem inalterados)

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

// Cooldown em turnos
const SKILL_COOLDOWN = 3; 

let player;
let currentEnemy;
let isAnimating = false;
let zonaAtual = 0;

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
        // NOVO: Cooldown da habilidade única (turnos restantes)
        this.skillCooldown = 0; 
    }

    levelUp() {
        this.lvl++;
        this.exp -= this.expToNextLvl;
        this.expToNextLvl = Math.floor(this.expToNextLvl * 1.5);
        this.statPoints += 5;
        this.hpMax += 10;
        this.hp = this.hpMax;
        logMessage(`[LVL UP] VOCÊ ALCANÇOU O NÍVEL ${this.lvl}! PONTOS GANHOS.`);
        
        if (!currentEnemy) {
            changeScreen('stats'); 
        }
    }
}

// O restante da Classe Enemy permanece inalterado

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

// --- GERENCIAMENTO DE TELAS (Inalterado) ---

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

// --- FUNÇÕES DE INTERFACE (Inalterado) ---

function updateStats() {
    if (!player) return;

    // ... (Parte de atualização do Status Box e HUD do Herói permanece inalterada) ...
    // Eu omiti a maior parte desta função para focar nas mudanças de lógica.
    
    // --- Atualização do Status Box (Geral) ---
    const statsHtml = `
        <p>ZONA: ${ZONAS[zonaAtual].sprite} ${ZONAS[zonaAtual].nome} | NÍVEL: ${player.lvl} (PONTOS: ${player.statPoints})</p>
        <p>NOME: ${player.name} | CLASSE: ${player.class} | OURO: ${player.gold} | POÇÕES: ${player.potions}</p>
        <p>HP: ${Math.max(0, player.hp)}/${player.hpMax} | ATK: ${player.attack} | DEF: ${player.defense} | EXP: ${player.exp}/${player.expToNextLvl}</p>
    `;
    
    document.getElementById('player-stats').innerHTML = `<h2>STATUS GERAL</h2>${statsHtml}`;
    document.getElementById('player-stats-summary').innerHTML = statsHtml;
    document.getElementById('player-gold-shop').textContent = player.gold;
    
    // --- Atualização do HUD de Batalha (Simplificado) ---
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

// ... (Funções de setup, level up, etc., inalteradas) ...

function showBattleMenu() {
    updateStats();
    if (isAnimating) return;
    
    let skillButton;
    
    if (player.skillCooldown > 0) {
        // Se a habilidade estiver em cooldown
        skillButton = `<button disabled>2. HABILIDADE ÚNICA (CD: ${player.skillCooldown})</button>`;
    } else {
        // Se a habilidade estiver pronta
        skillButton = `<button onclick="playerAttack('special')">2. HABILIDADE ÚNICA</button>`;
    }
    
    const buttons = `
        <button onclick="playerAttack('normal')">1. ATK BÁSICO</button>
        ${skillButton}
        <button onclick="usePotion()">3. USAR POÇÃO (${player.potions})</button>
        <button onclick="attemptToFlee()">4. TENTAR FUGIR</button>
    `;
    updateActions(buttons);
}

// --- FUNÇÕES DE COMBATE ---

// ... (attemptToFlee permanece inalterado) ...

function playerAttack(type) {
    if (!currentEnemy || isAnimating) return;
    isAnimating = true;
    triggerAnimation('hero-sprite', 'attacking');

    let damage = 0;
    
    if (type === 'normal') {
        damage = player.attack + Math.floor(Math.random() * 8);
        logMessage(`[AÇÃO] ${player.class} USA ATK BÁSICO.`);
        
        // NOVO: Diminui o cooldown no turno de ataque básico
        if (player.skillCooldown > 0) {
            player.skillCooldown--;
            logMessage(`[CD] COOLDOWN DA HABILIDADE ÚNICA: ${player.skillCooldown}.`);
        }
        
    } else if (type === 'special') {
        
        if (player.skillCooldown > 0) {
            logMessage("[ERRO] HABILIDADE EM COOLDOWN. ESCOLHA OUTRA AÇÃO.");
            isAnimating = false;
            showBattleMenu();
            return;
        }

        // --- ATIVAR HABILIDADE ÚNICA ---
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
        
        // NOVO: Ativa o cooldown após o uso da habilidade
        player.skillCooldown = SKILL_COOLDOWN; 
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
        
        // NOVO: Diminui o cooldown mesmo usando poção
        if (player.skillCooldown > 0) {
            player.skillCooldown--;
            logMessage(`[CD] COOLDOWN DA HABILIDADE ÚNICA: ${player.skillCooldown}.`);
        }
        
        setTimeout(enemyTurn, 500);
    } else {
        logMessage("[ERRO] SEM POÇÕES RESTANTES!");
        isAnimating = false;
        showBattleMenu();
    }
}


function enemyTurn() {
    if (player.hp <= 0) return gameOver();

    // NOVO: Diminui o cooldown após o turno do inimigo
    if (player.skillCooldown > 0) {
        player.skillCooldown--;
        logMessage(`[CD] COOLDOWN DA HABILIDADE ÚNICA: ${player.skillCooldown}.`);
    }

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
    // ... (Lógica de vitória permanece inalterada) ...

    // NOVO: Reseta o cooldown ao fim da batalha
    player.skillCooldown = 0; 
    
    currentEnemy = null;
    updateStats(); 
    isAnimating = false;
    setTimeout(showMainMenu, 3000);
}

// ... (Funções de game over, loja, etc., inalteradas) ...
```

### 📋 Instruções de Implementação

1.  **Mantenha** os arquivos `index.html` e `style.css` da última versão.
2.  **Substitua integralmente** o conteúdo do seu arquivo **`game.js`** pelo código acima.

Agora, a habilidade única terá um cooldown de **3 turnos** de batalha, forçando o jogador a usar ataques básicos ou poções enquanto espera a recarga\!