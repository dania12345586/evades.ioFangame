// js/heroes/Sylvanus.js

class Sylvanus extends Player {
    constructor(x, y) {
        super(x, y);
        this.color = '#2E7D32';

        this.rootZone = {
            active: false,
            timer: 0,
            duration: 3,
            radius: 300,
            cooldown: 0,
            maxCooldown: 8,
            onCooldown: false,
            energyCost: 20,
            level: 0,
            enemiesInZone: [],
        };

        this.bark = {
            active: false,
            timer: 0,
            duration: 2.9,
            cooldown: 0,
            maxCooldown: 9,
            onCooldown: false,
            energyCost: 40,
            level: 0,
            broken: false,
            invincibleTimer: 0,
            invincibleDuration: 0.6,
            triggered: false,
        };
    }

    updateAbilities() {
        if (this.rootZone.onCooldown) {
            this.rootZone.cooldown -= 1/60;
            if (this.rootZone.cooldown <= 0) {
                this.rootZone.onCooldown = false;
                this.rootZone.cooldown = 0;
            }
        }
        if (this.bark.onCooldown) {
            this.bark.cooldown -= 1/60;
            if (this.bark.cooldown <= 0) {
                this.bark.onCooldown = false;
                this.bark.cooldown = 0;
            }
        }

        if (this.rootZone.active) {
            this.rootZone.timer -= 1/60;
            this.updateRootZoneEffects();
            if (this.rootZone.timer <= 0) {
                this.rootZone.active = false;
                this.rootZone.timer = 0;
                const enemies = manager?.level?.enemies || [];
                for (const enemy of enemies) {
                    if (this.rootZone.enemiesInZone.includes(enemy)) {
                        enemy._auraDisabled = false;
                    }
                }
                this.rootZone.enemiesInZone = [];
            }
        }

        if (this.bark.active) {
            this.bark.timer -= 1/60;
            if (this.bark.timer <= 0 && !this.bark.broken) {
                this.bark.active = false;
                this.bark.onCooldown = true;
                this.bark.cooldown = this.bark.maxCooldown;
                this.bark.timer = 0;
            }
        }

        if (this.bark.invincibleTimer > 0) {
            this.bark.invincibleTimer -= 1/60;
            if (this.bark.invincibleTimer <= 0) {
                this.invincible = false;
                this.bark.invincibleTimer = 0;
            }
        }
    }

    updateRootZoneEffects() {
        if (!this.rootZone.active) return;
        const px = this.x;
        const py = this.y;
        const radius = this.rootZone.radius;
        const radiusSq = radius * radius;

        const enemies = manager?.level?.enemies || [];
        for (const enemy of enemies) {
            const dx = enemy.x - px;
            const dy = enemy.y - py;
            const distSq = dx*dx + dy*dy;
            const inZone = distSq < radiusSq;

            if (inZone) {
                if (!this.rootZone.enemiesInZone.includes(enemy)) {
                    this.rootZone.enemiesInZone.push(enemy);
                }
                if (!enemy.stunned) {
                    enemy._rootSlowed = true;
                }
                if (enemy.isAura) {
                    enemy._auraDisabled = true;
                }
            } else {
                if (this.rootZone.enemiesInZone.includes(enemy)) {
                    const idx = this.rootZone.enemiesInZone.indexOf(enemy);
                    if (idx !== -1) this.rootZone.enemiesInZone.splice(idx, 1);
                }
                enemy._rootSlowed = false;
                enemy._auraDisabled = false;
            }
        }
    }

    activateRootZone() {
        if (manager && manager.darkRedBlock) return false;
        if (this.rootZone.onCooldown) return false;
        if (this.energy < this.rootZone.energyCost) return false;
        if (this.rootZone.active) return false;
        if (this.ability1Level === 0) return false;

        this.energy -= this.rootZone.energyCost;
        this.rootZone.active = true;
        this.rootZone.level = this.ability1Level;
        const durations = [3, 3.5, 4, 4.5, 5];
        this.rootZone.duration = durations[Math.min(this.ability1Level - 1, durations.length - 1)] || 3;
        this.rootZone.timer = this.rootZone.duration;
        this.rootZone.onCooldown = true;
        const cooldowns = [8, 8, 8, 8, 8];
        this.rootZone.maxCooldown = cooldowns[Math.min(this.ability1Level - 1, cooldowns.length - 1)] || 8;
        this.rootZone.cooldown = this.rootZone.maxCooldown;
        this.rootZone.enemiesInZone = [];
        const enemies = manager?.level?.enemies || [];
        for (const enemy of enemies) {
            enemy._rootSlowed = false;
            enemy._auraDisabled = false;
        }
        return true;
    }

    activateBark() {
        if (manager && manager.darkRedBlock) return false;
        if (this.bark.onCooldown) return false;
        if (this.energy < this.bark.energyCost) return false;
        if (this.bark.active) return false;
        if (this.ability2Level === 0) return false;

        this.energy -= this.bark.energyCost;
        this.bark.active = true;
        this.bark.broken = false;
        this.bark.triggered = false;
        this.bark.level = this.ability2Level;
        const durations = [2.9, 3.2, 3.5, 3.8, 4];
        this.bark.duration = durations[Math.min(this.ability2Level - 1, durations.length - 1)] || 2.9;
        this.bark.timer = this.bark.duration;
        return true;
    }

    tryBlockDeath(enemy) {
        if (!this.bark.active || this.bark.broken) return false;
        this.bark.broken = true;
        this.bark.active = false;
        if (enemy && !enemy.stunned) {
            enemy.stunned = true;
            enemy.stunTimer = 2;
        }
        this.invincible = true;
        this.bark.invincibleTimer = this.bark.invincibleDuration;
        this.bark.onCooldown = true;
        this.bark.maxCooldown = 9;
        this.bark.cooldown = this.bark.maxCooldown;
        this.bark.triggered = true;
        return true;
    }

    drawEffects(ctx, scale) {
        const cx = ctx.canvas.width / 2;
        const cy = ctx.canvas.height / 2;
        const time = Date.now() / 1000;

        if (this.rootZone.active) {
            const radius = this.rootZone.radius * scale;
            ctx.fillStyle = 'rgba(46, 125, 50, 0.2)';
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(46, 125, 50, 0.6)';
            ctx.lineWidth = 2 * scale;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + time * 0.5;
                const r = radius * 0.8;
                const x1 = cx + Math.cos(angle) * r;
                const y1 = cy + Math.sin(angle) * r;
                const x2 = cx + Math.cos(angle + 0.3) * (r + 20 * scale);
                const y2 = cy + Math.sin(angle + 0.3) * (r + 20 * scale);
                ctx.strokeStyle = 'rgba(46, 125, 50, 0.4)';
                ctx.lineWidth = 2 * scale;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.quadraticCurveTo((x1+x2)/2 + 10*scale, (y1+y2)/2 - 10*scale, x2, y2);
                ctx.stroke();
            }
        }

        if (this.bark.active && !this.bark.broken) {
            const baseRadius = this.radius * scale * 1.3;
            const pulse = 1 + 0.05 * Math.sin(time * 4);

            const glow = ctx.createRadialGradient(cx, cy, baseRadius * 0.8, cx, cy, baseRadius * 1.2);
            glow.addColorStop(0, 'rgba(121, 85, 72, 0)');
            glow.addColorStop(0.7, 'rgba(121, 85, 72, 0.2)');
            glow.addColorStop(1, 'rgba(121, 85, 72, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, cy, baseRadius * 1.2, 0, Math.PI * 2);
            ctx.fill();

            const r = baseRadius * pulse;
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.9)';
            ctx.lineWidth = 6 * scale;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(160, 120, 80, 0.5)';
            ctx.lineWidth = 2 * scale;
            ctx.setLineDash([4, 6]);
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.strokeStyle = 'rgba(120, 80, 50, 0.3)';
            ctx.lineWidth = 1.5 * scale;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
            ctx.stroke();

            const spikeCount = 12;
            for (let i = 0; i < spikeCount; i++) {
                const angle = (i / spikeCount) * Math.PI * 2 + time * 0.8;
                const spikeLength = 12 * scale * (0.8 + 0.2 * Math.sin(time * 3 + i));
                const startR = r * 0.9;
                const endR = r + spikeLength;
                const x1 = cx + Math.cos(angle) * startR;
                const y1 = cy + Math.sin(angle) * startR;
                const x2 = cx + Math.cos(angle) * endR;
                const y2 = cy + Math.sin(angle) * endR;

                ctx.strokeStyle = `rgba(101, 67, 33, ${0.6 + 0.4 * Math.sin(time * 2 + i)})`;
                ctx.lineWidth = 3 * scale;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                ctx.fillStyle = 'rgba(160, 120, 80, 0.7)';
                ctx.beginPath();
                ctx.arc(x2, y2, 2 * scale, 0, Math.PI * 2);
                ctx.fill();
            }

            for (let i = 0; i < spikeCount; i++) {
                const angle = (i / spikeCount) * Math.PI * 2 + time * 0.6 + 0.2;
                const leafR = r * 0.95;
                const x = cx + Math.cos(angle) * leafR;
                const y = cy + Math.sin(angle) * leafR;
                const size = 4 * scale * (0.8 + 0.2 * Math.sin(time * 2.5 + i * 1.2));
                ctx.fillStyle = `rgba(34, 139, 34, ${0.4 + 0.3 * Math.sin(time * 1.8 + i)})`;
                ctx.beginPath();
                ctx.ellipse(x, y, size, size * 0.5, angle, 0, Math.PI * 2);
                ctx.fill();
            }

            const progress = this.bark.timer / this.bark.duration;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = `bold ${16 * scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.ceil(this.bark.timer), cx, cy);
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
            if (this.bark.active && !this.bark.broken) {
                const r = 46, g = 125, b = 50;
                const br = 121, bg = 85, bh = 72;
                const mix = 0.5;
                const newR = Math.floor(r * (1-mix) + br * mix);
                const newG = Math.floor(g * (1-mix) + bg * mix);
                const newB = Math.floor(b * (1-mix) + bh * mix);
                color = `rgb(${newR},${newG},${newB})`;
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
        this.rootZone.active = false;
        this.rootZone.timer = 0;
        this.rootZone.onCooldown = false;
        this.rootZone.cooldown = 0;
        this.rootZone.enemiesInZone = [];
        this.bark.active = false;
        this.bark.broken = false;
        this.bark.timer = 0;
        this.bark.onCooldown = false;
        this.bark.cooldown = 0;
        this.bark.invincibleTimer = 0;
        this.invincible = false;
    }
}