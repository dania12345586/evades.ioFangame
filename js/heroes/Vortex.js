// js/heroes/Vortex.js

class Vortex extends Player {
    constructor(x, y) {
        super(x, y);
        this.color = '#22193A';

        // Пассивка – притяжение пеллет (радиус 100, сила 7.5)
        this.passiveRadius = 100;
        this.attractForce = 7.5;

        // Порталы
        this.portal1 = null;
        this.portal2 = null;
        this.portalStage = 0;
        this.portalCooldown = 0;
        this.portalRadius = 25;
        this.portalEnergyCost = 5;
        this.teleportEnergyCost = 15;
        this.portalActive = false;
        this.lastDirection = { dx: 1, dy: 0 };
        this.flyingPortal = null;
        this.teleportCooldown = 0;

        this.teleportInvincibleTimer = 0;
        this.teleportInvincibleDuration = 0;

        this.teslaStation = null;
        this.teslaCooldown = 0;
        this.teslaMaxCooldown = 14;
        this.teslaOnCooldown = false;
        this.teslaEnergyCost = 10;
        this.teslaRadius = 150;
        // Убираем teslaConsumption, теперь тратим по 1 каждые 0.1 сек
        this.teslaEnergyTimer = 0;

        this.portalParticles = [];

        this.ability1Level = 0;
        this.ability2Level = 0;
        this.maxAbilityLevel = 5;
    }

    updateAbilities() {
        if (this.portalCooldown > 0) {
            this.portalCooldown -= 1/60;
            if (this.portalCooldown < 0) this.portalCooldown = 0;
        }
        if (this.teleportCooldown > 0) {
            this.teleportCooldown -= 1/60;
            if (this.teleportCooldown < 0) this.teleportCooldown = 0;
        }
        if (this.teleportInvincibleTimer > 0) {
            this.teleportInvincibleTimer -= 1/60;
            if (this.teleportInvincibleTimer <= 0) {
                this.invincible = false;
                this.teleportInvincibleTimer = 0;
            }
        }
        if (this.teslaOnCooldown) {
            this.teslaCooldown -= 1/60;
            if (this.teslaCooldown <= 0) {
                this.teslaOnCooldown = false;
                this.teslaCooldown = 0;
            }
        }

        this.updateAbilityStats();

        // Потребление энергии станцией – по 1 каждые 0.1 секунды
        if (this.teslaStation && this.teslaStation.active) {
            this.teslaEnergyTimer += 1/60;
            const interval = 0.1;
            if (this.teslaEnergyTimer >= interval) {
                this.teslaEnergyTimer = 0;
                if (this.energy >= 1) {
                    this.energy -= 1;
                } else {
                    // Энергия кончилась – станция уничтожается
                    this.teslaStation.active = false;
                    this.teslaStation = null;
                    this.teslaOnCooldown = true;
                    this.teslaCooldown = this.teslaMaxCooldown;
                }
            }
        }

        this.attractPellets();

        if (this.flyingPortal) {
            this.flyingPortal.progress += 0.03;
            if (this.flyingPortal.progress >= 1) {
                const targetX = this.flyingPortal.targetX;
                const targetY = this.flyingPortal.targetY;
                if (this.portalStage === 1) {
                    this.portal1 = { x: targetX, y: targetY, active: true };
                } else if (this.portalStage === 2) {
                    this.portal2 = { x: targetX, y: targetY, active: true };
                }
                this.flyingPortal = null;
                if (this.portalStage === 2) {
                    this.portalActive = true;
                }
            } else {
                const t = this.flyingPortal.progress;
                this.flyingPortal.x = this.flyingPortal.startX + (this.flyingPortal.targetX - this.flyingPortal.startX) * t;
                this.flyingPortal.y = this.flyingPortal.startY + (this.flyingPortal.targetY - this.flyingPortal.startY) * t;
            }
        }

        for (let i = this.portalParticles.length - 1; i >= 0; i--) {
            const p = this.portalParticles[i];
            p.life -= 0.016;
            p.x += p.vx * 0.016;
            p.y += p.vy * 0.016;
            if (p.life <= 0) {
                this.portalParticles.splice(i, 1);
            }
        }
    }

    updateAbilityStats() {
        const cooldowns = [14, 13, 12, 10.5, 9];
        this.teslaMaxCooldown = cooldowns[Math.min(this.ability2Level, cooldowns.length-1)] || 14;
        const invincibleDurations = [0.5, 0.75, 1, 1.25, 1.5];
        this.teleportInvincibleDuration = invincibleDurations[Math.min(this.ability1Level, invincibleDurations.length-1)] || 0.5;
    }

    attractPellets() {
        if (!manager || !manager.pellets) return;
        const px = this.x;
        const py = this.y;
        const radiusSq = this.passiveRadius * this.passiveRadius;
        for (const pellet of manager.pellets) {
            const dx = pellet.x - px;
            const dy = pellet.y - py;
            const distSq = dx*dx + dy*dy;
            if (distSq < radiusSq && distSq > 1) {
                const dist = Math.sqrt(distSq);
                const force = this.attractForce;
                pellet.x -= (dx / dist) * force;
                pellet.y -= (dy / dist) * force;
            }
        }
    }

    activatePortal() {
        if (manager && manager.darkRedBlock) return false;
        if (this.portalCooldown > 0) return false;
        if (this.energy < this.portalEnergyCost) return false;
        if (this.ability1Level === 0) return false;

        if (this.portalStage === 2) {
            this.portal1 = null;
            this.portal2 = null;
            this.portalStage = 0;
            this.portalActive = false;
            this.flyingPortal = null;
            this.portalParticles = [];
        }

        let dx = 0, dy = 0;
        if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
        if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
        if (keys['KeyD'] || keys['ArrowRight']) dx = 1;
        if (dx === 0 && dy === 0) {
            dx = this.lastDirection.dx || 1;
            dy = this.lastDirection.dy || 0;
        }
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len > 0) { dx /= len; dy /= len; }
        this.lastDirection.dx = dx;
        this.lastDirection.dy = dy;

        const throwDistance = 80;
        const targetX = this.x + dx * throwDistance;
        const targetY = this.y + dy * throwDistance;
        const clampedX = Math.max(this.radius, Math.min(level.mapWidth - this.radius, targetX));
        const clampedY = Math.max(this.radius, Math.min(level.mapHeight - this.radius, targetY));

        this.energy -= this.portalEnergyCost;
        this.portalCooldown = 1;

        this.flyingPortal = {
            startX: this.x,
            startY: this.y,
            targetX: clampedX,
            targetY: clampedY,
            progress: 0
        };

        if (this.portalStage === 0) {
            this.portalStage = 1;
        } else if (this.portalStage === 1) {
            this.portalStage = 2;
        }
        return true;
    }

    checkPortalTeleport() {
        if (!this.portalActive) return;
        if (this.teleportCooldown > 0) return;
        if (!this.portal1 || !this.portal1.active) return;
        if (!this.portal2 || !this.portal2.active) return;
        if (this.energy < this.teleportEnergyCost) return;

        let dx = this.x - this.portal1.x;
        let dy = this.y - this.portal1.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < this.portalRadius + this.radius) {
            this.energy -= this.teleportEnergyCost;
            this.x = this.portal2.x;
            this.y = this.portal2.y;
            this.teleportCooldown = 1;
            this.invincible = true;
            this.teleportInvincibleTimer = this.teleportInvincibleDuration;
            this.createPortalParticles(this.portal1, this.portal2);
            return;
        }

        dx = this.x - this.portal2.x;
        dy = this.y - this.portal2.y;
        dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < this.portalRadius + this.radius) {
            this.energy -= this.teleportEnergyCost;
            this.x = this.portal1.x;
            this.y = this.portal1.y;
            this.teleportCooldown = 1;
            this.invincible = true;
            this.teleportInvincibleTimer = this.teleportInvincibleDuration;
            this.createPortalParticles(this.portal2, this.portal1);
        }
    }

    createPortalParticles(from, to) {
        const count = 30;
        for (let i = 0; i < count; i++) {
            const t = i / count;
            const x = from.x + (to.x - from.x) * t + (Math.random() - 0.5) * 20;
            const y = from.y + (to.y - from.y) * t + (Math.random() - 0.5) * 20;
            this.portalParticles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 1.0 + Math.random() * 0.5
            });
        }
    }

    activateTesla() {
        if (manager && manager.darkRedBlock) return false;
        if (this.teslaOnCooldown) return false;
        if (this.energy < this.teslaEnergyCost) return false;
        if (this.ability2Level === 0) return false;
        if (this.teslaStation && this.teslaStation.active) {
            this.teslaStation.active = false;
            this.teslaStation = null;
        }

        this.energy -= this.teslaEnergyCost;
        this.teslaStation = {
            x: this.x,
            y: this.y,
            radius: this.teslaRadius,
            active: true
        };
        this.teslaEnergyTimer = 0;
        this.teslaOnCooldown = true;
        this.teslaCooldown = this.teslaMaxCooldown;
        return true;
    }

    drawEffects(ctx, scale) {
        const cx = ctx.canvas.width / 2;
        const cy = ctx.canvas.height / 2;
        const time = Date.now() / 1000;

        if (this.flyingPortal) {
            const fp = this.flyingPortal;
            const drawX = (fp.x - this.x) * scale + cx;
            const drawY = (fp.y - this.y) * scale + cy;
            const progress = fp.progress;
            const radius = this.portalRadius * scale * (0.5 + progress * 0.5);
            ctx.fillStyle = '#000000';
            ctx.shadowColor = 'rgba(0,0,0,0)';
            ctx.beginPath();
            ctx.arc(drawX, drawY, radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
            const segments = 8;
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2 + time * 2 * progress;
                const r1 = radius * 0.8;
                const r2 = radius * 1.0;
                const x1 = drawX + Math.cos(angle) * r1;
                const y1 = drawY + Math.sin(angle) * r1;
                const x2 = drawX + Math.cos(angle + 0.2) * r2;
                const y2 = drawY + Math.sin(angle + 0.2) * r2;
                ctx.strokeStyle = '#8B00FF';
                ctx.lineWidth = 2 * scale;
                ctx.shadowColor = '#8B00FF';
                ctx.shadowBlur = 8 * scale;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        }

        if (this.portal1 && this.portal1.active) {
            this.drawPortal(ctx, this.portal1, scale, cx, cy, time);
        }
        if (this.portal2 && this.portal2.active) {
            this.drawPortal(ctx, this.portal2, scale, cx, cy, time);
        }

        for (const p of this.portalParticles) {
            const drawX = (p.x - this.x) * scale + cx;
            const drawY = (p.y - this.y) * scale + cy;
            const alpha = p.life;
            ctx.globalAlpha = alpha * 0.8;
            ctx.fillStyle = '#8B00FF';
            ctx.shadowColor = '#8B00FF';
            ctx.shadowBlur = 10 * scale;
            ctx.beginPath();
            ctx.arc(drawX, drawY, 3 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }

        if (this.teslaStation && this.teslaStation.active) {
            const drawX = (this.teslaStation.x - this.x) * scale + cx;
            const drawY = (this.teslaStation.y - this.y) * scale + cy;
            const drawR = this.teslaStation.radius * scale;

            ctx.fillStyle = 'rgba(34, 25, 58, 0.2)';
            ctx.shadowColor = '#8B00FF';
            ctx.shadowBlur = 30 * scale;
            ctx.beginPath();
            ctx.arc(drawX, drawY, drawR, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            const centerR = 12 * scale;
            ctx.fillStyle = '#8B00FF';
            ctx.shadowColor = '#8B00FF';
            ctx.shadowBlur = 20 * scale;
            ctx.beginPath();
            ctx.arc(drawX, drawY, centerR, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + time * 1.5;
                const r = drawR * 0.8;
                const x1 = drawX + Math.cos(angle) * r;
                const y1 = drawY + Math.sin(angle) * r;
                const x2 = drawX + Math.cos(angle + 0.3) * (r * 0.6);
                const y2 = drawY + Math.sin(angle + 0.3) * (r * 0.6);
                ctx.strokeStyle = 'rgba(139, 0, 255, 0.5)';
                ctx.lineWidth = 2 * scale;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.quadraticCurveTo((x1+x2)/2 + 10*scale, (y1+y2)/2 - 10*scale, x2, y2);
                ctx.stroke();
            }
        }
    }

    drawPortal(ctx, portal, scale, cx, cy, time) {
        const drawX = (portal.x - this.x) * scale + cx;
        const drawY = (portal.y - this.y) * scale + cy;
        const drawR = this.portalRadius * scale;

        ctx.fillStyle = '#000000';
        ctx.shadowColor = 'rgba(0,0,0,0)';
        ctx.beginPath();
        ctx.arc(drawX, drawY, drawR * 0.8, 0, Math.PI * 2);
        ctx.fill();

        const segments = 8;
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2 + time * 1.5;
            const r1 = drawR * 0.8;
            const r2 = drawR * 1.0;
            const x1 = drawX + Math.cos(angle) * r1;
            const y1 = drawY + Math.sin(angle) * r1;
            const x2 = drawX + Math.cos(angle + 0.2) * r2;
            const y2 = drawY + Math.sin(angle + 0.2) * r2;
            ctx.strokeStyle = '#8B00FF';
            ctx.lineWidth = 2 * scale;
            ctx.shadowColor = '#8B00FF';
            ctx.shadowBlur = 8 * scale;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + time * 2;
            const r = drawR * 0.9;
            const x = drawX + Math.cos(angle) * r;
            const y = drawY + Math.sin(angle) * r;
            ctx.fillStyle = 'rgba(139, 0, 255, 0.6)';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(x, y, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    respawn(x, y) {
        super.respawn(x, y);
        this.portal1 = null;
        this.portal2 = null;
        this.portalStage = 0;
        this.portalActive = false;
        this.flyingPortal = null;
        this.portalParticles = [];
        this.teslaStation = null;
        this.teslaOnCooldown = false;
        this.teslaCooldown = 0;
        this.teslaEnergyTimer = 0;
        this.portalCooldown = 0;
        this.teleportCooldown = 0;
        this.teleportInvincibleTimer = 0;
        this.invincible = false;
    }
}