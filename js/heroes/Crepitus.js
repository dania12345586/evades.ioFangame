// js/heroes/Crepitus.js

class Crepitus extends Player {
    constructor(x, y) {
        super(x, y);
        this.color = '#cc7700';

        this.passiveCooldown = 0;
        this.passiveMaxCooldown = 5;
        this.passiveOnCooldown = false;
        this.passiveRadius = 360;
        this.passiveStunDuration = 1.5;

        this.mines = [];
        this.maxMines = 1;
        this.mineCooldown = 0;
        this.mineMaxCooldown = 2.5;
        this.mineOnCooldown = false;
        this.mineEnergyCost = 20;
        this.mineStunDuration = 1.3;
        this.mineRadius = 360;
        this.mineArmTime = 0.8;

        this.rocketCooldown = 0;
        this.rocketMaxCooldown = 8;
        this.rocketOnCooldown = false;
        this.rocketEnergyCost = 35;
        this.rocketSlowPercent = 0.4;
        this.rocketSlowDuration = 1;
        this.rocketRadius = 240;
        this.rocketSpeed = 300;
        this.rocketLife = 3;
        this.activeRocket = null;
        this.lastDir = { dx: 1, dy: 0 };

        this.isDead = false;
        this.respawnTimer = 0;
        this.maxRespawnTimer = 60;
    }

    updateAbilities() {
        if (this.mineOnCooldown) {
            this.mineCooldown -= 1/60;
            if (this.mineCooldown <= 0) {
                this.mineOnCooldown = false;
                this.mineCooldown = 0;
            }
        }
        if (this.rocketOnCooldown) {
            this.rocketCooldown -= 1/60;
            if (this.rocketCooldown <= 0) {
                this.rocketOnCooldown = false;
                this.rocketCooldown = 0;
            }
        }
        if (this.passiveOnCooldown) {
            this.passiveCooldown -= 1/60;
            if (this.passiveCooldown <= 0) {
                this.passiveOnCooldown = false;
                this.passiveCooldown = 0;
            }
        }

        this.updateAbilityStats();

        if (this.activeRocket) {
            this.updateRocket();
        }

        this.checkMines();
    }

    updateAbilityStats() {
        const mineStunDurations = [1.3, 1.6, 1.9, 2.2, 2.5];
        this.mineStunDuration = mineStunDurations[Math.min(this.ability1Level, mineStunDurations.length-1)] || 1.3;
        const maxMines = [1, 1, 2, 2, 3];
        this.maxMines = maxMines[Math.min(this.ability1Level, maxMines.length-1)] || 1;

        const slowPercents = [0.4, 0.45, 0.5, 0.55, 0.6];
        this.rocketSlowPercent = slowPercents[Math.min(this.ability2Level, slowPercents.length-1)] || 0.4;
        const slowDurations = [1, 1.4, 1.8, 2.2, 2.5];
        this.rocketSlowDuration = (slowDurations[Math.min(this.ability2Level, slowDurations.length-1)] || 1) * 1.5;
    }

    activateMine() {
        if (manager && manager.darkRedBlock) return false;
        if (this.mineOnCooldown) return false;
        if (this.energy < this.mineEnergyCost) return false;
        if (this.ability1Level === 0) return false;

        this.energy -= this.mineEnergyCost;
        this.mineOnCooldown = true;
        this.mineCooldown = this.mineMaxCooldown;

        const mine = {
            x: this.x,
            y: this.y,
            radius: 18,
            armed: false,
            armTimer: 0,
            armTime: this.mineArmTime,
            stunDuration: this.mineStunDuration,
            radiusEffect: this.mineRadius,
            active: true,
            owner: this,
            type: 'playerMine'
        };
        this.mines.push(mine);

        while (this.mines.length > this.maxMines) {
            this.mines.shift();
        }

        return true;
    }

    activateRocket() {
        if (manager && manager.darkRedBlock) return false;
        if (this.rocketOnCooldown) return false;
        if (this.energy < this.rocketEnergyCost) return false;
        if (this.ability2Level === 0) return false;
        if (this.activeRocket) return false;

        this.energy -= this.rocketEnergyCost;
        this.rocketOnCooldown = true;
        this.rocketCooldown = this.rocketMaxCooldown;

        let dx = 0, dy = 0;
        if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
        if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
        if (keys['KeyD'] || keys['ArrowRight']) dx = 1;
        if (dx === 0 && dy === 0) {
            dx = this.lastDir.dx || 1;
            dy = this.lastDir.dy || 0;
        }
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len > 0) { dx /= len; dy /= len; }
        this.lastDir.dx = dx;
        this.lastDir.dy = dy;

        this.activeRocket = {
            x: this.x,
            y: this.y,
            vx: dx * this.rocketSpeed,
            vy: dy * this.rocketSpeed,
            radius: 10,
            life: this.rocketLife,
            owner: this,
            slowPercent: this.rocketSlowPercent,
            slowDuration: this.rocketSlowDuration,
            radiusEffect: this.rocketRadius,
            exploded: false,
            color: '#ff8800'
        };

        return true;
    }

    updateRocket() {
        const rocket = this.activeRocket;
        if (!rocket) return;

        rocket.x += rocket.vx * 0.016;
        rocket.y += rocket.vy * 0.016;
        rocket.life -= 0.016;

        if (rocket.x < 0 || rocket.x > level.mapWidth || rocket.y < 0 || rocket.y > level.mapHeight || rocket.life <= 0) {
            this.activeRocket = null;
            return;
        }

        const enemies = level.enemies;
        for (let enemy of enemies) {
            if (enemy.stunned) continue;
            const dx = rocket.x - enemy.x;
            const dy = rocket.y - enemy.y;
            if (dx*dx + dy*dy < (rocket.radius + enemy.radius)**2) {
                this.explodeRocket(rocket);
                this.activeRocket = null;
                return;
            }
        }
    }

    explodeRocket(rocket) {
        const enemies = level.enemies;
        const radiusSq = rocket.radiusEffect * rocket.radiusEffect;

        for (let enemy of enemies) {
            if (enemy.stunned) continue;
            const dx = enemy.x - rocket.x;
            const dy = enemy.y - rocket.y;
            if (dx*dx + dy*dy < radiusSq) {
                enemy._slowModifier = 1 - rocket.slowPercent;
                enemy._slowTimer = rocket.slowDuration;
            }
        }

        if (manager && manager.addExplosion) {
            manager.addExplosion(rocket.x, rocket.y, '#ff8800', rocket.radiusEffect);
        }
        this.activeRocket = null;
    }

    checkMines() {
        const enemies = level.enemies;
        for (let i = this.mines.length - 1; i >= 0; i--) {
            const mine = this.mines[i];
            if (!mine.active) continue;

            if (!mine.armed) {
                mine.armTimer += 1/60;
                if (mine.armTimer >= mine.armTime) {
                    mine.armed = true;
                }
                continue;
            }

            let exploded = false;
            for (let enemy of enemies) {
                if (enemy.stunned) continue;
                const dx = enemy.x - mine.x;
                const dy = enemy.y - mine.y;
                if (dx*dx + dy*dy < (mine.radius + enemy.radius)**2) {
                    this.explodeMine(mine);
                    exploded = true;
                    break;
                }
            }
            if (exploded) {
                this.mines.splice(i, 1);
            }
        }
    }

    explodeMine(mine) {
        const enemies = level.enemies;
        const radiusSq = mine.radiusEffect * mine.radiusEffect;

        for (let enemy of enemies) {
            if (enemy.stunned) continue;
            const dx = enemy.x - mine.x;
            const dy = enemy.y - mine.y;
            if (dx*dx + dy*dy < radiusSq) {
                enemy._neutralized = true;
                enemy._neutralizeTimer = mine.stunDuration;
            }
        }

        if (manager && manager.addExplosion) {
            manager.addExplosion(mine.x, mine.y, '#4488ff', mine.radiusEffect);
        }
    }

    triggerPassive() {
        if (this.passiveOnCooldown) return false;
        if (this.isDead) return false;

        this.passiveOnCooldown = true;
        this.passiveCooldown = this.passiveMaxCooldown;

        const enemies = level.enemies;
        const radiusSq = this.passiveRadius * this.passiveRadius;
        for (let enemy of enemies) {
            if (enemy.stunned) continue;
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            if (dx*dx + dy*dy < radiusSq) {
                enemy._neutralized = true;
                enemy._neutralizeTimer = this.passiveStunDuration;
            }
        }
        if (manager && manager.addExplosion) {
            manager.addExplosion(this.x, this.y, '#ff8800', this.passiveRadius);
        }
        return true;
    }

    die() {
        if (this.isDead || !this.alive) return;
        this.triggerPassive();
        this.alive = false;
        this.isDead = true;
        this.respawnTimer = this.maxRespawnTimer;
    }

    drawEffects(ctx, scale) {
        const cx = ctx.canvas.width / 2;
        const cy = ctx.canvas.height / 2;

        for (let mine of this.mines) {
            const drawX = (mine.x - this.x) * scale + cx;
            const drawY = (mine.y - this.y) * scale + cy;
            const drawR = mine.radius * scale;
            ctx.fillStyle = mine.armed ? 'rgba(0, 100, 255, 0.8)' : 'rgba(0, 100, 255, 0.3)';
            ctx.shadowColor = '#4488ff';
            ctx.shadowBlur = 15 * scale;
            ctx.beginPath();
            ctx.arc(drawX, drawY, drawR, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(drawX, drawY, drawR * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        if (this.activeRocket) {
            const r = this.activeRocket;
            const drawX = (r.x - this.x) * scale + cx;
            const drawY = (r.y - this.y) * scale + cy;
            const drawR = r.radius * scale;
            ctx.fillStyle = '#ff8800';
            ctx.shadowColor = '#ff8800';
            ctx.shadowBlur = 20 * scale;
            ctx.beginPath();
            ctx.arc(drawX, drawY, drawR, 0, Math.PI * 2);
            ctx.fill();
            const angle = Math.atan2(r.vy, r.vx);
            const tailLength = 15 * scale;
            const tailWidth = 6 * scale;
            ctx.save();
            ctx.translate(drawX, drawY);
            ctx.rotate(angle);
            ctx.fillStyle = '#ffaa44';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(-drawR, -tailWidth/2);
            ctx.lineTo(-drawR - tailLength, 0);
            ctx.lineTo(-drawR, tailWidth/2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            ctx.shadowBlur = 0;
        }
    }
}