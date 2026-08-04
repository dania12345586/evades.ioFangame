// js/maps/PrimalPeaksMap.js

class PrimalPeaksMap {
    constructor() {
        this.name = 'Primal Peaks';
        this.mapWidth = 2600;
        this.mapHeight = 700;
        this.safeZoneWidth = 300;
        this.minPellets = 20;
        this.maxPellets = 40;
        this.pelletValue = 2;
        this.backgroundColor = '#1a2a1a';
        this.levels = this.generateLevels();
    }

    generateLevels() {
        const levels = [];

        // 1-7
        for (let i = 1; i <= 7; i++) {
            const basicCount = 3 + Math.floor(i/2);
            const redCount = (i >= 5) ? 1 : 0;
            const treeCount = (i >= 3) ? 1 : 0;
            levels.push({
                name: `Primal Peaks ${i}`,
                enemyTypes: [
                    { type: 'basic', count: basicCount, speed: 2.1 + i*0.05, radius: 18 + i*0.5 },
                    ...(redCount > 0 ? [{ type: 'red', count: redCount, speed: 2.0, radius: 24 }] : []),
                    ...(treeCount > 0 ? [{ type: 'tree', count: treeCount, speed: 0, radius: 60 }] : [])
                ]
            });
        }

        // 8-11
        for (let i = 8; i <= 11; i++) {
            const venomCount = 2 + Math.floor((i-8)/2);
            const treeCount = (i % 2 === 0) ? 2 : 1;
            levels.push({
                name: `Primal Peaks ${i}`,
                enemyTypes: [
                    { type: 'basic', count: 4 + Math.floor(i/3), speed: 2.1, radius: 18 },
                    { type: 'red', count: 1, speed: 2.0, radius: 24 },
                    { type: 'venom', count: venomCount, speed: 2.0, radius: 36 },
                    { type: 'tree', count: treeCount, speed: 0, radius: 60 }
                ]
            });
        }

        // 12-14
        for (let i = 12; i <= 14; i++) {
            const treeCount = 2;
            levels.push({
                name: `Primal Peaks ${i}`,
                enemyTypes: [
                    { type: 'basic', count: 4 + Math.floor(i/4), speed: 2.1, radius: 18 },
                    { type: 'red', count: 1, speed: 2.0, radius: 24 },
                    { type: 'venom', count: 2, speed: 2.0, radius: 36 },
                    { type: 'toxic', count: 1 + Math.floor((i-12)/2), speed: 3.3, radius: 68 },
                    { type: 'tree', count: treeCount, speed: 0, radius: 60 }
                ]
            });
        }

        // 15-19
        for (let i = 15; i <= 19; i++) {
            const slashCount = (i >= 18) ? 1 : 0;
            const blackCount = (i >= 16) ? 1 : 0;
            const treeCount = 2 + Math.floor((i-15)/2);
            levels.push({
                name: `Primal Peaks ${i}`,
                enemyTypes: [
                    { type: 'basic', count: 3 + Math.floor(i/5), speed: 2.1, radius: 18 },
                    { type: 'red', count: 1, speed: 2.0, radius: 24 },
                    { type: 'venom', count: 2, speed: 2.0, radius: 36 },
                    { type: 'toxic', count: 2 + Math.floor((i-15)/2), speed: 3.3, radius: 68 },
                    ...(blackCount > 0 ? [{ type: 'black', count: blackCount, speed: 2.1, radius: 24 }] : []),
                    ...(slashCount > 0 ? [{ type: 'slash', count: slashCount, speed: 2.2, radius: 32 }] : []),
                    { type: 'tree', count: treeCount, speed: 0, radius: 60 }
                ]
            });
        }

        // 20-24
        for (let i = 20; i <= 24; i++) {
            const blackCount = 1 + Math.floor((i-20)/3);
            const treeCount = 2 + Math.floor((i-20)/2);
            levels.push({
                name: `Primal Peaks ${i}`,
                enemyTypes: [
                    { type: 'basic', count: 3 + Math.floor(i/6), speed: 2.1, radius: 18 },
                    { type: 'red', count: 2, speed: 2.0, radius: 24 },
                    { type: 'venom', count: 2, speed: 2.0, radius: 36 },
                    { type: 'toxic', count: 2 + Math.floor((i-20)/3), speed: 3.3, radius: 68 },
                    { type: 'slash', count: 1 + Math.floor((i-20)/2), speed: 2.2, radius: 32 },
                    { type: 'black', count: blackCount, speed: 2.1, radius: 24 },
                    { type: 'tree', count: treeCount, speed: 0, radius: 60 }
                ]
            });
        }

        // 25-29
        for (let i = 25; i <= 29; i++) {
            const countBonus = Math.floor((i-25)/3);
            const blackCount = 1 + Math.floor((i-25)/3);
            const treeCount = 2 + Math.floor((i-25)/3);
            levels.push({
                name: `Primal Peaks ${i}`,
                enemyTypes: [
                    { type: 'basic', count: 3 + countBonus, speed: 2.1 + i*0.02, radius: 18 },
                    { type: 'red', count: 2 + countBonus, speed: 2.0, radius: 24 },
                    { type: 'venom', count: 2 + countBonus, speed: 2.0, radius: 36 },
                    { type: 'toxic', count: 2 + countBonus, speed: 3.3, radius: 68 },
                    { type: 'slash', count: 2 + countBonus, speed: 2.2, radius: 32 },
                    { type: 'black', count: blackCount, speed: 2.1, radius: 24 },
                    { type: 'tree', count: treeCount, speed: 0, radius: 60 }
                ]
            });
        }

        // 30-34
        for (let i = 30; i <= 34; i++) {
            const countBonus = Math.floor((i-30)/2);
            const blackCount = 2 + Math.floor((i-30)/3);
            const treeCount = 3 + Math.floor((i-30)/3);
            levels.push({
                name: `Primal Peaks ${i}`,
                enemyTypes: [
                    { type: 'basic', count: 4 + countBonus, speed: 2.1 + i*0.02, radius: 18 },
                    { type: 'red', count: 3 + countBonus, speed: 2.0, radius: 24 },
                    { type: 'venom', count: 3 + countBonus, speed: 2.0, radius: 36 },
                    { type: 'toxic', count: 3 + countBonus, speed: 3.3, radius: 68 },
                    { type: 'slash', count: 2 + countBonus, speed: 2.2, radius: 32 },
                    { type: 'black', count: blackCount, speed: 2.1, radius: 24 },
                    { type: 'tree', count: treeCount, speed: 0, radius: 60 }
                ]
            });
        }

        // 35-39 (увеличенные размеры)
        const newWidth = 2600 * 1.3;
        const newHeight = 700 * 1.3;
        for (let i = 35; i <= 39; i++) {
            const blackCount = 2 + Math.floor((i-35)/2);
            const treeCount = 3 + Math.floor((i-35)/2);
            const venomCount = 4 + Math.floor((i-35)/2);
            const basicCount = 5 + Math.floor((i-35)/2) + Math.floor(i/7);
            const slashCount = 3 + Math.floor((i-35)/2) + Math.floor((i-35)/3);
            levels.push({
                name: `Primal Peaks ${i}`,
                mapWidth: newWidth,
                mapHeight: newHeight,
                enemyTypes: [
                    { type: 'basic', count: basicCount, speed: 2.1 + i*0.02, radius: 18 },
                    { type: 'red', count: 3 + Math.floor((i-35)/2), speed: 2.0, radius: 24 },
                    { type: 'venom', count: venomCount, speed: 2.0, radius: 36 },
                    { type: 'toxic', count: 3 + Math.floor((i-35)/2), speed: 3.3, radius: 68 },
                    { type: 'slash', count: slashCount, speed: 2.2, radius: 32 },
                    { type: 'black', count: blackCount, speed: 2.1, radius: 24 },
                    { type: 'tree', count: treeCount, speed: 0, radius: 60 }
                ]
            });
        }

        // 40 – BOSS (увеличен)
        levels.push({
            name: 'Primal Peaks 40: BOSS ARENA',
            mapWidth: newWidth,
            mapHeight: newHeight,
            enemyTypes: [
                { type: 'basic', count: 10, speed: 2.5, radius: 18 },
                { type: 'red', count: 6, speed: 2.3, radius: 24 },
                { type: 'venom', count: 8, speed: 2.3, radius: 36 },
                { type: 'toxic', count: 4, speed: 3.3, radius: 68 },
                { type: 'slash', count: 6, speed: 2.4, radius: 32 },
                { type: 'black', count: 4, speed: 2.3, radius: 24 },
                { type: 'tree', count: 4, speed: 0, radius: 60 }
            ]
        });

        // 41 – VICTORY
        levels.push({
            name: 'Primal Peaks 41: VICTORY!',
            enemyTypes: [],
            isVictory: true,
            victoryColor: '#ffdd44',
            pelletCount: 0,
            portalSide: 'right'
        });

        return levels;
    }
}