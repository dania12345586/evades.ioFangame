// js/core/LevelManager.js

class LevelManager {
    constructor(level, player) {
        this.level = level;
        this.player = player;
        this.pellets = [];
        this.minPellets = 20;
        this.maxPellets = 40;
        this.pelletValue = 2;

        this.redSlowActive = false;
        this.totalDrain = 0;
        this.paralyzeTimer = 0;
        this.paralyzeThreshold = 3;
        this.isParalyzed = false;
        this.paralyzeRemaining = 0;
        this.paralyzeDuration = 3;
        this.darkRedBlock = false;
        this.completedLevels = [];

        this.projectiles = [];
        this.toxicTrails = [];
        this.slashStates = new Map();
        this.mines = [];
        this.explosions = [];

        this.generatePellets(this.minPellets);
    }

    clearEffects() {
        this.projectiles = [];
        this.toxicTrails = [];
        this.slashStates.clear();
        this.mines = [];
        this.explosions = [];
        if (this.level) {
            for (const enemy of this.level.enemies) {
                enemy._neutralized = false;
                delete enemy._neutralizeTimer;
            }
        }
    }

    addExplosion(x, y, color, radius) {
        // КОРРЕКТНЫЙ РАДИУС ВЗРЫВА (без лишнего умножения)
        const maxRadius = radius || 100;
        this.explosions.push({
            x: x,
            y: y,
            radius: 10,
            maxRadius: maxRadius,
            life: 1.0,
            maxLife: 1.0,
            color: color || '#ff8800'
        });
    }

    generatePellets(count) {
        this.pellets = [];
        if (count <= 0) return;
        const padding = 20;
        const minDistFromPlayer = 100;
        const colors = ['#ffd93d', '#6bcb77', '#4d96ff', '#ff6b6b', '#a29bfe', '#fd79a8', '#00cec9'];
        const safeZoneWidth = this.level.safeZoneWidth;
        const mapWidth = this.level.mapWidth;
        const mapHeight = this.level.mapHeight;
        for (let i = 0; i < count; i++) {
            let x, y, valid = false, attempts = 0;
            while (!valid && attempts < 200) {
                x = randomRange(safeZoneWidth + padding, mapWidth - safeZoneWidth - padding);
                y = randomRange(padding, mapHeight - padding);
                if (this.player) {
                    const dx = x - this.player.x;
                    const dy = y - this.player.y;
                    if (dx*dx + dy*dy < minDistFromPlayer*minDistFromPlayer) {
                        attempts++;
                        continue;
                    }
                }
                valid = true;
                attempts++;
            }
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.pellets.push({
                x: x,
                y: y,
                radius: 6,
                color: color,
                value: this.pelletValue
            });
        }
        this.pelletCount = this.pellets.length;
    }

    respawnPellet(pellet) {
        const padding = 20;
        const minDistFromPlayer = 100;
        const safeZoneWidth = this.level.safeZoneWidth;
        const mapWidth = this.level.mapWidth;
        const mapHeight = this.level.mapHeight;
        let x, y, valid = false, attempts = 0;
        while (!valid && attempts < 200) {
            x = randomRange(safeZoneWidth + padding, mapWidth - safeZoneWidth - padding);
            y = randomRange(padding, mapHeight - padding);
            if (this.player) {
                const dx = x - this.player.x;
                const dy = y - this.player.y;
                if (dx*dx + dy*dy < minDistFromPlayer*minDistFromPlayer) {
                    attempts++;
                    continue;
                }
            }
            valid = true;
            attempts++;
        }
        pellet.x = x;
        pellet.y = y;
    }

    update() {
        const px = this.player.x;
        const py = this.player.y;

        for (let i = this.pellets.length - 1; i >= 0; i--) {
            const p = this.pellets[i];
            const dx = p.x - px;
            const dy = p.y - py;
            const threshold = this.player.radius + p.radius;
            if (dx*dx + dy*dy < threshold*threshold) {
                this.player.addExp(p.value);
                this.respawnPellet(p);
            }
        }

        this.redSlowActive = false;
        this.totalDrain = 0;
        this.darkRedBlock = false;

        // Сброс обезвреживания
        for (const enemy of this.level.enemies) {
            if (enemy._neutralizeTimer !== undefined) {
                enemy._neutralizeTimer -= 0.016;
                if (enemy._neutralizeTimer <= 0) {
                    enemy._neutralized = false;
                    delete enemy._neutralizeTimer;
                }
            }
        }

        // Сброс замедления
        for (const enemy of this.level.enemies) {
            if (enemy._slowTimer !== undefined) {
                enemy._slowTimer -= 0.016;
                if (enemy._slowTimer <= 0) {
                    delete enemy._slowModifier;
                    delete enemy._slowTimer;
                }
            }
        }

        // Ауры
        const playerInSafeZone = (px < this.level.safeZoneWidth || px > this.level.mapWidth - this.level.safeZoneWidth);
        let inYellowAura = false;

        for (const enemy of this.level.enemies) {
            if (enemy.stunned) continue;
            if (!enemy.isAura) continue;
            if (enemy._auraDisabled) continue;
            if (enemy._neutralized || enemy._teslaNeutralized) continue;
            if (playerInSafeZone) continue;
            const dx = enemy.x - px;
            const dy = enemy.y - py;
            const distSq = dx*dx + dy*dy;
            const auraRadiusSq = (enemy.auraRadius + this.player.radius) ** 2;
            if (distSq < auraRadiusSq) {
                if (enemy.type === 'red') {
                    this.redSlowActive = true;
                } else if (enemy.type === 'blue') {
                    this.totalDrain += enemy.drainPerSecond;
                } else if (enemy.type === 'yellow') {
                    inYellowAura = true;
                    if (!this.isParalyzed) {
                        this.paralyzeTimer += 0.016;
                        if (this.paralyzeTimer >= this.paralyzeThreshold) {
                            this.isParalyzed = true;
                            this.paralyzeRemaining = this.paralyzeDuration;
                            this.paralyzeTimer = 0;
                            this.player.slowModifier = 0;
                        }
                    }
                } else if (enemy.type === 'darkred') {
                    this.darkRedBlock = true;
                }
            }
        }

        if (this.isParalyzed) {
            this.paralyzeRemaining -= 0.016;
            if (this.paralyzeRemaining <= 0) {
                this.isParalyzed = false;
                this.paralyzeRemaining = 0;
                this.paralyzeTimer = 0;
                this.player.slowModifier = 1;
            }
        }
        if (playerInSafeZone) {
            this.paralyzeTimer = Math.max(0, this.paralyzeTimer - 0.05);
        } else if (!inYellowAura && !this.isParalyzed) {
            if (this.paralyzeTimer > 0) {
                this.paralyzeTimer = Math.max(0, this.paralyzeTimer - 0.02);
            }
        }

        if (this.player.alive) {
            if (this.totalDrain > 0) {
                this.player.energy -= this.totalDrain / 60;
                if (this.player.energy < 0) this.player.energy = 0;
            }
            if (this.player.venomSlowActive) {
                // уже 0.5
            } else if (this.redSlowActive) {
                this.player.slowModifier = 0.7;
            } else if (!this.isParalyzed) {
                this.player.slowModifier = 1;
            }
        }

        for (const enemy of this.level.enemies) {
            if (enemy.type === 'venom') {
                EnemyLogic.updateVenom(enemy, this.player, this.projectiles, this.level.safeZoneWidth, this.level.mapWidth, this.level.mapHeight);
            } else if (enemy.type === 'toxic') {
                EnemyLogic.updateToxic(enemy, this.player, this.toxicTrails);
            } else if (enemy.type === 'slash') {
                EnemyLogic.updateSlash(enemy, this.player, this.slashStates, this.level.mapWidth, this.level.mapHeight, this.level.safeZoneWidth);
            } else if (enemy.type === 'turret') {
                EnemyLogic.updateTurret(enemy, this.player, this.projectiles, this.level.safeZoneWidth, this.level.mapWidth, this.level.mapHeight);
            } else if (enemy.type === 'bomber') {
                EnemyLogic.updateBomber(enemy, this.player, this.mines, this.level.safeZoneWidth, this.level.mapWidth, this.level.mapHeight);
            } else if (enemy.type === 'orangeaura') {
                EnemyLogic.updateOrangeAura(enemy, this.player);
            } else if (enemy.type === 'stealth') {
                EnemyLogic.updateStealth(enemy, this.player);
            }
        }

        EnemyLogic.updateMines(this.mines, this.player, this.level.mapWidth, this.level.mapHeight);

        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const e = this.explosions[i];
            e.life -= 0.016;
            if (e.life <= 0) {
                this.explosions.splice(i, 1);
            }
        }
    }

    drawPellets(ctx, offsetX, offsetY, scale) {
        for (const p of this.pellets) {
            const drawX = p.x * scale + offsetX;
            const drawY = p.y * scale + offsetY;
            const drawR = p.radius * scale;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(drawX, drawY, drawR, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawExplosions(ctx, offsetX, offsetY, scale) {
        for (const e of this.explosions) {
            const progress = 1 - e.life / e.maxLife;
            const radius = e.radius + (e.maxRadius - e.radius) * progress;
            const alpha = 1 - progress;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = e.color;
            ctx.shadowColor = e.color;
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(e.x * scale + offsetX, e.y * scale + offsetY, radius * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }
    }

    awardExpForLevel() {
        if (!this.completedLevels.includes(this.level.levelNumber)) {
            const expGain = 6 + 2 * this.level.levelNumber;
            this.player.addExp(expGain);
            this.completedLevels.push(this.level.levelNumber);
        }
    }
}