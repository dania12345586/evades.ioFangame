// js/level.js

class Level {
    constructor() {
        this.levelNumber = 1;
        this.enemies = [];
        this.player = null;
        this.isComplete = false;
        this.mapWidth = 2600;
        this.mapHeight = 700;
        this.safeZoneWidth = 300;
        this.direction = 'forward';
        this.isWin = false;
        this.configs = [];
        this.BASE_LEVEL_NAME = "";
        this.isVictory = false;
        this.victoryColor = null;
        this.portalSide = 'right';
        this.isFinal = false;

        this.projectiles = [];
        this.toxicTrails = [];
        this.slashStates = new Map();
        this.mines = [];
        this.orangeAuraEnemies = [];
    }

    setConfigs(configs, baseName) {
        this.configs = configs;
        this.BASE_LEVEL_NAME = baseName || "";
        if (configs.length > 0 && configs[0].mapWidth) {
            this.mapWidth = configs[0].mapWidth;
            this.mapHeight = configs[0].mapHeight;
            this.safeZoneWidth = configs[0].safeZoneWidth || 300;
        }
    }

    getConfig() {
        const idx = Math.min(this.levelNumber - 1, this.configs.length - 1);
        return this.configs[idx] || this.configs[0];
    }

    getDisplayName() {
        const config = this.getConfig();
        return config.name || `${this.BASE_LEVEL_NAME} ${this.levelNumber}`;
    }

    getSpawnPosition(direction = 'forward') {
        if (direction === 'back') {
            return { x: this.mapWidth - 200, y: this.mapHeight / 2 };
        } else {
            return { x: 105, y: this.mapHeight / 2 };
        }
    }

    createEnemy(type, x, y, speed, radius, index = 0, total = 1) {
        switch(type) {
            case 'basic': return new Enemy(x, y, speed, radius);
            case 'red': return new RedEnemy(x, y, speed, radius);
            case 'blue': return new BlueEnemy(x, y, speed, radius);
            case 'yellow': return new YellowEnemy(x, y, speed, radius);
            case 'darkred': return new DarkRedEnemy(x, y, speed, radius);
            case 'venom': {
                const v = new VenomSpitter(x, y, speed, radius);
                v.setPlayerRef(this.player);
                return v;
            }
            case 'toxic': {
                const t = new ToxicEnemy(x, y, speed, radius);
                return t;
            }
            case 'slash': {
                const s = new SlashEnemy(x, y, speed, radius);
                s.setPlayerRef(this.player);
                return s;
            }
            case 'black':
                return new BlackEnemy(x, y, speed, radius, this.safeZoneWidth, this.mapWidth, this.mapHeight, index, total);
            case 'tree': return new TreeEnemy(x, y);
            case 'turret': return new TurretEnemy(x, y, speed, radius);
            case 'bomber': return new BomberEnemy(x, y, speed, radius);
            case 'orangeaura': return new OrangeAuraEnemy(x, y, speed, radius);
            case 'stealth': return new StealthEnemy(x, y, speed, radius);
            default: return new Enemy(x, y, speed, radius);
        }
    }

    initLevel(player, direction = 'forward') {
        this.player = player;
        this.enemies = [];
        this.isComplete = false;
        this.direction = direction;
        this.isWin = false;
        this.isVictory = false;
        this.victoryColor = null;
        this.portalSide = 'right';
        this.isFinal = false;

        this.projectiles = [];
        this.toxicTrails = [];
        this.slashStates.clear();
        this.mines = [];

        const config = this.getConfig();
        if (config.isVictory) {
            this.isVictory = true;
            this.victoryColor = config.victoryColor || '#ffdd44';
            this.portalSide = config.portalSide || 'right';
            this.enemies = [];
            return;
        }
        if (config.isFinal) {
            this.isFinal = true;
        }

        const enemyTypes = config.enemyTypes || [];
        let blackCount = 0;
        for (const group of enemyTypes) {
            if (group.type === 'black') blackCount += group.count;
        }
        let blackIndex = 0;

        for (const group of enemyTypes) {
            const count = group.count || 0;
            const speed = group.speed || 2.1;
            const radius = group.radius || 14;
            const type = group.type || 'basic';

            for (let i = 0; i < count; i++) {
                let x, y;
                let valid = false;
                let attempts = 0;
                const padding = 100;
                const minDistFromPlayer = 350;
                while (!valid && attempts < 300) {
                    x = randomRange(padding, this.mapWidth - padding);
                    y = randomRange(padding, this.mapHeight - padding);
                    if (x < this.safeZoneWidth + radius || x > this.mapWidth - this.safeZoneWidth - radius) {
                        attempts++;
                        continue;
                    }
                    const distToPlayer = Math.hypot(x - player.x, y - player.y);
                    let tooClose = false;
                    for (const other of this.enemies) {
                        if (Math.hypot(x - other.x, y - other.y) < 70) {
                            tooClose = true;
                            break;
                        }
                    }
                    if (distToPlayer > minDistFromPlayer && !tooClose) {
                        valid = true;
                    }
                    attempts++;
                }
                const spd = speed + randomRange(-0.2, 0.2);
                let enemy;
                if (type === 'black') {
                    enemy = this.createEnemy(type, x, y, spd, radius, blackIndex, blackCount);
                    blackIndex++;
                } else {
                    enemy = this.createEnemy(type, x, y, spd, radius);
                }
                if (enemy && typeof enemy.setPlayerRef === 'function') {
                    enemy.setPlayerRef(this.player);
                }
                this.enemies.push(enemy);
            }
        }

        for (const enemy of this.enemies) {
            enemy._rootSlowed = false;
            enemy._auraDisabled = false;
            enemy._neutralized = false;
            enemy._teslaNeutralized = false;
            delete enemy._neutralizeTimer;
        }
    }

    correctEnemyPosition(enemy) {
        const margin = this.safeZoneWidth;
        if (enemy.type === 'black' || enemy.isStatic) return;
        if (enemy.x < margin + enemy.radius) {
            enemy.x = margin + enemy.radius + 2;
            enemy.vx = Math.abs(enemy.vx) * 0.5 + 1;
        } else if (enemy.x > this.mapWidth - margin - enemy.radius) {
            enemy.x = this.mapWidth - margin - enemy.radius - 2;
            enemy.vx = -Math.abs(enemy.vx) * 0.5 - 1;
        }
        const spd = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
        if (spd > enemy.speed * 1.8) {
            enemy.vx = (enemy.vx / spd) * enemy.speed * 1.8;
            enemy.vy = (enemy.vy / spd) * enemy.speed * 1.8;
        }
    }

    update() {
        // 1. Движение врагов
        for (const enemy of this.enemies) {
            if (enemy.type === 'black' || enemy.isStatic) {
                enemy.update(this.mapWidth, this.mapHeight, 1);
                continue;
            }
            let speedMult = 1;
            if (enemy._rootSlowed) {
                speedMult = 0.6;
            }
            if (enemy._slowModifier !== undefined) {
                speedMult *= enemy._slowModifier;
            }
            enemy.update(this.mapWidth, this.mapHeight, speedMult);
            this.correctEnemyPosition(enemy);
        }

        // 2. Проверка мин игрока
        if (this.player && this.player.checkMines) {
            this.player.checkMines();
        }

        // 3. Обработка тесла-станции Vortex
        if (this.player && this.player.teslaStation && this.player.teslaStation.active) {
            const station = this.player.teslaStation;
            const radiusSq = station.radius * station.radius;
            for (const enemy of this.enemies) {
                const dx = enemy.x - station.x;
                const dy = enemy.y - station.y;
                const distSq = dx*dx + dy*dy;
                if (distSq < radiusSq) {
                    enemy._teslaNeutralized = true;
                } else {
                    enemy._teslaNeutralized = false;
                }
            }
        }

        // 4. Телепортация через порталы
        if (this.player && this.player.checkPortalTeleport) {
            this.player.checkPortalTeleport();
        }

        // 5. Столкновения с игроком
        if (!this.player.godMode && !this.isVictory && this.player.alive && !this.player.invincible) {
            for (const enemy of this.enemies) {
                if (enemy.stunned) continue;
                if (enemy._neutralized || enemy._teslaNeutralized) continue;
                if (enemy.type === 'tree') {
                    const dx = enemy.x - this.player.x;
                    const dy = enemy.y - this.player.y;
                    if (dx*dx + dy*dy < (this.player.radius + enemy.radius)**2) {
                        if (this.player.tryBlockDeath && this.player.tryBlockDeath(enemy)) {
                            continue;
                        }
                        if (this.player.die) this.player.die();
                        else this.player.alive = false;
                        break;
                    }
                    continue;
                }
                if (enemy.isStatic) {
                    const dx = enemy.x - this.player.x;
                    const dy = enemy.y - this.player.y;
                    if (dx*dx + dy*dy < (this.player.radius + enemy.radius)**2) {
                        if (this.player.tryBlockDeath && this.player.tryBlockDeath(enemy)) {
                            continue;
                        }
                        if (this.player.die) this.player.die();
                        else this.player.alive = false;
                        break;
                    }
                    continue;
                }
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                if (dx*dx + dy*dy < (this.player.radius + enemy.radius)**2) {
                    if (enemy.type === 'stealth' && !enemy.used) {
                        this.player.energy = 0;
                        manager.isParalyzed = true;
                        manager.paralyzeRemaining = 3;
                        manager.paralyzeTimer = 0;
                        this.player.slowModifier = 0;
                        enemy.used = true;
                        continue;
                    }
                    if (this.player.tryBlockDeath && this.player.tryBlockDeath(enemy)) {
                        continue;
                    }
                    if (this.player.die) this.player.die();
                    else this.player.alive = false;
                    break;
                }
            }
            this.enemies = this.enemies.filter(e => !(e.type === 'stealth' && e.used));
        }

        // 6. Портал (только если игрок жив)
        if (!this.isVictory && !this.isFinal && this.player.alive) {
            if (this.player.x >= this.mapWidth - 40) {
                if (this.levelNumber < this.configs.length) {
                    this.isComplete = true;
                    this.direction = 'forward';
                } else {
                    this.isComplete = true;
                    this.isWin = true;
                }
            }
            if (this.player.x <= 40 && this.levelNumber > 1) {
                this.isComplete = true;
                this.direction = 'back';
            }
        }
    }

    draw(ctx, offsetX, offsetY, scale) {
        if (this.isVictory) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = this.victoryColor || '#ffdd44';
            ctx.fillRect(offsetX, offsetY, this.mapWidth * scale, this.mapHeight * scale);
            ctx.globalAlpha = 1;
            ctx.restore();

            let portalX = (this.portalSide === 'left') ? 0 * scale + offsetX : this.mapWidth * scale + offsetX - 20 * scale;
            const portalY = 0 * scale + offsetY;
            const portalH = this.mapHeight * scale;
            ctx.fillStyle = 'rgba(46, 213, 115, 0.6)';
            ctx.fillRect(portalX, portalY, 20 * scale, portalH);
            ctx.fillStyle = '#fff';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            const label = this.portalSide === 'left' ? '← START' : '→ START';
            ctx.fillText(label, portalX + 10 * scale, (50 - this.player.y) * scale + offsetY);
            return;
        }

        for (const enemy of this.enemies) {
            enemy.draw(ctx, offsetX, offsetY, scale);
        }

        if (manager) {
            if (manager.projectiles) {
                EnemyLogic.drawProjectiles(ctx, manager.projectiles, offsetX, offsetY, scale);
            }
            if (manager.mines) {
                for (const mine of manager.mines) {
                    const drawX = mine.x * scale + offsetX;
                    const drawY = mine.y * scale + offsetY;
                    const drawR = mine.radius * scale;
                    ctx.globalAlpha = mine.opacity || 0.3;
                    ctx.fillStyle = '#ff8800';
                    ctx.shadowColor = '#ff8800';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(drawX, drawY, drawR, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha = 1;
                }
            }
            if (manager.toxicTrails) {
                EnemyLogic.drawToxicTrails(ctx, manager.toxicTrails, offsetX, offsetY, scale);
            }
            if (manager.slashStates) {
                EnemyLogic.drawSlashTrails(ctx, manager.slashStates, this.enemies, offsetX, offsetY, scale);
            }
        }

        for (const enemy of this.enemies) {
            if (enemy.type === 'orangeaura' && enemy.charging) {
                const drawX = enemy.x * scale + offsetX;
                const drawY = enemy.y * scale + offsetY - (enemy.radius + 20) * scale;
                const barWidth = 80 * scale;
                const barHeight = 8 * scale;
                const progress = Math.min(enemy.chargeTimer / enemy.chargeTime, 1);
                ctx.fillStyle = 'rgba(0,0,0,0.8)';
                ctx.fillRect(drawX - barWidth/2, drawY - barHeight/2, barWidth, barHeight);
                const grad = ctx.createLinearGradient(drawX - barWidth/2, drawY, drawX + barWidth/2, drawY);
                grad.addColorStop(0, '#ff6600');
                grad.addColorStop(1, '#ffcc00');
                ctx.fillStyle = grad;
                ctx.fillRect(drawX - barWidth/2, drawY - barHeight/2, barWidth * progress, barHeight);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5 * scale;
                ctx.strokeRect(drawX - barWidth/2, drawY - barHeight/2, barWidth, barHeight);
                ctx.fillStyle = '#fff';
                ctx.font = `${12 * scale}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(Math.floor(progress * 100) + '%', drawX, drawY);
            }
        }

        if (!this.isFinal) {
            const exitX = this.mapWidth * scale + offsetX - 20 * scale;
            const exitY = 0 * scale + offsetY;
            const exitH = this.mapHeight * scale;
            ctx.fillStyle = 'rgba(46, 213, 115, 0.25)';
            ctx.fillRect(exitX, exitY, 20 * scale, exitH);
            if (this.levelNumber > 1) {
                const leftX = 0 * scale + offsetX;
                const leftY = 0 * scale + offsetY;
                ctx.fillStyle = 'rgba(46, 213, 115, 0.25)';
                ctx.fillRect(leftX, leftY, 20 * scale, exitH);
            }
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        const leftW = this.safeZoneWidth * scale;
        const rightX = (this.mapWidth - this.safeZoneWidth) * scale + offsetX;
        const rightW = this.safeZoneWidth * scale;
        ctx.fillRect(offsetX, offsetY, leftW, this.mapHeight * scale);
        ctx.fillRect(rightX, offsetY, rightW, this.mapHeight * scale);
    }

    goToNextLevel() {
        if (this.levelNumber < this.configs.length) {
            this.levelNumber++;
            this.initLevel(this.player, 'forward');
        }
    }

    goToPrevLevel() {
        if (this.levelNumber > 1) {
            this.levelNumber--;
            this.initLevel(this.player, 'back');
        }
    }

    goToLevel(level) {
        if (level < 1) level = 1;
        if (level > this.configs.length) level = this.configs.length;
        if (this.levelNumber === level) return;
        this.levelNumber = level;
        this.initLevel(this.player, 'forward');
    }

    respawnPlayer() {
        const pos = this.getSpawnPosition('forward');
        this.player.respawn(pos.x, pos.y);
    }
}