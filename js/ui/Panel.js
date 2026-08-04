
// js/ui/Panel.js

// Описания способностей
const abilityDescriptions = {
    scutumDash: {
        name: 'Dash',
        desc: (level) => {
            const lvl = level || 0;
            const stun = [1, 1.3, 1.6, 1.9, 2.2][Math.min(lvl-1, 4)] || 1;
            const cd = [9, 8, 7, 6, 5][Math.min(lvl-1, 4)] || 9;
            return `Dash forward, stunning enemies in your path.\nStun duration: ${stun.toFixed(1)}s\nCooldown: ${cd}s\nCost: 25 Energy`;
        }
    },
    scutumWave: {
        name: 'Wave',
        desc: (level) => {
            const lvl = level || 0;
            const stun = [1, 1.3, 1.6, 1.9, 2.2][Math.min(lvl-1, 4)] || 1;
            const cd = [15, 14, 13, 12, 11][Math.min(lvl-1, 4)] || 15;
            return `Charge and release a shockwave, stunning nearby enemies.\nStun duration: ${stun.toFixed(1)}s\nCooldown: ${cd}s\nCost: 40 Energy`;
        }
    },
    sylvanusRootZone: {
        name: 'Root Zone',
        desc: (level) => {
            const lvl = level || 0;
            const dur = [3, 3.5, 4, 4.5, 5][Math.min(lvl-1, 4)] || 3;
            const cd = 8;
            return `Create a zone that slows enemies and disables their auras.\nDuration: ${dur.toFixed(1)}s\nCooldown: ${cd}s\nCost: 20 Energy`;
        }
    },
    sylvanusBark: {
        name: 'Bark',
        desc: (level) => {
            const lvl = level || 0;
            const dur = [2.9, 3.2, 3.5, 3.8, 4][Math.min(lvl-1, 4)] || 2.9;
            const cd = 9;
            return `Coats you in bark, blocking one lethal hit and stunning the attacker.\nDuration: ${dur.toFixed(1)}s\nCooldown: ${cd}s\nCost: 40 Energy`;
        }
    },
    crepitusMine: {
        name: 'Mine',
        desc: (level) => {
            const lvl = level || 0;
            const stun = [1.3, 1.6, 1.9, 2.2, 2.5][Math.min(lvl-1, 4)] || 1.3;
            const maxMines = [1, 1, 2, 2, 3][Math.min(lvl-1, 4)] || 1;
            return `Place a blue mine. When an enemy steps on it, it explodes, stunning enemies in radius.\nStun duration: ${stun.toFixed(1)}s\nMax mines: ${maxMines}\nCooldown: 2.5s\nCost: 20 Energy`;
        }
    },
    crepitusRocket: {
        name: 'Rocket',
        desc: (level) => {
            const lvl = level || 0;
            const slow = [0.4, 0.45, 0.5, 0.55, 0.6][Math.min(lvl-1, 4)] || 0.4;
            const dur = [1, 1.4, 1.8, 2.2, 2.5][Math.min(lvl-1, 4)] || 1;
            const slowDur = dur * 1.5;
            return `Launch a rocket that explodes on contact, slowing enemies.\nSlow: ${(slow*100).toFixed(0)}%\nDuration: ${slowDur.toFixed(1)}s\nCooldown: 8s\nCost: 35 Energy`;
        }
    },
    crepitusPassive: {
        name: 'Passive',
        desc: () => {
            return `Upon death, explode and stun all enemies in a large radius.\nRadius: 360\nStun duration: 1.5s\nCooldown: 5s`;
        }
    },
    vortexPortal: {
        name: 'Portal',
        desc: (level) => {
            return `Place two portals. Teleports you to the second portal if you have 15 energy.\nCooldown between placements: 1s\nCost: 5 per portal, 15 for teleport`;
        }
    },
    vortexTesla: {
        name: 'Tesla Station',
        desc: (level) => {
            const cd = [14, 13, 12, 10.5, 9][Math.min(level-1, 4)] || 14;
            return `Place a tesla station that neutralizes enemies in its aura.\nConsumes 10 energy per second.\nCooldown: ${cd}s\nCost: 10 energy to place`;
        }
    },
    vortexPassive: {
        name: 'Passive',
        desc: () => {
            return `Attracts pellets within 100px radius.`;
        }
    }
};

function drawBottomPanel() {
    const ability1Icon = window.ability1Icon;
    const ability2Icon = window.ability2Icon;
    const ability3Icon = window.ability3Icon;

    const panelHeight = 96;
    const panelY = canvas.height - panelHeight;
    const centerY = panelY + panelHeight / 2;

    const ballX = 40;
    const ballR = 24;
    const barX = ballX + ballR + 20;
    const barW = 170;
    const barH = 14;
    const barY = panelY + 18;

    const isCrepitus = player instanceof Crepitus;
    const isVortex = player instanceof Vortex;
    const statStartX = barX + barW + 130;
    const statSpacing = 115;
    const slotCount = (isCrepitus || isVortex) ? 6 : 5;
    const panelWidth = statStartX + slotCount * statSpacing + 60;

    const grad = ctx.createLinearGradient(0, panelY, 0, canvas.height);
    grad.addColorStop(0, 'rgba(20,20,30,0.95)');
    grad.addColorStop(1, 'rgba(0,0,0,0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, panelY);
    ctx.lineTo(panelWidth, panelY);
    ctx.stroke();

    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(ballX, centerY, ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.level, ballX, centerY);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(barX, barY, barW, barH);
    const progress = player.getExpProgress();
    ctx.fillStyle = '#ffd93d';
    ctx.fillRect(barX, barY, barW * progress, barH);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = '#eee';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.floor(player.exp)} / ${player.expToNext}`, barX + barW / 2, barY + barH / 2);

    ctx.fillStyle = '#ffd93d';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`SP: ${player.skillPoints}`, barX + barW + 18, centerY);

    const isSylvanus = player instanceof Sylvanus;

    let ab1Data, ab2Data, ab3Data;
    if (isCrepitus) {
        ab1Data = {
            cooldown: player.mineCooldown,
            maxCooldown: player.mineMaxCooldown,
            onCooldown: player.mineOnCooldown,
            level: player.ability1Level,
            isAbility: true,
            label: 'Mine',
            icon: ability1Icon,
            key: '4',
            hasDots: true,
            isPassive: false,
            alwaysUnlocked: false,
            descObj: abilityDescriptions.crepitusMine
        };
        ab2Data = {
            cooldown: player.rocketCooldown,
            maxCooldown: player.rocketMaxCooldown,
            onCooldown: player.rocketOnCooldown,
            level: player.ability2Level,
            isAbility: true,
            label: 'Rocket',
            icon: ability2Icon,
            key: '5',
            hasDots: true,
            isPassive: false,
            alwaysUnlocked: false,
            descObj: abilityDescriptions.crepitusRocket
        };
        ab3Data = {
            cooldown: player.passiveCooldown,
            maxCooldown: player.passiveMaxCooldown,
            onCooldown: player.passiveOnCooldown,
            level: 0,
            isAbility: true,
            label: 'Passive',
            icon: ability3Icon,
            key: '',
            hasDots: false,
            isPassive: true,
            alwaysUnlocked: true,
            descObj: abilityDescriptions.crepitusPassive
        };
    } else if (isVortex) {
        ab1Data = {
            cooldown: player.portalCooldown,
            maxCooldown: 1,
            onCooldown: player.portalCooldown > 0,
            level: player.ability1Level,
            isAbility: true,
            label: 'Portal',
            icon: ability1Icon,
            key: '4',
            hasDots: true,
            isPassive: false,
            alwaysUnlocked: false,
            descObj: abilityDescriptions.vortexPortal
        };
        ab2Data = {
            cooldown: player.teslaCooldown,
            maxCooldown: player.teslaMaxCooldown,
            onCooldown: player.teslaOnCooldown,
            level: player.ability2Level,
            isAbility: true,
            label: 'Tesla',
            icon: ability2Icon,
            key: '5',
            hasDots: true,
            isPassive: false,
            alwaysUnlocked: false,
            descObj: abilityDescriptions.vortexTesla
        };
        ab3Data = {
            cooldown: 0,
            maxCooldown: 1,
            onCooldown: false,
            level: 0,
            isAbility: true,
            label: 'Passive',
            icon: ability3Icon,
            key: '',
            hasDots: false,
            isPassive: true,
            alwaysUnlocked: true,
            descObj: abilityDescriptions.vortexPassive
        };
    } else {
        const ab1 = isSylvanus ? player.rootZone : player.dash;
        const ab2 = isSylvanus ? player.bark : player.wave;
        ab1Data = {
            cooldown: ab1?.cooldown || 0,
            maxCooldown: ab1?.maxCooldown || 1,
            onCooldown: ab1?.onCooldown || false,
            level: player.ability1Level,
            isAbility: true,
            label: 'Ability 1',
            icon: ability1Icon,
            key: '4',
            hasDots: true,
            isPassive: false,
            alwaysUnlocked: false,
            descObj: isSylvanus ? abilityDescriptions.sylvanusRootZone : abilityDescriptions.scutumDash
        };
        ab2Data = {
            cooldown: ab2?.cooldown || 0,
            maxCooldown: ab2?.maxCooldown || 1,
            onCooldown: ab2?.onCooldown || false,
            level: player.ability2Level,
            isAbility: true,
            label: 'Ability 2',
            icon: ability2Icon,
            key: '5',
            hasDots: true,
            isPassive: false,
            alwaysUnlocked: false,
            descObj: isSylvanus ? abilityDescriptions.sylvanusBark : abilityDescriptions.scutumWave
        };
        ab3Data = null;
    }

    const stats = [
        { label: 'Speed', value: player.speed.toFixed(1), key: '1' },
        { label: 'Energy', value: `${Math.floor(player.energy)}/${player.maxEnergy}`, key: '2' },
        { label: 'Regen', value: player.energyRegen.toFixed(1), key: '3' },
        ab1Data,
        ab2Data,
        ab3Data
    ].filter(s => s !== null);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Для тултипов
    if (!canvas._tooltipListenersAdded) {
        canvas.addEventListener('mousemove', handleCanvasMouseMove);
        canvas.addEventListener('mouseleave', handleCanvasMouseLeave);
        canvas._tooltipListenersAdded = true;
        canvas._abilityData = {};
    }

    for (let i = 0; i < stats.length; i++) {
        const s = stats[i];
        const x = statStartX + i * statSpacing;

        if (s.isAbility) {
            const boxSize = 32;
            const boxX = x - boxSize / 2;
            const boxY = centerY - boxSize / 2;
            const isUnlocked = s.alwaysUnlocked || s.level > 0;
            const isBlocked = manager.darkRedBlock && !s.isPassive;

            const iconRect = { x: boxX, y: boxY, width: boxSize, height: boxSize };
            canvas._abilityData[`${x}_${centerY}`] = { rect: iconRect, descObj: s.descObj, level: s.level };

            ctx.fillStyle = '#2a2a3a';
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.fillRect(boxX, boxY, boxSize, boxSize);
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(boxX, boxY, boxSize, boxSize);

            const icon = s.icon;
            const iconLoaded = (icon && icon.complete && icon.naturalWidth > 0);
            if (iconLoaded && isUnlocked && !isBlocked) {
                ctx.drawImage(icon, boxX, boxY, boxSize, boxSize);
            } else {
                const letters = ['Z', 'X', 'P'];
                const idx = i - 3;
                let fillColor;
                if (!isUnlocked) fillColor = '#444';
                else if (isBlocked) fillColor = '#666';
                else fillColor = '#4ecdc4';
                ctx.fillStyle = fillColor;
                ctx.fillRect(boxX + 2, boxY + 2, boxSize - 4, boxSize - 4);
                ctx.fillStyle = (isUnlocked && !isBlocked) ? '#fff' : '#999';
                ctx.font = 'bold 18px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(letters[idx] || '?', x, centerY);
            }

            if (!isUnlocked && !s.isPassive) {
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(boxX, boxY, boxSize, boxSize);
                ctx.fillStyle = '#888';
                ctx.font = '18px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🔒', x, centerY);
            } else if (isBlocked) {
                ctx.fillStyle = 'rgba(100,100,100,0.5)';
                ctx.fillRect(boxX, boxY, boxSize, boxSize);
                ctx.fillStyle = '#ff4444';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('⛔', x, centerY);
            } else if (s.onCooldown) {
                const progress2 = 1 - (s.cooldown / s.maxCooldown);
                ctx.save();
                ctx.beginPath();
                ctx.rect(boxX, boxY, boxSize, boxSize);
                ctx.clip();
                const startAngle = -Math.PI / 2;
                const endAngle = startAngle + (1 - progress2) * 2 * Math.PI;
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.beginPath();
                ctx.moveTo(x, centerY);
                ctx.arc(x, centerY, boxSize / 2, startAngle, endAngle);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            if (s.hasDots && !s.isPassive) {
                const dotRadius = 4;
                const dotSpacing = 10;
                const dotY = boxY - 8;
                const totalDots = 5;
                const filled = s.level;
                const startX = x - (totalDots - 1) * dotSpacing / 2;
                for (let d = 0; d < totalDots; d++) {
                    const dotX = startX + d * dotSpacing;
                    ctx.beginPath();
                    ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                    if (d < filled) {
                        ctx.fillStyle = '#ffd93d';
                        ctx.shadowBlur = 5;
                        ctx.shadowColor = '#ffd93d';
                    } else {
                        ctx.fillStyle = '#444';
                        ctx.shadowBlur = 0;
                    }
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            ctx.fillStyle = '#888';
            ctx.font = '10px Arial';
            ctx.textBaseline = 'top';
            ctx.fillText(s.label, x, boxY + boxSize + 4);

            if (s.key && player.skillPoints > 0 && !s.isPassive) {
                ctx.fillStyle = '#ffd93d';
                ctx.font = 'bold 12px Arial';
                ctx.textBaseline = 'bottom';
                ctx.fillText(`[${s.key}]`, x, boxY - 4);
            }
        } else {
            ctx.textBaseline = 'middle';
            ctx.font = '13px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText(s.label, x, centerY - 10);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 15px Arial';
            ctx.fillText(s.value, x, centerY + 14);
            if (player.skillPoints > 0) {
                ctx.fillStyle = '#ffd93d';
                ctx.font = 'bold 12px Arial';
                ctx.textBaseline = 'bottom';
                ctx.fillText(`[${s.key}]`, x, centerY - 24);
            }
        }
    }
}

// Обработчики тултипов (уже были, но оставлю для полноты)
function handleCanvasMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const data = canvas._abilityData;
    if (!data) return;

    let found = false;
    for (const key in data) {
        const entry = data[key];
        const r = entry.rect;
        if (mouseX >= r.x && mouseX <= r.x + r.width &&
            mouseY >= r.y && mouseY <= r.y + r.height) {
            const descObj = entry.descObj;
            if (descObj) {
                const descText = descObj.desc(entry.level);
                const title = descObj.name;
                showTooltip(e.clientX, e.clientY, title, descText);
                found = true;
                break;
            }
        }
    }
    if (!found) {
        hideTooltip();
    }
}

function handleCanvasMouseLeave() {
    hideTooltip();
}

function showTooltip(clientX, clientY, title, desc) {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;
    tooltip.style.display = 'block';
    tooltip.innerHTML = `<strong>${title}</strong><br><span style="font-size:13px; color:#ccc;">${desc.replace(/\n/g, '<br>')}</span>`;
    let left = clientX + 15;
    let top = clientY - 10;
    const tw = tooltip.offsetWidth || 280;
    const th = tooltip.offsetHeight || 100;
    if (left + tw > window.innerWidth) {
        left = clientX - tw - 15;
    }
    if (top + th > window.innerHeight) {
        top = window.innerHeight - th - 10;
    }
    if (top < 10) top = 10;
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) tooltip.style.display = 'none';
}