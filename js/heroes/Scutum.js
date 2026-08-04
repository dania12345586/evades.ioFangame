// js/heroes/Scutum.js

class Scutum extends Player {
    constructor(x, y) {
        super(x, y);
        this.color = '#4ecdc4';

        this.dash = {
            active: false,
            cooldown: 0,
            maxCooldown: 9,
            duration: 0,
            maxDuration: 18,
            trail: [],
            energyCost: 25,
            stunDuration: 1,
            onCooldown: false,
            level: 0,
            speedBoost: 14,
            vx: 0,
            vy: 0,
            invincibleAfter: false,
            invincibleTimer: 0,
            invincibleDuration: 30,
        };

        this.wave = {
            active: false,
            cooldown: 0,
            maxCooldown: 15,
            charging: false,
            chargeTimer: 0,
            maxChargeTime: 2.5,
            energyCost: 40,
            stunnedDuration: 1,
            onCooldown: false,
            level: 0,
            waveRadius: 0,
            waveMaxRadius: 200,
            enemiesHit: [],
            slowed: false,
        };
    }

    updateAbilities() {
        if (this.dash.onCooldown) {
            this.dash.cooldown -= 1/60;
            if (this.dash.cooldown <= 0) {
                this.dash.onCooldown = false;
                this.dash.cooldown = 0;
            }
        }
        if (this.wave.onCooldown) {
            this.wave.cooldown -= 1/60;
            if (this.wave.cooldown <= 0) {
                this.wave.onCooldown = false;
                this.wave.cooldown = 0;
            }
        }

        if (this.dash.invincibleAfter) {
            this.dash.invincibleTimer++;
            if (this.dash.invincibleTimer >= this.dash.invincibleDuration) {
                this.dash.invincibleAfter = false;
                this.invincible = false;
                this.dash.invincibleTimer = 0;
            }
        }

        if (this.dash.active) {
            this.dash.duration--;
            const speed = this.dash.speedBoost;
            this.x += this.dash.vx * speed;
            this.y += this.dash.vy * speed;
            if (level) {
                this.x = Math.max(this.radius, Math.min(level.mapWidth - this.radius, this.x));
                this.y = Math.max(this.radius, Math.min(level.mapHeight - this.radius, this.y));
            }
            if (this.dash.duration % 2 === 0) {
                this.dash.trail.push({x: this.x, y: this.y});
                if (this.dash.trail.length > 20) this.dash.trail.shift();
            }
            if (this.dash.duration <= 0) {
                this.dash.active = false;
                this.dash.trail = [];
                this.dash.invincibleAfter = true;
                this.dash.invincibleTimer = 0;
                this.invincible = true;
            }
        }

        if (this.wave.charging) {
            this.wave.chargeTimer -= 1/60;
            if (this.wave.chargeTimer <= 0) {
                this.wave.charging = false;
                this.wave.active = true;
                this.wave.waveRadius = 0;
                this.wave.enemiesHit = [];
                if (this.wave.slowed) {
                    this.speed = this.baseSpeed;
                    this.wave.slowed = false;
                }
                this.wave.onCooldown = true;
                const cooldowns = [15, 14, 13, 12, 11];
                this.wave.maxCooldown = cooldowns[Math.min(this.wave.level-1, cooldowns.length-1)] || 15;
                this.wave.cooldown = this.wave.maxCooldown;
                const stunDurations = [1, 1.3, 1.6, 1.9, 2.2];
                this.wave.stunnedDuration = stunDurations[Math.min(this.wave.level-1, stunDurations.length-1)] || 1;
            }
        }

        if (this.wave.active) {
            this.wave.waveRadius += 5;
            if (this.wave.waveRadius >= this.wave.waveMaxRadius) {
                this.wave.active = false;
                this.wave.waveRadius = 0;
            }
        }
    }

    activateDash() {
        if (manager && manager.darkRedBlock) return false;
        if (this.ability1Level === 0) return false;
        if (this.dash.onCooldown) return false;
        if (this.energy < this.dash.energyCost) return false;
        if (this.dash.active) return false;

        this.energy -= this.dash.energyCost;
        this.dash.active = true;
        this.dash.duration = this.dash.maxDuration;
        this.dash.trail = [];
        this.dash.onCooldown = true;
        this.dash.level = this.ability1Level;
        const cooldowns = [9, 8, 7, 6, 5];
        this.dash.maxCooldown = cooldowns[Math.min(this.dash.level-1, cooldowns.length-1)] || 9;
        this.dash.cooldown = this.dash.maxCooldown;
        const stunDurations = [1, 1.3, 1.6, 1.9, 2.2];
        this.dash.stunDuration = stunDurations[Math.min(this.dash.level-1, stunDurations.length-1)] || 1;

        let dx = 0, dy = 0;
        if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
        if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
        if (keys['KeyD'] || keys['ArrowRight']) dx = 1;
        if (dx === 0 && dy === 0) { dx = 1; }
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len > 0) { dx /= len; dy /= len; }
        this.dash.vx = dx;
        this.dash.vy = dy;

        this.invincible = true;
        this.dash.invincibleAfter = false;
        this.dash.invincibleTimer = 0;
        return true;
    }

    activateWave() {
        if (manager && manager.darkRedBlock) return false;
        if (this.ability2Level === 0) return false;
        if (this.wave.onCooldown) return false;
        if (this.energy < this.wave.energyCost) return false;
        if (this.wave.charging || this.wave.active) return false;

        this.energy -= this.wave.energyCost;
        this.wave.charging = true;
        this.wave.level = this.ability2Level;
        this.wave.maxChargeTime = 2.5;
        this.wave.chargeTimer = this.wave.maxChargeTime;
        this.speed *= 0.6;
        this.wave.slowed = true;
        return true;
    }

    checkDashHit(enemies) {
        if (!this.dash.active) return;
        for (const enemy of enemies) {
            if (enemy.stunned || enemy.type === 'black') continue;
            for (const trailPoint of this.dash.trail) {
                const dist = Math.hypot(trailPoint.x - enemy.x, trailPoint.y - enemy.y);
                if (dist < this.radius + enemy.radius + 5) {
                    enemy.stunned = true;
                    enemy.stunTimer = this.dash.stunDuration;
                    const dx = enemy.x - this.x;
                    const dy = enemy.y - this.y;
                    const angle = Math.atan2(dy, dx);
                    enemy.vx = -Math.cos(angle) * enemy.speed * 0.5;
                    enemy.vy = -Math.sin(angle) * enemy.speed * 0.5;
                    this.stunnedEnemies.push({ enemy, timer: this.dash.stunDuration });
                    break;
                }
            }
        }
    }

    checkWaveHit(enemies) {
        if (!this.wave.active) return;
        const radius = this.wave.waveRadius;
        for (const enemy of enemies) {
            if (enemy.stunned || enemy.type === 'black') continue;
            const dist = Math.hypot(this.x - enemy.x, this.y - enemy.y);
            if (dist < radius && dist > radius - 10) {
                enemy.stunned = true;
                enemy.stunTimer = this.wave.stunnedDuration;
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const angle = Math.atan2(dy, dx);
                enemy.vx = Math.cos(angle) * enemy.speed * 0.8;
                enemy.vy = Math.sin(angle) * enemy.speed * 0.8;
                this.stunnedEnemies.push({ enemy, timer: this.wave.stunnedDuration });
            }
        }
    }

    drawEffects(ctx, scale) {
        const cx = ctx.canvas.width / 2;
        const cy = ctx.canvas.height / 2;

        if (this.dash.active && this.dash.trail.length > 0) {
            const trailRadius = this.radius * scale * 0.9;
            for (const point of this.dash.trail) {
                const drawX = (point.x - this.x) * scale + cx;
                const drawY = (point.y - this.y) * scale + cy;
                const alpha = 0.5 * (this.dash.duration / this.dash.maxDuration);
                ctx.fillStyle = `rgba(78, 205, 196, ${alpha})`;
                ctx.beginPath();
                ctx.arc(drawX, drawY, trailRadius, 0, Math.PI*2);
                ctx.fill();
            }
        }

        if (this.wave.charging) {
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.radius * scale * 1.5);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
            grad.addColorStop(1, 'rgba(0,0,0,0.7)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, this.radius * scale * 1.5, 0, Math.PI*2);
            ctx.fill();

            const progress = 1 - (this.wave.chargeTimer / this.wave.maxChargeTime);
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2 + progress * 2;
                const dist = this.radius * scale * (1.2 + progress * 0.8);
                const px = cx + Math.cos(angle) * dist;
                const py = cy + Math.sin(angle) * dist;
                ctx.fillStyle = `rgba(78, 205, 196, ${0.3 + progress * 0.5})`;
                ctx.beginPath();
                ctx.arc(px, py, 3 * scale, 0, Math.PI*2);
                ctx.fill();
            }
        }

        if (this.wave.active) {
            const waveRadius = this.wave.waveRadius * scale;
            ctx.strokeStyle = 'rgba(78, 205, 196, 0.7)';
            ctx.lineWidth = 4 * scale;
            ctx.beginPath();
            ctx.arc(cx, cy, waveRadius, 0, Math.PI*2);
            ctx.stroke();
            const grad2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, waveRadius);
            grad2.addColorStop(0, 'rgba(78, 205, 196, 0.05)');
            grad2.addColorStop(0.8, 'rgba(78, 205, 196, 0.1)');
            grad2.addColorStop(1, 'rgba(78, 205, 196, 0.2)');
            ctx.fillStyle = grad2;
            ctx.beginPath();
            ctx.arc(cx, cy, waveRadius, 0, Math.PI*2);
            ctx.fill();
        }
    }

    draw(ctx, scale) {
        const drawR = this.radius * scale;
        const cx = ctx.canvas.width / 2;
        const cy = ctx.canvas.height / 2;

        // ---- ВСТАВЛЯЕМ ТАЙМЕР СМЕРТИ ----
        if (this.isDead) {
            ctx.fillStyle = '#cccccc';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(cx, cy, drawR, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
            ctx.globalAlpha = 1;
            const fontSize = Math.min(20, drawR * 1.2);
            ctx.fillStyle = '#ff0000';
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.ceil(this.respawnTimer), cx, cy);
            return; // чтобы не рисовать остальное
        }
        // ---- КОНЕЦ ТАЙМЕРА ----

        if (!this.alive) {
            ctx.fillStyle = '#666';
        } else if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            let color = this.color;
            if (this.wave.charging) {
                const progress = 1 - (this.wave.chargeTimer / this.wave.maxChargeTime);
                const dark = Math.floor(50 + progress * 100);
                let r = parseInt(color.slice(1,3), 16);
                let g = parseInt(color.slice(3,5), 16);
                let b = parseInt(color.slice(5,7), 16);
                r = Math.max(0, r - dark);
                g = Math.max(0, g - dark);
                b = Math.max(0, b - dark);
                color = `rgb(${r},${g},${b})`;
            }
            ctx.fillStyle = color;
        }
        ctx.beginPath();
        ctx.arc(cx, cy, drawR, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    respawn(x, y) {
        super.respawn(x, y);
        this.dash.active = false;
        this.dash.trail = [];
        this.wave.charging = false;
        this.wave.active = false;
        this.wave.slowed = false;
    }
}