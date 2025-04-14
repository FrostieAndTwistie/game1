const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const SIRKA_OBRAZOVKY = canvas.width;
const VYSKA_OBRAZOVKY = canvas.height;
let tutorialZobrazeny = true;

// Hráč
const HRAC_SIRKA = 80;
const HRAC_VYSKA = 120;
let hracX = 50;
let hracY = VYSKA_OBRAZOVKY - 160;
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
let platformy = [];
let zakladnaPlatforma = { x: 0, y: VYSKA_OBRAZOVKY - 40, sirka: SIRKA_OBRAZOVKY, vyska: 40 };

let levelDokonceny = false;
let stlaceneKlavesy = {};
let aktualnyLevel = 0;
const maxLevel = 5;

let skore = 0;

// Dotykové ovládanie
let dotykStartX = 0;
let dotykStartTime = 0;
let dotykPosun = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (tutorialZobrazeny) {
        tutorialZobrazeny = false;
        return;
    }
    const dotyk = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    dotykStartX = dotyk.clientX - rect.left;
    dotykStartTime = new Date().getTime();
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (tutorialZobrazeny) return;

    const dotykEndTime = new Date().getTime();
    const cas = dotykEndTime - dotykStartTime;

    if (e.changedTouches.length > 0) {
        const dotyk = e.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        const dotykEndX = dotyk.clientX - rect.left;
        const rozdielX = dotykEndX - dotykStartX;

        if (Math.abs(rozdielX) > 30) {
            // posun doprava alebo dolava
            if (rozdielX > 0) {
                rychlostX = HRAC_RYCHLOST_POHYBU;
            } else {
                rychlostX = -HRAC_RYCHLOST_POHYBU;
            }
        } else if (cas < 300 && naZemi) {
            // krátky tap = skok
            rychlostY = -SKOK_VYKON;
            naZemi = false;
            skore += 1;
        }
    }
});

// Klávesnica
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

// Herná logika
function spracujOvladanie() {
    if (levelDokonceny) return;

    if (stlaceneKlavesy['arrowleft']) {
        rychlostX = -HRAC_RYCHLOST_POHYBU;
    } else if (stlaceneKlavesy['arrowright']) {
        rychlostX = HRAC_RYCHLOST_POHYBU;
    } else {
        rychlostX = 0;
    }

    if (stlaceneKlavesy[' '] && naZemi) {
        rychlostY = -SKOK_VYKON;
        naZemi = false;
        skore += 1;
    }
}

function detekujKolizie() {
    naZemi = false;
    hracX += rychlostX;
    rychlostY += GRAVITACIA;
    hracY += rychlostY;

    [...platformy, zakladnaPlatforma].forEach(p => {
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
            skore += 10;
            zobrazVyhruASpustiDalsiLevel();
        }
    }
}

function nahodneCislo(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function vygenerujNahodnyLevel() {
    platformy = [];

    const vyskaKrokov = 5;
    const krokVyska = (VYSKA_OBRAZOVKY - 200) / vyskaKrokov;

    for (let i = 0; i < vyskaKrokov; i++) {
        let y = VYSKA_OBRAZOVKY - 100 - i * krokVyska;
        let x = nahodneCislo(50, SIRKA_OBRAZOVKY - 200);
        platformy.push({ x, y, sirka: 150, vyska: 20 });
    }

    cielX = platformy[0].x + 20;
    cielY = platformy[0].y - CIEL_VYSKA;

    hracX = platformy[platformy.length - 1].x + 20;
    hracY = platformy[platformy.length - 1].y - HRAC_VYSKA;

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

// Vykresľovanie
function nakresliTutorial() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(50, 100, SIRKA_OBRAZOVKY - 100, 300);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CONTROLS', SIRKA_OBRAZOVKY / 2, 160);
    ctx.font = '20px Arial';
    ctx.fillText('PC: ← → = move', SIRKA_OBRAZOVKY / 2, 200);
    ctx.fillText('SPACE = jump', SIRKA_OBRAZOVKY / 2, 230);
    ctx.fillText('MOBILE: Swipe left/right = move', SIRKA_OBRAZOVKY / 2, 270);
    ctx.fillText('Tap = jump', SIRKA_OBRAZOVKY / 2, 300);
    ctx.fillText('Tap or press any key to start', SIRKA_OBRAZOVKY / 2, 360);
}

function gameLoop() {
    spracujOvladanie();
    if (!levelDokonceny) detekujKolizie();

    ctx.clearRect(0, 0, SIRKA_OBRAZOVKY, VYSKA_OBRAZOVKY);
    ctx.drawImage(pozadieObrazok, 0, 0, SIRKA_OBRAZOVKY, VYSKA_OBRAZOVKY);

    ctx.fillStyle = 'rgb(0,32,64)';
    [...platformy, zakladnaPlatforma].forEach(p => {
        ctx.fillRect(p.x, p.y, p.sirka, p.vyska);
    });

    ctx.drawImage(cielObrazok, cielX, cielY, CIEL_SIRKA, CIEL_VYSKA);
    ctx.drawImage(hracObrazok, hracX, hracY, HRAC_SIRKA, HRAC_VYSKA);

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${skore}`, 20, 30);

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

vygenerujNahodnyLevel();
gameLoop();
