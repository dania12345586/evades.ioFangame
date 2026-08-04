// js/enemy.js

class Enemy {
    constructor(x, y, speed = 2.1, radius = 21, color = '#888888') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = speed;
        const angle = randomRange(0, Math.PI * 2);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.color = color;
        this.strokeColor = '#000000';
        this.lineWidth = 2;
        this.stunned = false;
        this.stunTimer = 0;
        this.originalColor = color;
        this.type = 'basic';
        this.isAura = false;
        this.auraRadius = 0;
        this.auraColor = 'rgba(0,0,0,0)';
        this.isStatic = false;
        this.playerRef = null;
        this._rootSlowed = false;
        this._auraDisabled = false;
        this._neutralized = false;
        this._neutralizeTimer = 0;
        this._teslaNeutralized = false;
    }

    setPlayerRef(player) {
        this.playerRef = player;
    }

    update(mapWidth, mapHeight, mult = 1) {
        if (this.stunned) {
            this.x += this.vx * 0.1;
            this.y += this.vy * 0.1;
            return;
        }
        if (this.isStatic) return;
        this.x += this.vx * mult;
        this.y += this.vy * mult;

        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx = -this.vx;
        } else if (this.x + this.radius > mapWidth) {
            this.x = mapWidth - this.radius;
            this.vx = -this.vx;
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy = -this.vy;
        } else if (this.y + this.radius > mapHeight) {
            this.y = mapHeight - this.radius;
            this.vy = -this.vy;
        }
    }

    applyPush(vx, vy) {
        if (this.stunned || this.isStatic) return;
        this.vx += vx;
        this.vy += vy;
        const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxSpeed = this.speed * 2;
        if (spd > maxSpeed) {
            this.vx = (this.vx / spd) * maxSpeed;
            this.vy = (this.vy / spd) * maxSpeed;
        }
    }

    draw(ctx, offsetX, offsetY, scale) {
        const drawX = this.x * scale + offsetX;
        const drawY = this.y * scale + offsetY;
        const drawR = this.radius * scale;

        let alpha = this.stunned ? 0.3 : 1.0;
        if (this._neutralized || this._teslaNeutralized) {
            alpha = 0.4;
        }

        if (this.isAura && !this.stunned && !this._auraDisabled) {
            const auraR = this.auraRadius * scale;
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = this.auraColor;
            ctx.beginPath();
            ctx.arc(drawX, drawY, auraR, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(drawX, drawY, drawR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = this.lineWidth * scale;
        ctx.stroke();
        ctx.closePath();
        ctx.globalAlpha = 1.0;
    }
}

// ---- Существующие наследники ----

class RedEnemy extends Enemy {
    constructor(x, y, speed = 2.1, radius = 24) {
        super(x, y, speed, radius, '#ff4444');
        this.type = 'red';
        this.isAura = true;
        this.auraRadius = 260;
        this.auraColor = 'rgba(255, 68, 68, 0.3)';
        this.slowPercent = 0.3;
    }
}

class BlueEnemy extends Enemy {
    constructor(x, y, speed = 2.1, radius = 24) {
        super(x, y, speed, radius, '#4488ff');
        this.type = 'blue';
        this.isAura = true;
        this.auraRadius = 260;
        this.auraColor = 'rgba(68, 136, 255, 0.3)';
        this.drainPerSecond = 10;
    }
}

class YellowEnemy extends Enemy {
    constructor(x, y, speed = 2.1, radius = 24) {
        super(x, y, speed, radius, '#ffdd44');
        this.type = 'yellow';
        this.isAura = true;
        this.auraRadius = 260;
        this.auraColor = 'rgba(255, 221, 68, 0.2)';
        this.paralyzeTime = 3;
    }
}

class DarkRedEnemy extends Enemy {
    constructor(x, y, speed = 2.1, radius = 24) {
        super(x, y, speed, radius, '#8b0000');
        this.type = 'darkred';
        this.isAura = true;
        this.auraRadius = 260;
        this.auraColor = 'rgba(139, 0, 0, 0.5)';
        this.blocksAbilities = true;
    }
}

class BlackEnemy extends Enemy {
    constructor(x, y, speed = 2.1, radius = 24, safeZoneWidth = 300, mapWidth = 2600, mapHeight = 700, index = 0, total = 1) {
        const finalSpeed = speed * 0.8;
        super(x, y, finalSpeed, radius, '#111111');
        this.type = 'black';
        this.isAura = false;
        this.strokeColor = '#ffffff';
        this.lineWidth = 3;
        this.immune = true;
        this.safeZoneWidth = safeZoneWidth;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.wallOffset = radius + 5;
        this.index = index;
        this.total = total;
        this.angle = (index / total) * 2 * Math.PI;
        this.setPositionOnPerimeter();
        this.direction = 1;
        this.speed = finalSpeed;
    }

    setPositionOnPerimeter() {
        const margin = this.wallOffset;
        const leftBound = this.safeZoneWidth + margin;
        const rightBound = this.mapWidth - this.safeZoneWidth - margin;
        const topBound = margin;
        const bottomBound = this.mapHeight - margin;

        const width = rightBound - leftBound;
        const height = bottomBound - topBound;
        const perimeter = 2 * (width + height);
        const progress = (this.angle / (2 * Math.PI)) % 1;

        let totalProgress = progress * perimeter;
        let x, y;
        if (totalProgress < width) {
            x = leftBound + totalProgress;
            y = topBound;
        } else if (totalProgress < width + height) {
            x = rightBound;
            y = topBound + (totalProgress - width);
        } else if (totalProgress < 2 * width + height) {
            x = rightBound - (totalProgress - width - height);
            y = bottomBound;
        } else {
            x = leftBound;
            y = bottomBound - (totalProgress - 2 * width - height);
        }

        this.x = Math.max(leftBound + 2, Math.min(rightBound - 2, x));
        this.y = Math.max(topBound + 2, Math.min(bottomBound - 2, y));
        this._prevAngle = this.angle;
    }

    update(mapWidth, mapHeight, mult = 1) {
        if (this.mapWidth !== mapWidth || this.mapHeight !== mapHeight) {
            this.mapWidth = mapWidth;
            this.mapHeight = mapHeight;
            this.setPositionOnPerimeter();
        }
        const speed = this.speed * mult;
        const deltaAngle = (speed / (2 * Math.PI * 100)) * 2;
        this.angle += deltaAngle * this.direction;
        this.setPositionOnPerimeter();
    }

    applyPush(vx, vy) {}
}

class VenomSpitter extends Enemy {
    constructor(x, y, speed = 2.0, radius = 18) {
        super(x, y, speed, radius, '#006400');
        this.type = 'venom';
    }
}

class ToxicEnemy extends Enemy {
    constructor(x, y, speed = 3.3, radius = 68) {
        super(x, y, speed, radius, '#32CD32');
        this.type = 'toxic';
    }
}

class SlashEnemy extends Enemy {
    constructor(x, y, speed = 2.2, radius = 16) {
        super(x, y, speed, radius, '#4a4a4a');
        this.type = 'slash';
        this.agroRange = 260;
    }
}

class TreeEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 0, 60, '#8B5A2B');
        this.type = 'tree';
        this.isStatic = true;
        this.vx = 0;
        this.vy = 0;
        this.speed = 0;
        this.radius = 60;
        this.strokeColor = '#5D3A1A';
        this.lineWidth = 3;
    }
    update(mapWidth, mapHeight, mult = 1) {}
    applyPush(vx, vy) {}
    draw(ctx, offsetX, offsetY, scale) {
        const drawX = this.x * scale + offsetX;
        const drawY = this.y * scale + offsetY;
        const drawR = this.radius * scale;
        let alpha = 1.0;
        if (this._neutralized || this._teslaNeutralized) alpha = 0.4;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#8B5A2B';
        ctx.shadowColor = '#5D3A1A';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(drawX, drawY, drawR, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
    }
}

// ---- НОВЫЕ ВРАГИ ДЛЯ FACTORY FORTRESS ----

class TurretEnemy extends Enemy {
    constructor(x, y, speed = 0, radius = 30) {
        super(x, y, speed, radius, '#ff8800');
        this.type = 'turret';
        this.isStatic = true;
        this.vx = 0;
        this.vy = 0;
        this.shootTimer = 0;
        this.burstActive = false;
        this.burstCount = 3;
        this.burstTimer = 0;
        this.innerRadius = radius * 0.6;
        this.innerColor = '#ffaa00';
        this.barrelLength = 22;
        this.barrelWidth = 10;
    }
}

class BomberEnemy extends Enemy {
    constructor(x, y, speed = 3.0, radius = 20) {
        super(x, y, speed, radius, '#cc5500');
        this.type = 'bomber';
        this.color = '#cc5500';
        this.mineTimer = 0;
        this.mineInterval = 2;
        this.maxMines = 3;
        this.minesPlaced = 0;
        this.mineRadius = 12;
    }
}

class OrangeAuraEnemy extends Enemy {
    constructor(x, y, speed = 1.2, radius = 24) {
        super(x, y, speed, radius, '#cc6600');
        this.type = 'orangeaura';
        this.isAura = true;
        this.auraRadius = 200;
        this.auraColor = 'rgba(255, 136, 0, 0.15)';
        this.chargeTime = 2.5;
        this.chargeTimer = 0;
        this.charging = false;
        this.exploded = false;
    }
}

class StealthEnemy extends Enemy {
    constructor(x, y, speed = 1.5, radius = 18) {
        super(x, y, speed, radius, '#3a3a3a');
        this.type = 'stealth';
        this.color = '#3a3a3a';
        this.invisible = false;
        this.visibilityTimer = 0;
        this.visibilityInterval = 3;
        this.invisibleDuration = 2;
        this.used = false;
        this.opacity = 1.0;
        this.targetOpacity = 1.0;
    }
}

// ---- Отрисовка новых врагов ----

TurretEnemy.prototype.draw = function(ctx, offsetX, offsetY, scale) {
    const drawX = this.x * scale + offsetX;
    const drawY = this.y * scale + offsetY;
    const drawR = this.radius * scale;

    let alpha = 1.0;
    if (this._neutralized || this._teslaNeutralized) alpha = 0.4;
    ctx.globalAlpha = alpha;

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(drawX, drawY, drawR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cc7700';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    const innerR = this.innerRadius * scale;
    ctx.fillStyle = this.innerColor;
    ctx.beginPath();
    ctx.arc(drawX, drawY, innerR, 0, Math.PI * 2);
    ctx.fill();

    if (this.playerRef) {
        const dx = this.playerRef.x - this.x;
        const dy = this.playerRef.y - this.y;
        const angle = Math.atan2(dy, dx);
        const barrelLen = this.barrelLength * scale;
        const barrelW = this.barrelWidth * scale;
        const startX = drawX + Math.cos(angle) * (drawR * 0.3);
        const startY = drawY + Math.sin(angle) * (drawR * 0.3);
        ctx.save();
        ctx.translate(startX, startY);
        ctx.rotate(angle);
        ctx.fillStyle = '#cc8800';
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 5 * scale;
        ctx.fillRect(0, -barrelW/2, barrelLen, barrelW);
        ctx.shadowBlur = 0;
        ctx.restore();
    } else {
        const barrelLen = this.barrelLength * scale;
        const barrelW = this.barrelWidth * scale;
        ctx.fillStyle = '#cc8800';
        ctx.fillRect(drawX + drawR * 0.3, drawY - barrelW/2, barrelLen, barrelW);
    }
    ctx.globalAlpha = 1.0;
};

BomberEnemy.prototype.draw = function(ctx, offsetX, offsetY, scale) {
    const drawX = this.x * scale + offsetX;
    const drawY = this.y * scale + offsetY;
    const drawR = this.radius * scale;

    let alpha = 1.0;
    if (this._neutralized || this._teslaNeutralized) alpha = 0.4;
    ctx.globalAlpha = alpha;

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(drawX, drawY, drawR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#aa4400';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    ctx.globalAlpha = 1.0;
};

StealthEnemy.prototype.draw = function(ctx, offsetX, offsetY, scale) {
    if (this.opacity <= 0) return;
    const drawX = this.x * scale + offsetX;
    const drawY = this.y * scale + offsetY;
    const drawR = this.radius * scale;

    let alpha = this.opacity;
    if (this._neutralized || this._teslaNeutralized) alpha = this.opacity * 0.4;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(drawX, drawY, drawR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();
    ctx.globalAlpha = 1;
};