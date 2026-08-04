// js/player.js

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 16;
        this.color = '#4ecdc4';

        this.baseSpeed = 5;
        this.speed = 5;
        this.maxSpeed = 15;
        this.energy = 30;
        this.maxEnergy = 30;
        this.energyRegen = 1;
        this.maxEnergyRegen = 7;
        this.ability1Level = 0;
        this.ability2Level = 0;
        this.maxAbilityLevel = 5;

        this.level = 0;
        this.exp = 0;
        this.expToNext = 10;
        this.skillPoints = 0;

        this.alive = true;
        this.hasShield = false;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 120;
        this.godMode = false;

        this.slowModifier = 1;
        this.stunnedEnemies = [];

        this.isDead = false;
        this.respawnTimer = 0;
        this.maxRespawnTimer = 60;
    }

    setShield(active) {
        this.hasShield = active;
        if (active) {
            this.invincible = true;
            this.invincibleTimer = 0;
        } else {
            this.invincible = false;
        }
    }

    update(keys, mapWidth, mapHeight) {
        if (!this.alive || this.isDead) return;

        if (!this.godMode) {
            this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegen * 0.016);
        } else {
            this.energy = this.maxEnergy;
        }

        if (this.invincible) {
            this.invincibleTimer++;
            if (this.invincibleTimer >= this.invincibleDuration) {
                this.invincible = false;
                this.invincibleTimer = 0;
            }
        }

        if (!this.alive) return;

        let dx = 0, dy = 0;
        let currentSpeed = this.speed * this.slowModifier;
        if (this.godMode) currentSpeed *= 3;

        if (keys['KeyW'] || keys['ArrowUp']) dy = -currentSpeed;
        if (keys['KeyS'] || keys['ArrowDown']) dy = currentSpeed;
        if (keys['KeyA'] || keys['ArrowLeft']) dx = -currentSpeed;
        if (keys['KeyD'] || keys['ArrowRight']) dx = currentSpeed;

        if (dx !== 0 && dy !== 0) {
            dx /= Math.SQRT2;
            dy /= Math.SQRT2;
        }
        this.x += dx;
        this.y += dy;

        this.x = Math.max(this.radius, Math.min(mapWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(mapHeight - this.radius, this.y));
    }

    updateStunnedEnemies() {
        for (let i = this.stunnedEnemies.length - 1; i >= 0; i--) {
            const entry = this.stunnedEnemies[i];
            entry.timer -= 1/60;
            if (entry.timer <= 0) {
                entry.enemy.stunned = false;
                entry.enemy.stunTimer = 0;
                this.stunnedEnemies.splice(i, 1);
            }
        }
    }

    draw(ctx, scale) {
        const drawR = this.radius * scale;
        const cx = ctx.canvas.width / 2;
        const cy = ctx.canvas.height / 2;

        if (this.isDead) {
            ctx.fillStyle = '#cccccc';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(cx, cy, drawR, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
            ctx.globalAlpha = 1;

            const fontSize = Math.min(22, drawR * 1.4);
            ctx.fillStyle = '#ff0000';
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.ceil(this.respawnTimer), cx, cy);
        } else if (!this.alive) {
            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.arc(cx, cy, drawR, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        } else if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx, cy, drawR, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(cx, cy, drawR, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
    }

    levelUpStat(index) {
        if (this.skillPoints <= 0) return false;
        switch(index) {
            case 0:
                if (this.speed < this.maxSpeed) { this.speed += 0.5; this.skillPoints--; return true; }
                break;
            case 1:
                if (this.maxEnergy < 200) { this.maxEnergy += 5; this.skillPoints--; return true; }
                break;
            case 2:
                if (this.energyRegen < this.maxEnergyRegen) { this.energyRegen += 0.2; this.skillPoints--; return true; }
                break;
            case 3:
                if (this.ability1Level < this.maxAbilityLevel) { this.ability1Level++; this.skillPoints--; return true; }
                break;
            case 4:
                if (this.ability2Level < this.maxAbilityLevel) { this.ability2Level++; this.skillPoints--; return true; }
                break;
        }
        return false;
    }

    addExp(amount) {
        this.exp += amount;
        while (this.exp >= this.expToNext) {
            this.exp -= this.expToNext;
            this.level++;
            this.skillPoints++;
            this.expToNext = Math.floor(10 + this.level * 2.5);
        }
    }

    getExpProgress() {
        return this.exp / this.expToNext;
    }

    respawn(x, y) {
        this.x = x;
        this.y = y;
        this.alive = true;
        this.isDead = false;
        this.respawnTimer = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.slowModifier = 1;
        this.stunnedEnemies = [];
    }

    die() {
        if (this.isDead || !this.alive) return;
        this.alive = false;
        this.isDead = true;
        this.respawnTimer = this.maxRespawnTimer;
    }
}