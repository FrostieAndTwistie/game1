const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game settings ---
const SIRKA_OBRAZOVKY = canvas.width;
const VYSKA_OBRAZOVKY = canvas.height;

// Hráč
const HRAC_SIRKA = 80;
const HRAC_VYSKA = 120;
let hracX = 50;
let hracY = VYSKA_OBRAZOVKY - 40 - HRAC_VYSKA;
let rychlostX = 0;
let rychlostY = 0;
const HRAC_RYCHLOST_POHYBU = 5;
const SKOK_VYKON = 15;
const GRAVITACIA = 0.8;
let naZemi = true;
let tesiSaHrac = false;

// Cieľ
const CIEL_SIRKA = 100;
const CIEL_VYSKA = 140;
const cielX = SIRKA_OBRAZOVKY - CIEL_SIRKA - 30;
const cielY = 30;

let tesiSaCiel = false;

// Načítanie obrázkov
const hracObrazok = new Image();
hracObrazok.src = 'player1.png';

const cielObrazok = new Image();
cielObrazok.src = 'player2.png';

const pozadieObrazok = new Image();
pozadieObrazok.src = 'background.png';

// Platformy
const platformy = [
    { x: 0, y: VYSKA_OBRAZOVKY - 40, sirka: SIRKA_OBRAZOVKY, vyska: 40 },
    { x: 200, y: VYSKA_OBRAZOVKY - 150, sirka: 150, vyska: 20 },
    { x: 400, y: VYSKA_OBRAZOVKY - 280, sirka: 120, vyska: 20 },
    { x: 550, y: VYSKA_OBRAZOVKY - 400, sirka: 100, vyska: 20 }
];

let levelDokonceny = false;
let stlaceneKlavesy = {};

// --- Dotykové ovládanie ---
let dotykStartX = 0;
let dotykStartY = 0;
let poslednyDotykX = 0;
let aktivnyDotyk = false;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const dotyk = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    
    dotykStartX = dotyk.clientX - rect.left;
    dotykStartY = dotyk.clientY - rect.top;
    poslednyDotykX = dotykStartX;
    aktivnyDotyk = true;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!aktivnyDotyk) return;

    const dotyk = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const dotykX = dotyk.clientX - rect.left;
    
    const deltaX = dotykX - poslednyDotykX;
    rychlostX = deltaX * 0.2;
    
    poslednyDotykX = dotykX;
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const dotyk = e.changedTouches[0];
    const rect = canvas.getBoundingClientRect();
    const dotykY = dotyk.clientY - rect.top;

    if (dotykY < VYSKA_OBRAZOVKY * 0.5 && naZemi) {
        rychlostY = -SKOK_VYKON;
        naZemi = false;
    }
    
    rychlostX = 0;
    aktivnyDotyk = false;
});

// --- Klávesnicové ovládanie ---
document.addEventListener('keydown', (e) => {
    stlaceneKlavesy[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
    stlaceneKlavesy[e.key.toLowerCase()] = false;
});

function spracujOvladanie() {
    if (levelDokonceny) {
        rychlostX = 0;
        return;
    }

    rychlostX = 0;
    if (stlaceneKlavesy['a'] || stlaceneKlavesy['arrowleft']) {
        rychlostX = -HRAC_RYCHLOST_POHYBU;
    }
    if (stlaceneKlavesy['d'] || stlaceneKlavesy['arrowright']) {
        rychlostX = HRAC_RYCHLOST_POHYBU;
    }
    if ((stlaceneKlavesy['w'] || stlaceneKlavesy['arrowup'] || stlaceneKlavesy[' ']) && naZemi) {
       rychlostY = -SKOK_VYKON;
       naZemi = false;
    }
}

// --- Kolízie ---
function detekujKolizie() {
    naZemi = false;

    hracX += rychlostX;
    rychlostY += GRAVITACIA;
    hracY += rychlostY;

    platformy.forEach(p => {
        if (hracX < p.x + p.sirka &&
            hracX + HRAC_SIRKA > p.x &&
            hracY + HRAC_VYSKA >= p.y &&
            hracY + HRAC_VYSKA - rychlostY <= p.y) {

            hracY = p.y - HRAC_VYSKA;
            rychlostY = 0;
            naZemi = true;
        }
    });

    if (hracX < cielX + CIEL_SIRKA &&
        hracX + HRAC_SIRKA > cielX &&
        hracY < cielY + CIEL_VYSKA &&
        hracY + HRAC_VYSKA > cielY) {
        levelDokonceny = true;
        tesiSaHrac = true;
        tesiSaCiel = true;
    }
}

// --- Vykresľovanie ---
function nakresliPozadie() {
    ctx.drawImage(pozadieObrazok, 0, 0, SIRKA_OBRAZOVKY, VYSKA_OBRAZOVKY);
}

function nakresliHraca() {
    ctx.drawImage(hracObrazok, hracX, hracY, HRAC_SIRKA, HRAC_VYSKA);
}

function nakresliCiel() {
    ctx.drawImage(cielObrazok, cielX, cielY, CIEL_SIRKA, CIEL_VYSKA);
}

function nakresliPlatformy() {
    ctx.fillStyle = 'blue';
    platformy.forEach(p => {
        ctx.fillRect(p.x, p.y, p.sirka, p.vyska);
    });
}

// --- Herná slučka ---
function gameLoop() {
    spracujOvladanie();
    
    if (!levelDokonceny) {
       detekujKolizie();
    }

    ctx.clearRect(0, 0, SIRKA_OBRAZOVKY, VYSKA_OBRAZOVKY);
    nakresliPozadie();
    nakresliPlatformy();
    nakresliCiel();
    nakresliHraca();

    if (levelDokonceny) {
        ctx.fillStyle = 'yellow';
        ctx.font = '74px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('YOU WIN!', SIRKA_OBRAZOVKY / 2, VYSKA_OBRAZOVKY / 2);
    }

    requestAnimationFrame(gameLoop);
}

// Spustenie hry
gameLoop();
