const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game settings ---
const SIRKA_OBRAZOVKY = canvas.width;
const VYSKA_OBRAZOVKY = canvas.height;
let tutorialZobrazeny = true;

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

// Cieľ
const CIEL_SIRKA = 100;
const CIEL_VYSKA = 140;
let cielX = SIRKA_OBRAZOVKY - CIEL_SIRKA - 30;
let cielY = 30;

// Obrázky
const hracObrazok = new Image();
hracObrazok.src = 'player1.png';
const cielObrazok = new Image();
cielObrazok.src = 'player2.png';
const pozadieObrazok = new Image();
pozadieObrazok.src = 'background.png';

// Platformy
let platformy = [
    { x: 0, y: VYSKA_OBRAZOVKY - 40, sirka: SIRKA_OBRAZOVKY, vyska: 40 },
    { x: 200, y: VYSKA_OBRAZOVKY - 150, sirka: 150, vyska: 20 },
    { x: 400, y: VYSKA_OBRAZOVKY - 280, sirka: 120, vyska: 20 },
    { x: 550, y: VYSKA_OBRAZOVKY - 400, sirka: 100, vyska: 20 }
];

let levelDokonceny = false;
let stlaceneKlavesy = {};
let aktualnyLevel = 0;
const maxLevel = 5;

// --- Dotykové ovládanie ---
let dotykStartX = 0;
let dotykStartY = 0;
let poslednyDotykX = 0;
let aktivnyDotyk = false;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (tutorialZobrazeny) {
        tutorialZobrazeny = false;
        return;
    }
    const dotyk = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    dotykStartX = dotyk.clientX - rect.left;
    dotykStartY = dotyk.clientY - rect.top;
    poslednyDotykX = dotykStartX;
    aktivnyDotyk = true;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!aktivnyDotyk || tutorialZobrazeny) return;
    const dotyk = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const dotykX = dotyk.clientX - rect.left;
    const deltaX = dotykX - poslednyDotykX;
    rychlostX = deltaX * 0.2;
    poslednyDotykX = dotykX;
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (tutorialZobrazeny) return;
    if (naZemi) {
        rychlostY = -SKOK_VYKON;
        naZemi = false;
    }
    rychlostX = 0;
    aktivnyDotyk = false;
});

// --- Klávesnica ---
document.addEventListener('keydown', (e) => {
    if (tutorialZobrazeny) {
        tutorialZobrazeny = false;
        return;
    }
    stlaceneKlavesy[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
    stlaceneKlavesy[e.key.toLowerCase()] = false;
});

// --- Herná logika ---
function spracujOvladanie() {
    if (levelDokonceny) return;
    rychlostX = 0;
    if (stlaceneKlavesy['arrowleft']) rychlostX = -HRAC_RYCHLOST_POHYBU;
    if (stlaceneKlavesy['arrowright']) rychlostX = HRAC_RYCHLOST_POHYBU;
    if (stlaceneKlavesy[' '] && naZemi) {
        rychlostY = -SKOK_VYKON;
        naZemi = false;
    }
}

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

    if (
        hracX < cielX + CIEL_SIRKA &&
        hracX + HRAC_SIRKA > cielX &&
        hracY < cielY + CIEL_VYSKA &&
        hracY + HRAC_VYSKA > cielY
    ) {
        if (!levelDokonceny) {
            levelDokonceny = true;
            zobrazVyhruASpustiDalsiLevel();
        }
    }
}

function nahodneCislo(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function vygenerujNahodnyLevel() {
    hracX = nahodneCislo(50, SIRKA_OBRAZOVKY - 100);
    hracY = nahodneCislo(50, VYSKA_OBRAZOVKY - 200);

    platformy = [];
    const pocetPlatforiem = nahodneCislo(3, 6);
    for (let i = 0; i < pocetPlatforiem; i++) {
        platformy.push({
            x: nahodneCislo(0, SIRKA_OBRAZOVKY - 150),
            y: nahodneCislo(100, VYSKA_OBRAZOVKY - 50),
            sirka: nahodneCislo(100, 200),
            vyska: 20
        });
    }

    cielX = nahodneCislo(100, SIRKA_OBRAZOVKY - 150);
    cielY = nahodneCislo(30, 150);

    rychlostX = 0;
    rychlostY = 0;
    naZemi = false;
    levelDokonceny = false;
}

function zobrazVyhruASpustiDalsiLevel() {
    setTimeout(() => {
        aktualnyLevel++;
        if (aktualnyLevel < maxLevel) {
            vygenerujNahodnyLevel();
        }
    }, 1000);
}

// --- Vykresľovanie ---
function nakresliTutorial() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(50, 100, SIRKA_OBRAZOVKY - 100, 300);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('OVLÁDANIE', SIRKA_OBRAZOVKY / 2, 160);
    ctx.font = '20px Arial';
    ctx.fillText('PC: ← → = pohyb', SIRKA_OBRAZOVKY / 2, 200);
    ctx.fillText('SPACE = skok', SIRKA_OBRAZOVKY / 2, 230);
    ctx.fillText('MOBILE: Posunutie prsta vľavo/vpravo = pohyb', SIRKA_OBRAZOVKY / 2, 270);
    ctx.fillText('Jednoduché ťuknutie = skok', SIRKA_OBRAZOVKY / 2, 300);
    ctx.fillText('Začni hru ľubovoľným dotykom/klávesou', SIRKA_OBRAZOVKY / 2, 360);
}

function gameLoop() {
    spracujOvladanie();
    if (!levelDokonceny) detekujKolizie();

    ctx.clearRect(0, 0, SIRKA_OBRAZOVKY, VYSKA_OBRAZOVKY);
    ctx.drawImage(pozadieObrazok, 0, 0, SIRKA_OBRAZOVKY, VYSKA_OBRAZOVKY);

    ctx.fillStyle = 'blue';
    platformy.forEach(p => {
        ctx.fillRect(p.x, p.y, p.sirka, p.vyska);
    });

    ctx.drawImage(cielObrazok, cielX, cielY, CIEL_SIRKA, CIEL_VYSKA);
    ctx.drawImage(hracObrazok, hracX, hracY, HRAC_SIRKA, HRAC_VYSKA);

    if (tutorialZobrazeny) nakresliTutorial();

    if (levelDokonceny) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(SIRKA_OBRAZOVKY / 2 - 200, VYSKA_OBRAZOVKY / 2 - 80, 400, 120);

        ctx.fillStyle = 'yellow';
        ctx.font = '64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('YOU WIN!', SIRKA_OBRAZOVKY / 2, VYSKA_OBRAZOVKY / 2);
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();
