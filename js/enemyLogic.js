// js/enemyLogic.js

const EnemyLogic = {

    // ========== VENOM ==========
    updateVenom: function(enemy, player, projectiles, safeZoneWidth, mapWidth, mapHeight) {
        if (!enemy || enemy.stunned || !player) return;

        const playerInSafeZone = (player.x < safeZoneWidth || player.x > mapWidth - safeZoneWidth);
        if (!playerInSafeZone) {
            enemy.shootTimer = (enemy.shootTimer || 0) + 1/60;
            if (enemy.shootTimer >= (enemy.shootInterval || 3)) {
                enemy.shootTimer = 0;
                const dx = player.x - enemy.x;
                const dy = player.y - enemy.y;
                const len = Math.sqrt(dx*dx + dy*dy);
                if (len > 0) {
                    const speed = 120;
                    projectiles.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: (dx / len) * speed,
                        vy: (dy / len) * speed,
                        radius: 8,
                        life: 20,
                        owner: enemy,
                        color: '#00ff00'
                    });
                }
            }
        }

        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.x += p.vx * 0.016;
            p.y += p.vy * 0.016;
            p.life -= 0.016;
            if (p.x < safeZoneWidth || p.x > mapWidth - safeZoneWidth || p.y < 0 || p.y > mapHeight) {
                projectiles.splice(i, 1);
                continue;
            }
            if (p.life <= 0) {
                projectiles.splice(i, 1);
                continue;
            }
            if (player) {
                const dx = p.x - player.x;
                const dy = p.y - player.y;
                if (dx*dx + dy*dy < (player.radius + p.radius)**2) {
                    player.venomSlowActive = true;
                    player.slowModifier = 0.5;
                    if (player._venomTimeout) {
                        clearTimeout(player._venomTimeout);
                    }
                    player._venomTimeout = setTimeout(() => {
                        if (player) {
                            player.venomSlowActive = false;
                            if (!player.redSlowActive && !player.isParalyzed) {
                                player.slowModifier = 1;
                            }
                        }
                    }, 2000);
                    projectiles.splice(i, 1);
                }
            }
        }
    },

    // ========== TOXIC ==========
    updateToxic: function(enemy, player, toxicTrails) {
        if (!enemy) return;
        if (enemy.stunned) {
            for (let i = toxicTrails.length - 1; i >= 0; i--) {
                if (toxicTrails[i].owner === enemy) {
                    toxicTrails.splice(i, 1);
                }
            }
            return;
        }
        enemy.trailTimer = (enemy.trailTimer || 0) + 0.016;
        if (enemy.trailTimer >= (enemy.trailInterval || 0.2)) {
            enemy.trailTimer = 0;
            toxicTrails.push({
                x: enemy.x,
                y: enemy.y,
                radius: enemy.trailRadius || (enemy.radius * 0.9),
                life: 2.5,
                owner: enemy
            });
        }
        for (let i = toxicTrails.length - 1; i >= 0; i--) {
            const t = toxicTrails[i];
            t.life -= 0.016;
            if (t.life <= 0) {
                toxicTrails.splice(i, 1);
                continue;
            }
            if (player) {
                const dx = t.x - player.x;
                const dy = t.y - player.y;
                if (dx*dx + dy*dy < (player.radius + t.radius)**2) {
                    if (!player.invincible && !player.godMode) {
                        if (player.tryBlockDeath) {
                            if (player.tryBlockDeath(enemy)) continue;
                        }
                        player.alive = false;
                    }
                }
            }
        }
    },

    // ========== SLASH ==========
    updateSlash: function(enemy, player, slashStates, mapWidth, mapHeight, safeZoneWidth) {
        if (!enemy || enemy.stunned) return;
        let state = slashStates.get(enemy);
        if (!state) {
            state = {
                phase: 'idle',
                chargeTimer: 0,
                chargeDuration: 0.4,
                dashTimer: 0,
                dashDuration: 0.6,
                cooldownTimer: 0,
                cooldownDuration: 2,
                targetX: 0,
                targetY: 0,
                dashSpeed: 50,
                trail: [],
                dirX: 0,
                dirY: 0
            };
            slashStates.set(enemy, state);
        }

        const playerInSafeZone = (player.x < safeZoneWidth || player.x > mapWidth - safeZoneWidth);

        switch(state.phase) {
            case 'idle':
                if (!player || playerInSafeZone) {
                    enemy.update(mapWidth, mapHeight);
                    break;
                }
                const dx = player.x - enemy.x;
                const dy = player.y - enemy.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < (enemy.agroRange || 260)) {
                    state.phase = 'charging';
                    state.chargeTimer = state.chargeDuration;
                    state.targetX = player.x;
                    state.targetY = player.y;
                    enemy.vx = 0;
                    enemy.vy = 0;
                } else {
                    enemy.update(mapWidth, mapHeight);
                }
                break;

            case 'charging':
                state.chargeTimer -= 0.016;
                if (state.chargeTimer <= 0) {
                    state.phase = 'dashing';
                    state.dashTimer = state.dashDuration;
                    const dx2 = state.targetX - enemy.x;
                    const dy2 = state.targetY - enemy.y;
                    const len = Math.sqrt(dx2*dx2 + dy2*dy2);
                    if (len > 0) {
                        const speed = state.dashSpeed;
                        enemy.vx = (dx2 / len) * speed;
                        enemy.vy = (dy2 / len) * speed;
                        state.dirX = dx2 / len;
                        state.dirY = dy2 / len;
                    }
                    state.trail = [];
                }
                break;

            case 'dashing':
                state.dashTimer -= 0.016;
                enemy.x += enemy.vx;
                enemy.y += enemy.vy;
                enemy.x = Math.max(enemy.radius, Math.min(mapWidth - enemy.radius, enemy.x));
                enemy.y = Math.max(enemy.radius, Math.min(mapHeight - enemy.radius, enemy.y));
                if (Math.floor(state.dashTimer * 60) % 2 === 0) {
                    state.trail.push({x: enemy.x, y: enemy.y});
                    if (state.trail.length > 30) state.trail.shift();
                }
                if (state.dashTimer <= 0) {
                    state.phase = 'cooldown';
                    state.cooldownTimer = state.cooldownDuration;
                    enemy.vx = state.dirX * enemy.speed;
                    enemy.vy = state.dirY * enemy.speed;
                    state.trail = [];
                }
                break;

            case 'cooldown':
                state.cooldownTimer -= 0.016;
                enemy.update(mapWidth, mapHeight);
                if (state.cooldownTimer <= 0) {
                    state.phase = 'idle';
                    state.cooldownTimer = 0;
                }
                break;
        }
    },

    // ========== TURRET ==========
    updateTurret: function(enemy, player, projectiles, safeZoneWidth, mapWidth, mapHeight) {
        if (!enemy || enemy.stunned || enemy.type !== 'turret') return;
        const playerInSafeZone = (player.x < safeZoneWidth || player.x > mapWidth - safeZoneWidth);
        if (!playerInSafeZone) {
            const range = 500;
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist <= range) {
                if (enemy.burstActive) {
                    enemy.burstTimer -= 0.016;
                    if (enemy.burstTimer <= 0) {
                        if (dist > 0) {
                            const speed = 170;
                            projectiles.push({
                                x: enemy.x,
                                y: enemy.y,
                                vx: (dx / dist) * speed,
                                vy: (dy / dist) * speed,
                                radius: 8,
                                life: 5,
                                owner: enemy,
                                color: '#ffaa00'
                            });
                        }
                        enemy.burstCount--;
                        if (enemy.burstCount <= 0) {
                            enemy.burstActive = false;
                            enemy.burstCount = 3;
                            enemy.shootTimer = 0;
                        } else {
                            enemy.burstTimer = 0.2;
                        }
                    }
                } else {
                    enemy.shootTimer += 0.016;
                    if (enemy.shootTimer >= 2.0) {
                        enemy.shootTimer = 0;
                        enemy.burstActive = true;
                        enemy.burstTimer = 0.2;
                    }
                }
            }
        }

        // Обновление пуль ВСЕГДА
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            if (p.owner !== enemy) continue;
            p.x += p.vx * 0.016;
            p.y += p.vy * 0.016;
            p.life -= 0.016;
            if (p.x < 0 || p.x > mapWidth || p.y < 0 || p.y > mapHeight || p.life <= 0 ||
                p.x < safeZoneWidth || p.x > mapWidth - safeZoneWidth) {
                projectiles.splice(i, 1);
                continue;
            }
            if (player) {
                const dx2 = p.x - player.x;
                const dy2 = p.y - player.y;
                if (dx2*dx2 + dy2*dy2 < (player.radius + p.radius)**2) {
                    if (!player.invincible && !player.godMode) {
                        if (player.tryBlockDeath && player.tryBlockDeath(enemy)) {
                            projectiles.splice(i, 1);
                            continue;
                        }
                        player.alive = false;
                    }
                    projectiles.splice(i, 1);
                }
            }
        }
    },

    // ========== BOMBER ==========
    updateBomber: function(enemy, player, mines, safeZoneWidth, mapWidth, mapHeight) {
        if (!enemy || enemy.stunned || enemy.type !== 'bomber') return;
        if (enemy.minesPlaced >= enemy.maxMines) return;

        const playerInSafeZone = (player.x < safeZoneWidth || player.x > mapWidth - safeZoneWidth);
        if (playerInSafeZone) return;

        enemy.mineTimer += 0.016;
        if (enemy.mineTimer >= enemy.mineInterval) {
            enemy.mineTimer = 0;
            mines.push({
                x: enemy.x,
                y: enemy.y,
                radius: enemy.mineRadius || 12,
                life: 999,
                owner: enemy,
                opacity: 1.0,
                fadeTimer: 0,
                fadeDuration: 2,
                armed: false,
                armTimer: 0,
                armedDelay: 1.0
            });
            enemy.minesPlaced++;
        }
    },

    updateMines: function(mines, player, mapWidth, mapHeight) {
        for (let i = mines.length - 1; i >= 0; i--) {
            const mine = mines[i];
            if (mine.opacity > 0.1) {
                mine.fadeTimer += 0.016;
                mine.opacity = Math.max(0.1, 1.0 - (mine.fadeTimer / mine.fadeDuration) * 0.9);
            }
            if (!mine.armed) {
                mine.armTimer += 0.016;
                if (mine.armTimer >= mine.armedDelay) {
                    mine.armed = true;
                }
            }
            if (mine.armed && player) {
                const dx = mine.x - player.x;
                const dy = mine.y - player.y;
                if (dx*dx + dy*dy < (player.radius + mine.radius)**2) {
                    if (!player.invincible && !player.godMode) {
                        if (player.tryBlockDeath && player.tryBlockDeath(mine.owner)) {
                            mines.splice(i, 1);
                            continue;
                        }
                        player.alive = false;
                    }
                    mines.splice(i, 1);
                }
            }
            if (mine.x < 0 || mine.x > mapWidth || mine.y < 0 || mine.y > mapHeight) {
                mines.splice(i, 1);
            }
        }
    },

    // ========== ORANGE AURA ==========
    updateOrangeAura: function(enemy, player) {
        if (!enemy || enemy.type !== 'orangeaura' || enemy.exploded) return;
        if (enemy.stunned) return;
        if (enemy._auraDisabled) return;

        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distSq = dx*dx + dy*dy;
        const inAura = distSq < (enemy.auraRadius + player.radius)**2;

        if (inAura && player.alive) {
            enemy.charging = true;
            enemy.chargeTimer += 0.016;
            if (enemy.chargeTimer >= enemy.chargeTime) {
                enemy.exploded = true;
                const dist = Math.sqrt(distSq);
                if (dist < enemy.auraRadius) {
                    if (!player.invincible && !player.godMode) {
                        if (player.tryBlockDeath && player.tryBlockDeath(enemy)) {
                            enemy.exploded = false;
                            return;
                        }
                        player.alive = false;
                    }
                }
                enemy.chargeTimer = 0;
                enemy.charging = false;
            }
        } else {
            enemy.charging = false;
            enemy.chargeTimer = Math.max(0, enemy.chargeTimer - 0.016 * 0.5);
        }
    },

    // ========== STEALTH ==========
    updateStealth: function(enemy, player) {
        if (!enemy || enemy.type !== 'stealth' || enemy.used) return;
        if (enemy.stunned) return;

        enemy.visibilityTimer += 0.016;
        if (enemy.invisible) {
            if (enemy.visibilityTimer >= enemy.invisibleDuration) {
                enemy.invisible = false;
                enemy.visibilityTimer = 0;
                enemy.targetOpacity = 1.0;
            }
        } else {
            if (enemy.visibilityTimer >= enemy.visibilityInterval) {
                enemy.invisible = true;
                enemy.visibilityTimer = 0;
                enemy.targetOpacity = 0.0;
            }
        }

        const speed = 3.0;
        if (enemy.opacity < enemy.targetOpacity) {
            enemy.opacity = Math.min(enemy.targetOpacity, enemy.opacity + speed * 0.016);
        } else if (enemy.opacity > enemy.targetOpacity) {
            enemy.opacity = Math.max(enemy.targetOpacity, enemy.opacity - speed * 0.016);
        }
    },

    // ========== ОТРИСОВКА ==========
    drawProjectiles: function(ctx, projectiles, offsetX, offsetY, scale) {
        for (const p of projectiles) {
            const drawX = p.x * scale + offsetX;
            const drawY = p.y * scale + offsetY;
            const drawR = p.radius * scale;
            const color = p.color || '#ffaa00';
            ctx.shadowColor = color;
            ctx.shadowBlur = 15 * scale;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(drawX, drawY, drawR, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    },

    drawToxicTrails: function(ctx, toxicTrails, offsetX, offsetY, scale) {
        for (const t of toxicTrails) {
            const drawX = t.x * scale + offsetX;
            const drawY = t.y * scale + offsetY;
            const drawR = t.radius * scale;
            const alpha = Math.min(0.8, t.life / 1.5);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#32CD32';
            ctx.shadowColor = '#32CD32';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(drawX, drawY, drawR, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }
    },

    drawSlashTrails: function(ctx, slashStates, enemies, offsetX, offsetY, scale) {
        for (const [enemy, state] of slashStates) {
            if (state.phase === 'dashing' && state.trail.length > 0) {
                const trailRadius = enemy.radius * scale;
                for (const point of state.trail) {
                    const drawX = point.x * scale + offsetX;
                    const drawY = point.y * scale + offsetY;
                    const alpha = 0.5 * (state.dashTimer / state.dashDuration);
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = enemy.color;
                    ctx.beginPath();
                    ctx.arc(drawX, drawY, trailRadius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            }
        }
    }
};