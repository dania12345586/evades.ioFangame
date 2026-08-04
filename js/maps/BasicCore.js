// js/maps/BasicCore.js

class BasicCoreMap {
    constructor() {
        this.name = 'Chaos Core';
        this.mapWidth = 2600;
        this.mapHeight = 700;
        this.safeZoneWidth = 300;
        this.minPellets = 20;
        this.maxPellets = 40;
        this.pelletValue = 2;
        this.backgroundColor = '#1a1a2e';
        this.levels = this.generateLevels();
    }

    generateLevels() {
        const levels = [];

        // 1-4
        for (let i = 1; i <= 4; i++) {
            levels.push({
                name: `Chaos Core ${i}`,
                enemyTypes: [
                    { type: 'basic', count: 4 + i, speed: 2.1 + i * 0.1, radius: 18 + i * 2 }
                ]
            });
        }

        // 5-7
        for (let i = 5; i <= 7; i++) {
            levels.push({
                name: `Chaos Core ${i}`,
                enemyTypes: [
                    { type: 'basic', count: 5 + i, speed: 2.1, radius: 20 },
                    { type: 'red', count: 2 + Math.floor((i-5)/2), speed: 2.1, radius: 22 }
                ]
            });
        }

        // 8-9
        for (let i = 8; i <= 9; i++) {
            levels.push({
                name: `Chaos Core ${i}`,
                enemyTypes: [
                    { type: 'basic', count: 6 + i, speed: 2.1, radius: 20 },
                    { type: 'red', count: 3, speed: 2.1, radius: 22 },
                    { type: 'black', count: 2, speed: 2.1, radius: 20 }
                ]
            });
        }

        // 10
        levels.push({
            name: `Chaos Core 10`,
            enemyTypes: [
                { type: 'basic', count: 10, speed: 2.5, radius: 16 },
                { type: 'basic', count: 6, speed: 1.25, radius: 30 },
                { type: 'red', count: 4, speed: 2.1, radius: 22 },
                { type: 'black', count: 3, speed: 2.1, radius: 18 }
            ]
        });

        // 11-14
        for (let i = 11; i <= 14; i++) {
            levels.push({
                name: `Chaos Core ${i}`,
                enemyTypes: [
                    { type: 'basic', count: 5 + Math.floor(i/2), speed: 2.1, radius: 20 },
                    { type: 'red', count: 3, speed: 2.1, radius: 22 },
                    { type: 'blue', count: 2 + Math.floor((i-11)/2), speed: 2.1, radius: 22 },
                    { type: 'black', count: 2, speed: 2.1, radius: 20 }
                ]
            });
        }

        // 15-19
        for (let i = 15; i <= 19; i++) {
            levels.push({
                name: `Chaos Core ${i}`,
                enemyTypes: [
                    { type: 'basic', count: 4 + Math.floor(i/2), speed: 2.1, radius: 20 },
                    { type: 'red', count: 3, speed: 2.1, radius: 22 },
                    { type: 'blue', count: 2 + Math.floor((i-15)/2), speed: 2.1, radius: 22 },
                    { type: 'darkred', count: 2 + Math.floor((i-15)/3), speed: 2.1, radius: 22 },
                    { type: 'black', count: 2, speed: 2.1, radius: 20 }
                ]
            });
        }

        // 20
        levels.push({
            name: `Chaos Core 20`,
            enemyTypes: [
                { type: 'basic', count: 8, speed: 2.2, radius: 14 },
                { type: 'basic', count: 6, speed: 1.0, radius: 30 },
                { type: 'red', count: 4, speed: 2.1, radius: 24 },
                { type: 'blue', count: 3, speed: 2.1, radius: 24 },
                { type: 'darkred', count: 3, speed: 2.1, radius: 24 },
                { type: 'black', count: 4, speed: 2.1, radius: 22 }
            ]
        });

        // 21-24
        for (let i = 21; i <= 24; i++) {
            levels.push({
                name: `Chaos Core ${i}`,
                enemyTypes: [
                    { type: 'basic', count: 4 + Math.floor(i/3), speed: 2.1, radius: 20 },
                    { type: 'red', count: 3, speed: 2.1, radius: 22 },
                    { type: 'blue', count: 2 + Math.floor((i-21)/2), speed: 2.1, radius: 22 },
                    { type: 'darkred', count: 2 + Math.floor((i-21)/3), speed: 2.1, radius: 22 },
                    { type: 'yellow', count: 2 + Math.floor((i-21)/2), speed: 2.1, radius: 22 },
                    { type: 'black', count: 2, speed: 2.1, radius: 22 }
                ]
            });
        }

        // 25-29
        for (let i = 25; i <= 29; i++) {
            const speedMult = 1 + (i - 25) * 0.03;
            levels.push({
                name: `Chaos Core ${i}`,
                enemyTypes: [
                    { type: 'basic', count: 3 + Math.floor(i/4), speed: (2.1 + (i-25)*0.05) * speedMult, radius: 18 + (i-25)*0.4 },
                    { type: 'red', count: 3 + Math.floor((i-25)/2), speed: 2.1 * speedMult, radius: 24 },
                    { type: 'blue', count: 3 + Math.floor((i-25)/2), speed: 2.1 * speedMult, radius: 24 },
                    { type: 'darkred', count: 2 + Math.floor((i-25)/3), speed: 2.1 * speedMult, radius: 24 },
                    { type: 'yellow', count: 2 + Math.floor((i-25)/3), speed: 2.1 * speedMult, radius: 22 },
                    { type: 'black', count: 2 + Math.floor((i-25)/4), speed: 2.1 * speedMult, radius: 22 + (i-25)*0.2 }
                ]
            });
        }

        // 30
        levels.push({
            name: `Chaos Core 30`,
            enemyTypes: [
                { type: 'basic', count: 10, speed: 2.2, radius: 14 },
                { type: 'basic', count: 8, speed: 1.0, radius: 32 },
                { type: 'red', count: 5, speed: 2.1, radius: 24 },
                { type: 'blue', count: 4, speed: 2.1, radius: 24 },
                { type: 'darkred', count: 4, speed: 2.1, radius: 24 },
                { type: 'yellow', count: 3, speed: 2.1, radius: 22 },
                { type: 'black', count: 5, speed: 2.1, radius: 24 }
            ]
        });

        // 31-39 (увеличенные размеры)
        const newWidth = 2600 * 1.3;
        const newHeight = 700 * 1.3;
        for (let i = 31; i <= 39; i++) {
            const blackCount = 3 + Math.floor((i-30)/2);
            levels.push({
                name: `Chaos Core ${i}`,
                mapWidth: newWidth,
                mapHeight: newHeight,
                enemyTypes: [
                    { type: 'basic', count: 3 + Math.floor(i/4), speed: 1.875 + (i-30)*0.04, radius: 18 + (i-30)*0.5 },
                    { type: 'red', count: 3 + Math.floor((i-30)/3), speed: 2.1, radius: 24 },
                    { type: 'blue', count: 3 + Math.floor((i-30)/3), speed: 2.1, radius: 24 },
                    { type: 'darkred', count: 2 + Math.floor((i-30)/4), speed: 2.1, radius: 24 },
                    { type: 'yellow', count: 2 + Math.floor((i-30)/4), speed: 2.1, radius: 22 },
                    { type: 'black', count: Math.min(blackCount, 5), speed: 2.1 + (i-30)*0.02, radius: 22 + (i-30)*0.3 }
                ]
            });
        }

        // 40 – BOSS (увеличен)
        levels.push({
            name: 'Chaos Core 40: BOSS ARENA',
            mapWidth: newWidth,
            mapHeight: newHeight,
            enemyTypes: [
                { type: 'basic', count: 12, speed: 2.5, radius: 18 },
                { type: 'red', count: 6, speed: 2.0, radius: 26 },
                { type: 'blue', count: 5, speed: 2.0, radius: 26 },
                { type: 'darkred', count: 5, speed: 2.0, radius: 26 },
                { type: 'yellow', count: 4, speed: 2.0, radius: 24 },
                { type: 'black', count: 6, speed: 2.0, radius: 26 }
            ]
        });

        // 41 – VICTORY
        levels.push({
            name: 'Chaos Core 41: VICTORY!',
            enemyTypes: [],
            isVictory: true,
            victoryColor: '#ffdd44',
            pelletCount: 0,
            portalSide: 'right'
        });

        return levels;
    }
}