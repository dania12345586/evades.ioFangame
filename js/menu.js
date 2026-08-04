// js/menu.js

const heroes = [
    {
        id: 'scutum',
        name: 'Scutum',
        color: '#4ecdc4',
        class: Scutum,
    },
    {
        id: 'sylvanus',
        name: 'Sylvanus',
        color: '#2E7D32',
        class: Sylvanus,
    },
    {
        id: 'crepitus',
        name: 'Crepitus',
        color: '#cc7700', // тёмно-оранжевый
        class: Crepitus,
    },
    {
        id: 'vortex',
        name: 'Vortex',
        color: '#22193A',
        class: Vortex,
    }
];

function showHeroMenu() {
    const menuContainer = document.getElementById('heroMenu');
    if (!menuContainer) return;
    menuContainer.style.display = 'flex';
    document.getElementById('gameCanvas').style.display = 'none';
    
    const heroList = document.getElementById('heroList');
    if (!heroList) return;
    heroList.innerHTML = '';
    
    heroes.forEach(hero => {
        const card = document.createElement('div');
        card.className = 'hero-card';
        const darkColor = darkenColor(hero.color, 60);
        card.style.background = `radial-gradient(circle at 50% 80%, ${hero.color}33, ${darkColor})`;
        
        const nameSpan = document.createElement('div');
        nameSpan.className = 'hero-name';
        nameSpan.textContent = hero.name;
        nameSpan.style.color = hero.color;
        
        const ball = document.createElement('div');
        ball.className = 'hero-ball';
        ball.style.backgroundColor = hero.color;
        
        card.appendChild(nameSpan);
        card.appendChild(ball);
        
        card.addEventListener('click', () => {
            selectHero(hero);
        });
        
        heroList.appendChild(card);
    });
}

function darkenColor(hex, percent) {
    let color = hex.replace('#', '');
    let r = parseInt(color.substring(0,2), 16);
    let g = parseInt(color.substring(2,4), 16);
    let b = parseInt(color.substring(4,6), 16);
    r = Math.max(0, r - percent);
    g = Math.max(0, g - percent);
    b = Math.max(0, b - percent);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function selectHero(hero) {
    document.getElementById('heroMenu').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';
    startGameWithHero(hero.class);
}

window.showHeroMenu = showHeroMenu;
window.selectHero = selectHero;