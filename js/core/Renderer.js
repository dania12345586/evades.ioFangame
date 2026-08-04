// js/core/Renderer.js

const Renderer = {
    renderScene: function(ctx, canvas, player, manager, currentMapIndex, SCALE, MAP_COLOR) {
        const offsetX = canvas.width / 2 - player.x * SCALE;
        const offsetY = canvas.height / 2 - player.y * SCALE;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        const mapX = offsetX;
        const mapY = offsetY;
        const mapW = manager.mapWidth * SCALE;
        const mapH = manager.mapHeight * SCALE;
        ctx.beginPath();
        ctx.rect(mapX, mapY, mapW, mapH);
        ctx.clip();

        this.renderMapBackground(ctx, manager, offsetX, offsetY, SCALE);
        this.renderPellets(ctx, manager.pellets, offsetX, offsetY, SCALE);
        this.renderEnemies(ctx, manager.enemies, offsetX, offsetY, SCALE);
        this.renderMapPortals(ctx, manager, offsetX, offsetY, SCALE, player);
        this.renderSafeZones(ctx, manager, offsetX, offsetY, SCALE);

        ctx.restore();

        // Сетка удалена

        this.renderPlayer(ctx, player, SCALE);
        if (player.drawEffects) player.drawEffects(ctx, SCALE);

        this.renderInterMapPortals(ctx, canvas, player, manager, currentMapIndex, offsetX, offsetY, SCALE);
        this.renderEnergyBar(ctx, player, canvas, SCALE);
        this.renderParalysisBar(ctx, player, manager, canvas, SCALE);
    },

    renderMapBackground: function(ctx, manager, offsetX, offsetY, scale) {
        if (manager.isVictory && manager.victoryColor) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = manager.victoryColor;
            ctx.fillRect(offsetX, offsetY, manager.mapWidth * scale, manager.mapHeight * scale);
            ctx.globalAlpha = 1;
            ctx.restore();
        } else {
            ctx.fillStyle = manager.backgroundColor || '#1a1a2e';
            ctx.fillRect(offsetX, offsetY, manager.mapWidth * scale, manager.mapHeight * scale);
        }
        if (manager.bgDarkness > 0.01) {
            ctx.save();
            ctx.globalAlpha = manager.bgDarkness * 0.5;
            ctx.fillStyle = '#000000';
            ctx.fillRect(offsetX, offsetY, manager.mapWidth * scale, manager.mapHeight * scale);
            ctx.globalAlpha = 1;
            ctx.restore();
        }
    },

    renderPellets: function(ctx, pellets, offsetX, offsetY, scale) {
        for (const p of pellets) {
            const drawX = p.x * scale + offsetX;
            const drawY = p.y * scale + offsetY;
            const drawR = p.radius * scale;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(drawX, drawY, drawR, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    renderEnemies: function(ctx, enemies, offsetX, offsetY, scale) {
        for (const enemy of enemies) {
            enemy.draw(ctx, offsetX, offsetY, scale);
        }
    },

    renderMapPortals: function(ctx, manager, offsetX, offsetY, scale, player) {
        if (manager.isVictory) {
            let portalX = (manager.portalSide === 'left') ? 0 * scale + offsetX : manager.mapWidth * scale + offsetX - 20 * scale;
            const portalY = 0 * scale + offsetY;
            const portalH = manager.mapHeight * scale;
            ctx.fillStyle = 'rgba(46, 213, 115, 0.6)';
            ctx.fillRect(portalX, portalY, 20 * scale, portalH);
            ctx.fillStyle = '#fff';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            const label = manager.portalSide === 'left' ? '← START' : '→ START';
            ctx.fillText(label, portalX + 10 * scale, (50 - player.y) * scale + offsetY);
        } else if (!manager.isFinal) {
            const exitX = manager.mapWidth * scale + offsetX - 20 * scale;
            const exitY = 0 * scale + offsetY;
            const exitH = manager.mapHeight * scale;
            ctx.fillStyle = 'rgba(46, 213, 115, 0.25)';
            ctx.fillRect(exitX, exitY, 20 * scale, exitH);
            if (manager.levelNumber > 1) {
                const leftX = 0 * scale + offsetX;
                const leftY = 0 * scale + offsetY;
                ctx.fillStyle = 'rgba(46, 213, 115, 0.25)';
                ctx.fillRect(leftX, leftY, 20 * scale, exitH);
            }
        }
    },

    renderSafeZones: function(ctx, manager, offsetX, offsetY, scale) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        const leftW = manager.safeZoneWidth * scale;
        const rightX = (manager.mapWidth - manager.safeZoneWidth) * scale + offsetX;
        const rightW = manager.safeZoneWidth * scale;
        ctx.fillRect(offsetX, offsetY, leftW, manager.mapHeight * scale);
        ctx.fillRect(rightX, offsetY, rightW, manager.mapHeight * scale);
    },

    renderPlayer: function(ctx, player, scale) {
        player.draw(ctx, scale);
    },

    renderInterMapPortals: function(ctx, canvas, player, manager, currentMapIndex, offsetX, offsetY, scale) {
        if (currentMapIndex === 0 && manager.levelNumber === 1) {
            const portalX = offsetX;
            const portalY = offsetY;
            const portalW = manager.safeZoneWidth * scale;
            const portalH = 40 * scale;
            ctx.fillStyle = 'rgba(0, 100, 255, 0.25)';
            ctx.fillRect(portalX, portalY, portalW, portalH);
            ctx.strokeStyle = 'rgba(0, 100, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(portalX, portalY, portalW, portalH);
        }
        if (currentMapIndex === 1 && manager.levelNumber === 1) {
            const portalX = offsetX;
            const portalY = offsetY + manager.mapHeight * scale - 40 * scale;
            const portalW = manager.safeZoneWidth * scale;
            const portalH = 40 * scale;
            ctx.fillStyle = 'rgba(255, 100, 0, 0.25)';
            ctx.fillRect(portalX, portalY, portalW, portalH);
            ctx.strokeStyle = 'rgba(255, 100, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(portalX, portalY, portalW, portalH);
        }
    },

    renderEnergyBar: function(ctx, player, canvas, scale) {
        const energyBarWidth = 34;
        const energyBarHeight = 4;
        const barX = canvas.width / 2 - energyBarWidth / 2;
        const barY = canvas.height / 2 - player.radius * scale - 12;
        const energyPercent = player.energy / player.maxEnergy;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX, barY, energyBarWidth, energyBarHeight);
        ctx.fillStyle = '#4488ff';
        ctx.fillRect(barX, barY, energyBarWidth * energyPercent, energyBarHeight);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, energyBarWidth, energyBarHeight);
    },

    renderParalysisBar: function(ctx, player, manager, canvas, scale) {
        if (manager.paralyzeTimer > 0 || manager.isParalyzed) {
            const barWidth = 60;
            const barHeight = 6;
            const barX = canvas.width / 2 - barWidth / 2;
            const barY = canvas.height / 2 - player.radius * scale - 20;
            const progress = Math.min(manager.paralyzeTimer / manager.paralyzeThreshold, 1);
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = manager.isParalyzed ? '#ff4444' : '#ffdd44';
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
        if (manager.isParalyzed) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PARALYZED', canvas.width / 2, canvas.height / 2 - 60);
        }
    }
};