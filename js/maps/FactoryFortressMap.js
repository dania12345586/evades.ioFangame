// js/maps/FactoryFortressMap.js

class FactoryFortressMap {
    constructor() {
        this.name = 'Factory Fortress';
        this.mapWidth = 2600;
        this.mapHeight = 700;
        this.safeZoneWidth = 300;
        this.minPellets = 20;
        this.maxPellets = 40;
        this.pelletValue = 2;
        this.backgroundColor = '#2a2a2a';
        this.levels = this.generateLevels();
    }

    generateLevels() {
        const levels = [];

        // Уровни 1-10
        for (let i = 1; i <= 10; i++) {
            const basicCount = 4 + Math.floor(i * 0.6);
            const yellowCount = (i >= 5) ? 1 + Math.floor((i-5)/3) : 0;
            const types = [
                { type: 'basic', count: basicCount, speed: 2.1 + i*0.03, radius: 18 + i*0.3 }
            ];
            if (yellowCount > 0) {
                types.push({ type: 'yellow', count: yellowCount, speed: 2.0, radius: 22 });
            }
            levels.push({
                name: `Factory Fortress ${i}`,
                enemyTypes: types
            });
        }

        // Уровни 11-14
        for (let i = 11; i <= 14; i++) {
            let turretCount = 1 + Math.floor((i-11)/2);
            turretCount = Math.ceil(turretCount / 2);
            const basicCount = 4 + Math.floor(i*0.5);
            const yellowCount = 1 + Math.floor((i-10)/3);
            const types = [
                { type: 'basic', count: basicCount, speed: 2.2, radius: 18 },
                { type: 'yellow', count: yellowCount, speed: 2.0, radius: 22 },
                { type: 'turret', count: Math.max(1, turretCount), speed: 0, radius: 30 }
            ];
            levels.push({
                name: `Factory Fortress ${i}`,
                enemyTypes: types
            });
        }

        // Уровни 15-20
        for (let i = 15; i <= 20; i++) {
            const bomberCount = 1 + Math.floor((i-15)/2);
            let turretCount = 1 + Math.floor((i-14)/2);
            turretCount = Math.ceil(turretCount / 2);
            const basicCount = 3 + Math.floor(i*0.4);
            const yellowCount = 2 + Math.floor((i-14)/3);
            const types = [
                { type: 'basic', count: basicCount, speed: 2.2, radius: 18 },
                { type: 'yellow', count: yellowCount, speed: 2.0, radius: 22 },
                { type: 'turret', count: Math.max(1, turretCount), speed: 0, radius: 30 },
                { type: 'bomber', count: bomberCount, speed: 3.0 + (i-15)*0.1, radius: 20 }
            ];
            levels.push({
                name: `Factory Fortress ${i}`,
                enemyTypes: types
            });
        }

        // Уровни 21-24
        for (let i = 21; i <= 24; i++) {
            const orangeCount = 1 + Math.floor((i-21)/2);
            const bomberCount = 2 + Math.floor((i-20)/2);
            let turretCount = 2 + Math.floor((i-20)/3);
            turretCount = Math.ceil(turretCount / 2);
            const basicCount = 4 + Math.floor(i*0.3);
            const yellowCount = 2 + Math.floor((i-20)/3);
            const types = [
                { type: 'basic', count: basicCount, speed: 2.2, radius: 18 },
                { type: 'yellow', count: yellowCount, speed: 2.0, radius: 22 },
                { type: 'turret', count: Math.max(1, turretCount), speed: 0, radius: 30 },
                { type: 'bomber', count: bomberCount, speed: 3.2, radius: 20 },
                { type: 'orangeaura', count: orangeCount, speed: 1.2, radius: 24 }
            ];
            levels.push({
                name: `Factory Fortress ${i}`,
                enemyTypes: types
            });
        }

        // Уровни 25-30
        for (let i = 25; i <= 30; i++) {
            const stealthCount = 1 + Math.floor((i-25)/2);
            const orangeCount = 2 + Math.floor((i-24)/2);
            const bomberCount = 2 + Math.floor((i-24)/2);
            let turretCount = 2 + Math.floor((i-24)/2);
            turretCount = Math.ceil(turretCount / 2);
            const basicCount = 4 + Math.floor(i*0.3);
            const yellowCount = 2 + Math.floor((i-24)/3);
            const types = [
                { type: 'basic', count: basicCount, speed: 2.2, radius: 18 },
                { type: 'yellow', count: yellowCount, speed: 2.0, radius: 22 },
                { type: 'turret', count: Math.max(1, turretCount), speed: 0, radius: 30 },
                { type: 'bomber', count: bomberCount, speed: 3.3, radius: 20 },
                { type: 'orangeaura', count: orangeCount, speed: 1.3, radius: 24 },
                { type: 'stealth', count: stealthCount, speed: 1.5, radius: 18 }
            ];
            levels.push({
                name: `Factory Fortress ${i}`,
                enemyTypes: types
            });
        }

        // Уровни 31-35
        for (let i = 31; i <= 35; i++) {
            const stealthCount = 2 + Math.floor((i-30)/2);
            const orangeCount = 3 + Math.floor((i-30)/2);
            const bomberCount = 3 + Math.floor((i-30)/2);
            let turretCount = 3 + Math.floor((i-30)/2);
            turretCount = Math.ceil(turretCount / 2);
            const basicCount = 6 + Math.floor(i*0.2);
            const yellowCount = 3 + Math.floor((i-30)/3);
            const types = [
                { type: 'basic', count: basicCount, speed: 2.3, radius: 18 },
                { type: 'yellow', count: yellowCount, speed: 2.1, radius: 22 },
                { type: 'turret', count: Math.max(1, turretCount), speed: 0, radius: 30 },
                { type: 'bomber', count: bomberCount, speed: 3.5, radius: 20 },
                { type: 'orangeaura', count: orangeCount, speed: 1.5, radius: 24 },
                { type: 'stealth', count: stealthCount, speed: 1.8, radius: 18 }
            ];
            levels.push({
                name: `Factory Fortress ${i}`,
                enemyTypes: types
            });
        }

        // Уровни 36-40 (увеличенные)
        const bigWidth = Math.floor(2600 * 1.5);
        const bigHeight = Math.floor(700 * 1.5);
        for (let i = 36; i <= 40; i++) {
            const stealthCount = 3 + Math.floor((i-35)/2);
            const orangeCount = 4 + Math.floor((i-35)/2);
            const bomberCount = 4 + Math.floor((i-35)/2);
            let turretCount = 4 + Math.floor((i-35)/2);
            turretCount = Math.ceil(turretCount / 2);
            const basicCount = 8 + Math.floor(i*0.2);
            const yellowCount = 4 + Math.floor((i-35)/3);
            const types = [
                { type: 'basic', count: basicCount, speed: 2.4, radius: 18 },
                { type: 'yellow', count: yellowCount, speed: 2.2, radius: 22 },
                { type: 'turret', count: Math.max(1, turretCount), speed: 0, radius: 32 },
                { type: 'bomber', count: bomberCount, speed: 3.7, radius: 22 },
                { type: 'orangeaura', count: orangeCount, speed: 1.6, radius: 26 },
                { type: 'stealth', count: stealthCount, speed: 2.0, radius: 20 }
            ];
            levels.push({
                name: `Factory Fortress ${i}`,
                mapWidth: bigWidth,
                mapHeight: bigHeight,
                enemyTypes: types
            });
        }

        // 41 – победа
        levels.push({
            name: 'Factory Fortress 41: VICTORY!',
            enemyTypes: [],
            isVictory: true,
            victoryColor: '#ff8800',
            portalSide: 'right'
        });

        return levels;
    }
}