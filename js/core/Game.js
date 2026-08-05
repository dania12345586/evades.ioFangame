// js/core/Game.js

window.ability1Icon = new Image();
window.ability2Icon = new Image();
window.ability3Icon = new Image();

let iconsReady = false;
let iconsLoaded = 0;
function onIconLoad() {
    iconsLoaded++;
    if (iconsLoaded === 3) iconsReady = true;
}

function loadHeroIcons(heroClass) {
    const isSylvanus = heroClass === Sylvanus;
    const isCrepitus = heroClass === Crepitus;
    const isVortex = heroClass === Vortex;
    window.ability1Icon = new Image();
    window.ability2Icon = new Image();
    window.ability3Icon = new Image();
    iconsLoaded = 0;
    iconsReady = false;

    let basePath = '';
    if (isSylvanus) {
        basePath = 'assets/abilities/sylvanus';
    } else if (isCrepitus) {
        basePath = 'assets/abilities/crepitus';
    } else if (isVortex) {
        basePath = 'assets/abilities/vortex';
    } else {
        basePath = 'assets/abilities/scutum';
    }

    if (isCrepitus || isVortex) {
        window.ability1Icon.src = `${basePath}1.png`;
        window.ability2Icon.src = `${basePath}2.png`;
        window.ability3Icon.src = `${basePath}3.png`;
        window.ability1Icon.onload = onIconLoad;
        window.ability2Icon.onload = onIconLoad;
        window.ability3Icon.onload = onIconLoad;
    } else {
        window.ability1Icon.src = `${basePath}1.png`;
        window.ability2Icon.src = `${basePath}2.png`;
        window.ability3Icon.src = '';
        window.ability1Icon.onload = onIconLoad;
        window.ability2Icon.onload = onIconLoad;
        iconsLoaded = 2;
        iconsReady = true;
    }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const SCALE = 0.6;

let level, manager, player, currentMap;
let gameOver = false;
let isWin = false;
let HeroClass = Scutum;
let currentMapIndex = 0;
let isTransitioning = false;

// === МУЛЬТИПЛЕЕРНЫЕ ПЕРЕМЕННЫЕ ===
let myPlayerId = null;
let myRoomId = null;
let otherPlayers = {};

const maps = [
    { name: 'Chaos Core', class: BasicCoreMap },
    { name: 'Primal Peaks', class: PrimalPeaksMap },
    { name: 'Factory Fortress', class: FactoryFortressMap }
];

function startGameWithHero(heroClass, mapIndex = 0) {
    HeroClass = heroClass;
    currentMapIndex = mapIndex;
    loadHeroIcons(heroClass);
    const MapClass = maps[mapIndex].class;
    currentMap = new MapClass();
    
    level = new Level();
    level.setConfigs(currentMap.levels, currentMap.name);
    level.mapWidth = Math.floor((currentMap.mapWidth || 2600) * 1.3);
    level.mapHeight = currentMap.mapHeight || 700;
    level.safeZoneWidth = currentMap.safeZoneWidth || 300;

    player = new heroClass(105, 400);
    level.initLevel(player, 'forward');

    manager = new LevelManager(level, player);
    manager.generatePellets(20);

    gameOver = false;
    isWin = false;
    isTransitioning = false;

    // === СОЗДАНИЕ ИГРОКА В SUPABASE ===
    initMultiplayer(heroClass.name);

    if (window.__animId) {
        cancelAnimationFrame(window.__animId);
        window.__animId = null;
    }
    gameLoop();
}

async function initMultiplayer(heroName) {
    try {
        // 1. Создаём игрока
        const playerData = await createPlayer('Player', heroName);
        if (!playerData) {
            console.error('Failed to create player');
            return;
        }
        myPlayerId = playerData.id;
        console.log('Player created:', myPlayerId);

        // 2. Используем фиксированную комнату
        const roomId = '00000000-0000-0000-0000-000000000001';
        myRoomId = roomId;

        // 3. Входим в комнату
        await joinRoom(myPlayerId, myRoomId);
        console.log('Joined room:', myRoomId);

        // 4. Подписываемся на обновления других игроков
        subscribeToRoom(myRoomId, myPlayerId, (id, x, y, hp, isAlive) => {
            if (!otherPlayers[id]) {
                otherPlayers[id] = { x, y, hp, isAlive, targetX: x, targetY: y };
            } else {
                otherPlayers[id].targetX = x;
                otherPlayers[id].targetY = y;
                otherPlayers[id].hp = hp;
                otherPlayers[id].isAlive = isAlive;
            }
        });
    } catch (error) {
        console.error('Multiplayer init error:', error);
    }
}

function switchMap(newMapIndex) {
    if (isTransitioning) return;
    isTransitioning = true;
    currentMapIndex = newMapIndex;
    const MapClass = maps[newMapIndex].class;
    currentMap = new MapClass();
    
    level = new Level();
    level.setConfigs(currentMap.levels, currentMap.name);
    level.mapWidth = Math.floor((currentMap.mapWidth || 2600) * 1.3);
    level.mapHeight = currentMap.mapHeight || 700;
    level.safeZoneWidth = currentMap.safeZoneWidth || 300;
    
    const heroClass = player.constructor;
    const newPlayer = new heroClass(105, level.mapHeight / 2);
    newPlayer.level = player.level;
    newPlayer.exp = player.exp;
    newPlayer.expToNext = player.expToNext;
    newPlayer.skillPoints = player.skillPoints;
    newPlayer.speed = player.speed;
    newPlayer.maxEnergy = player.maxEnergy;
    newPlayer.energyRegen = player.energyRegen;
    newPlayer.ability1Level = player.ability1Level;
    newPlayer.ability2Level = player.ability2Level;
    newPlayer.color = player.color;
    newPlayer.alive = player.alive;
    newPlayer.isDead = player.isDead;
    newPlayer.respawnTimer = player.respawnTimer;
    newPlayer.godMode = player.godMode;
    // Копируем специфичные поля
    if (player.mines) newPlayer.mines = player.mines.slice();
    if (player.activeRocket) newPlayer.activeRocket = player.activeRocket;
    if (player.teslaStation !== undefined) {
        newPlayer.teslaStation = player.teslaStation;
        newPlayer.teslaCooldown = player.teslaCooldown;
        newPlayer.teslaOnCooldown = player.teslaOnCooldown;
        newPlayer.teslaEnergyTimer = player.teslaEnergyTimer;
        newPlayer.portal1 = player.portal1;
        newPlayer.portal2 = player.portal2;
        newPlayer.portalStage = player.portalStage;
        newPlayer.portalCooldown = player.portalCooldown;
        newPlayer.portalActive = player.portalActive;
    }
    player = newPlayer;
    player.respawn(105, level.mapHeight / 2);
    
    level.initLevel(player, 'forward');
    
    manager = new LevelManager(level, player);
    manager.generatePellets(20);
    manager.completedLevels = [];
    gameOver = false;
    isWin = false;
    level.isComplete = false;
    level.isWin = false;
    level.direction = 'forward';
    isTransitioning = false;
    if (window.__animId) {
        cancelAnimationFrame(window.__animId);
        window.__animId = null;
    }
    gameLoop();
}

function drawLevelName() {
    const displayName = level.getDisplayName();
    if (!displayName) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const fontSize = 36;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.shadowColor = 'rgba(200,200,200,0.8)';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 4;

    let textColor = '#ffffff';
    if (currentMap.name === 'Primal Peaks') {
        textColor = '#4CAF50';
    } else if (currentMap.name === 'Factory Fortress') {
        textColor = '#ff8800';
    }
    ctx.strokeStyle = '#aaaaaa';
    ctx.strokeText(displayName, canvas.width / 2, 20);
    ctx.shadowBlur = 0;
    ctx.fillStyle = textColor;
    ctx.fillText(displayName, canvas.width / 2, 20);
    ctx.restore();
}

function gameLoop() {
    if (gameOver) {
        if (isWin) drawWinScreen();
        else drawDeathScreen();
        return;
    }

    if (player) {
        if (player.venomSlowActive) {
            // оставляем 0.5
        } else if (manager.redSlowActive) {
            player.slowModifier = 0.7;
        } else if (manager.isParalyzed) {
            player.slowModifier = 0;
        } else {
            player.slowModifier = 1;
        }
    }

    if (player.alive && !player.isDead) {
        player.update(keys, level.mapWidth, level.mapHeight);
        if (player.updateAbilities) player.updateAbilities();
        if (player.checkDashHit) player.checkDashHit(level.enemies);
        if (player.checkWaveHit) player.checkWaveHit(level.enemies);
        player.updateStunnedEnemies();
    } else if (player.isDead) {
        player.respawnTimer -= 0.016;
        if (player.respawnTimer <= 0) {
            gameOver = true;
            drawDeathScreen();
            return;
        }
    }

    level.update();
    manager.update();

    // === СИНХРОНИЗАЦИЯ ПОЗИЦИИ С SUPABASE ===
    if (myPlayerId && player.alive) {
        syncPosition(myPlayerId, player.x, player.y, 100, player.energy, player.alive);
    }

    // === Межкартовые порталы ===
    if (currentMapIndex === 0 && level.levelNumber === 1 && player.alive) {
        const px = player.x;
        const py = player.y;
        if (px >= 0 && px <= level.safeZoneWidth && py >= 0 && py <= 40) {
            switchMap(1);
            return;
        }
    }
    if (currentMapIndex === 1 && level.levelNumber === 1 && player.alive) {
        const px = player.x;
        const py = player.y;
        if (px >= 0 && px <= level.safeZoneWidth && py >= level.mapHeight - 40 && py <= level.mapHeight) {
            switchMap(0);
            return;
        }
    }
    if (currentMapIndex === 1 && level.levelNumber === 1 && player.alive) {
        const px = player.x;
        const py = player.y;
        if (px >= 0 && px <= level.safeZoneWidth && py >= 0 && py <= 40) {
            switchMap(2);
            return;
        }
    }
    if (currentMapIndex === 2 && level.levelNumber === 1 && player.alive) {
        const px = player.x;
        const py = player.y;
        if (px >= 0 && px <= level.safeZoneWidth && py >= 0 && py <= 40) {
            switchMap(1);
            return;
        }
    }

    // === Victory ===
    if (level.isVictory && player.alive) {
        let portalX = (level.portalSide === 'left') ? 0 : level.mapWidth - 40;
        if (player.x >= portalX && player.x <= portalX + 40) {
            level.goToLevel(1);
            level.isComplete = false;
            level.isWin = false;
            level.direction = 'forward';
            manager.clearEffects();
            if (window.__animId) {
                cancelAnimationFrame(window.__animId);
                window.__animId = null;
            }
            gameLoop();
            return;
        }
    }

    // === Обычные переходы между уровнями (только если игрок жив) ===
    if (level.isComplete && player.alive) {
        if (level.isWin) {
            gameOver = true;
            isWin = true;
            drawWinScreen();
            return;
        } else if (level.direction === 'back') {
            level.goToPrevLevel();
            const pos = level.getSpawnPosition('back');
            player.respawn(pos.x, pos.y);
            player.setShield(false);
            level.isComplete = false;
            manager.awardExpForLevel();
            manager.clearEffects();
        } else {
            level.goToNextLevel();
            const pos = level.getSpawnPosition('forward');
            player.respawn(pos.x, pos.y);
            player.setShield(false);
            level.isComplete = false;
            manager.awardExpForLevel();
            manager.clearEffects();
        }
    }

    render();
    drawLevelName();
    drawBottomPanel();

    window.__animId = requestAnimationFrame(gameLoop);
}

function render() {
    const offsetX = canvas.width / 2 - player.x * SCALE;
    const offsetY = canvas.height / 2 - player.y * SCALE;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    const mapX = offsetX;
    const mapY = offsetY;
    const mapW = level.mapWidth * SCALE;
    const mapH = level.mapHeight * SCALE;
    ctx.beginPath();
    ctx.rect(mapX, mapY, mapW, mapH);
    ctx.clip();

    ctx.fillStyle = currentMap.backgroundColor || '#1a1a2e';
    ctx.fillRect(offsetX, offsetY, mapW, mapH);

    level.draw(ctx, offsetX, offsetY, SCALE);
    manager.drawPellets(ctx, offsetX, offsetY, SCALE);
    if (manager.drawExplosions) manager.drawExplosions(ctx, offsetX, offsetY, SCALE);

    ctx.restore();

    // Рисуем своего игрока
    player.draw(ctx, SCALE);
    if (player.drawEffects) player.drawEffects(ctx, SCALE);

    // === РИСУЕМ ДРУГИХ ИГРОКОВ ===
    for (const id in otherPlayers) {
        const p = otherPlayers[id];
        // Интерполяция для плавности
        if (p.targetX !== undefined) {
            p.x += (p.targetX - p.x) * 0.15;
            p.y += (p.targetY - p.y) * 0.15;
        }
        // Рисуем кружок другого игрока
        const drawX = (p.x - player.x) * SCALE + canvas.width/2;
        const drawY = (p.y - player.y) * SCALE + canvas.height/2;
        const drawR = player.radius * SCALE;

        // Если игрок не жив, рисуем серым
        if (p.isAlive === false) {
            ctx.fillStyle = '#666';
            ctx.globalAlpha = 0.5;
        } else {
            ctx.fillStyle = '#4ecdc4'; // можно потом задавать цвет героя
            ctx.globalAlpha = 1;
        }
        ctx.beginPath();
        ctx.arc(drawX, drawY, drawR, 0, Math.PI * 2);
        ctx.fill();
        // Обводка
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // === Порталы ===
    if (currentMapIndex === 0 && level.levelNumber === 1) {
        const portalX = offsetX;
        const portalY = offsetY;
        const portalW = level.safeZoneWidth * SCALE;
        const portalH = 40 * SCALE;
        ctx.fillStyle = 'rgba(0, 100, 255, 0.25)';
        ctx.fillRect(portalX, portalY, portalW, portalH);
        ctx.strokeStyle = 'rgba(0, 100, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(portalX, portalY, portalW, portalH);
    }
    if (currentMapIndex === 1 && level.levelNumber === 1) {
        const safeW = level.safeZoneWidth * SCALE;
        const portalLowX = offsetX;
        const portalLowY = offsetY + level.mapHeight * SCALE - 40 * SCALE;
        const portalLowH = 40 * SCALE;
        ctx.fillStyle = 'rgba(255, 100, 0, 0.25)';
        ctx.fillRect(portalLowX, portalLowY, safeW, portalLowH);
        ctx.strokeStyle = 'rgba(255, 100, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(portalLowX, portalLowY, safeW, portalLowH);
        const portalUpX = offsetX;
        const portalUpY = offsetY;
        const portalUpH = 40 * SCALE;
        ctx.fillStyle = 'rgba(255, 136, 0, 0.25)';
        ctx.fillRect(portalUpX, portalUpY, safeW, portalUpH);
        ctx.strokeStyle = 'rgba(255, 136, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(portalUpX, portalUpY, safeW, portalUpH);
    }
    if (currentMapIndex === 2 && level.levelNumber === 1) {
        const portalX = offsetX;
        const portalY = offsetY;
        const portalW = level.safeZoneWidth * SCALE;
        const portalH = 40 * SCALE;
        ctx.fillStyle = 'rgba(255, 136, 0, 0.25)';
        ctx.fillRect(portalX, portalY, portalW, portalH);
        ctx.strokeStyle = 'rgba(255, 136, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(portalX, portalY, portalW, portalH);
    }

    // Полоска энергии
    const energyBarWidth = 34;
    const energyBarHeight = 4;
    const barX = canvas.width/2 - energyBarWidth/2;
    const barY = canvas.height/2 - player.radius * SCALE - 12;
    const energyPercent = player.energy / player.maxEnergy;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX, barY, energyBarWidth, energyBarHeight);
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(barX, barY, energyBarWidth * energyPercent, energyBarHeight);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, energyBarWidth, energyBarHeight);

    // Полоска паралича
    if (manager.paralyzeTimer > 0 || manager.isParalyzed) {
        const barWidth = 60;
        const barHeight = 6;
        const barX2 = canvas.width/2 - barWidth/2;
        const barY2 = canvas.height/2 - player.radius * SCALE - 20;
        const progress = Math.min(manager.paralyzeTimer / manager.paralyzeThreshold, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX2, barY2, barWidth, barHeight);
        ctx.fillStyle = manager.isParalyzed ? '#ff4444' : '#ffdd44';
        ctx.fillRect(barX2, barY2, barWidth * progress, barHeight);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX2, barY2, barWidth, barHeight);
    }
    if (manager.isParalyzed) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PARALYZED', canvas.width/2, canvas.height/2 - 60);
    }
}

function drawDeathScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (manager && manager.drawExplosions) {
        const offsetX = canvas.width / 2 - player.x * SCALE;
        const offsetY = canvas.height / 2 - player.y * SCALE;
        manager.drawExplosions(ctx, offsetX, offsetY, SCALE);
    }
    ctx.fillStyle = '#fff';
    ctx.font = '44px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('💀 Game Over', canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = '20px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 40);
}

function drawWinScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffd700';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 VICTORY!', canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = '20px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 40);
}

const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (e.code >= 'Digit1' && e.code <= 'Digit5') {
        const index = parseInt(e.code.charAt(5)) - 1;
        if (player && player.alive) {
            player.levelUpStat(index);
        }
    }

    if (e.code === 'KeyZ') {
        if (player && player.alive) {
            if (player.activateRootZone) {
                player.activateRootZone();
            } else if (player.activateDash) {
                player.activateDash();
            } else if (player.activateMine) {
                player.activateMine();
            } else if (player.activatePortal) {
                player.activatePortal();
            }
        }
    }
    if (e.code === 'KeyX') {
        if (player && player.alive) {
            if (player.activateBark) {
                player.activateBark();
            } else if (player.activateWave) {
                player.activateWave();
            } else if (player.activateRocket) {
                player.activateRocket();
            } else if (player.activateTesla) {
                player.activateTesla();
            }
        }
    }

    if (e.code === 'KeyG') {
        if (player) {
            player.godMode = !player.godMode;
        }
    }

    if (e.code === 'KeyP' && player && player.alive) {
        const input = prompt(`Enter level number (1-${level.configs.length}):`, level.levelNumber);
        if (input !== null) {
            const lvl = parseInt(input);
            if (!isNaN(lvl) && lvl >= 1 && lvl <= level.configs.length) {
                level.goToLevel(lvl);
                gameOver = false;
                isWin = false;
                manager.clearEffects();
            } else {
                alert(`Invalid level. Must be between 1 and ${level.configs.length}.`);
            }
        }
    }

    if (e.code === 'KeyR' && gameOver) {
        const heroClass = player.constructor;
        level.levelNumber = 1;
        startGameWithHero(heroClass, currentMapIndex);
    }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

window.onload = function() {
    showHeroMenu();
};