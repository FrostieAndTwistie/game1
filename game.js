const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let tutorialZobrazeny = true;
let score = 0;

const HRAC_SIRKA = 80;
const HRAC_VYSKA = 120;
let hracX = 50;
let hracY = HEIGHT - 160;
let rychlostX = 0;
let rychlostY = 0;
const POHYB_RYCHLOST = 5;
const SKOK_SILA = 15;
const GRAVITACIA = 0.8;
let naZemi = true;

const CIEL_SIRKA = 100;
const CIEL_VYSKA = 140;
let cielX = WIDTH - CIEL_SIRKA - 30;
let cielY = 30;

const hracObr = new Image();
hracObr.src = 'player1.png';
const cielObr = new Image();
cielObr.src = 'player2.png';
const pozadieObr = new Image();
pozadieObr.src = 'background.png';

let platformy = [];
let zakladPlatforma = { x: 0, y: HEIGHT - 40, sirka: WIDTH, vyska: 40 };

let levelHotovy = false;
let aktualnyLevel = 0;
const maxLevel = 5;
let klavesy = {};

// Mobilné ovládanie
let tlacidloVlavo = { x: 20, y: HEIGHT - 80, w: 60, h: 60, stlacene: false };
let tlacidloVpravo = { x: 100, y: HEIGHT - 80, w: 60, h: 60, stlacene: false };
let tlacidloSkok = { x: WIDTH - 80, y: HEIGHT - 80, w: 60, h: 60, stlacene: false };

canvas.addEventListener('touchstart', e => {
    if (tutorialZobrazeny) {
        tutorialZobrazeny = false;
        return;
    }
    for (let t of e.touches) {
        let x = t.clientX - canvas.getBoundingClientRect().left;
        let y = t.clientY - canvas.getBoundingClientRect().top;
        if (bodVObdlzniku(x, y, tlacidloVlavo)) tlacidloVlavo.stlacene = true;
        if (bodVObdlzniku(x, y, tlacidloVpravo)) tlacidloVpravo.stlacene = true;
        if (bodVObdlzniku(x, y, tlacidloSkok)) {
            if (naZemi) {
                rychlostY = -SKOK_SILA;
                naZemi = false;
                score += 1;
            }
            tlacidloSkok.stlacene = true;
        }
    }
});

canvas.addEventListener('touchend', e => {
    tlacidloVlavo.stlacene = false;
    tlacidloVpravo.stlacene = false;
    tlacidloSkok.stlacene = false;
});

function bodVObdlzniku(x, y, rect) {
    return x > rect.x && x < rect.x + rect.w && y > rect.y && y < rect.y + rect.h;
}

// Klávesnica
document.addEventListener('keydown', e => {
    if (tutorialZobrazeny) {
        tutorialZobrazeny = false;
        return;
    }
    klavesy[e.key.toLowerCase()] = true;
});
document.addEventListener('keyup', e => {
    klavesy[e.key.toLowerCase()] = false;
});

function ovladanie() {
    if (levelHotovy) return;
    if (klavesy['arrowleft'] || tlacidloVlavo.stlacene) {
        rychlostX = -POHYB_RYCHLOST;
    } else if (klavesy['arrowright'] || tlacidloVpravo.stlacene) {
        rychlostX = POHYB_RYCHLOST;
    } else {
        rychlostX = 0;
    }
    if ((klavesy[' '] || klavesy['arrowup']) && naZemi) {
        rychlostY = -SKOK_SILA;
        naZemi = false;
        score += 1;
    }
}

function kolizie() {
    naZemi = false;
    hracX += rychlostX;
    rychlostY += GRAVITACIA;
    hracY += rychlostY;

    [...platformy, zakladPlatforma].forEach(p => {
        if (
            hracX < p.x + p.sirka &&
            hracX + HRAC_SIRKA > p.x &&
            hracY + HRAC_VYSKA >= p.y &&
            hracY + HRAC_VYSKA - rychlostY <= p.y
        ) {
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
        if (!levelHotovy) {
            levelHotovy = true;
            score += 10;
            setTimeout(() => {
                aktualnyLevel++;
                if (aktualnyLevel < maxLevel) {
                    generujLevel();
                }
            }, 1000);
        }
    }
}

function generujLevel() {
    platformy = [];
    let kroky = 5;
    let vyskaKrok = (HEIGHT - 200) / kroky;

    for (let i = 0; i < kroky; i++) {
        let y = HEIGHT - 100 - i * vyskaKrok;
        let x = Math.floor(Math.random() * (WIDTH - 150));
        platformy.push({ x: x, y: y, sirka: 150, vyska: 20 });
    }

    cielX = platformy[0].x + 20;
    cielY = platformy[0].y - CIEL_VYSKA;

    hracX = platformy[platformy.length - 1].x + 20;
    hracY = platformy[platformy.length - 1].y - HRAC_VYSKA;

    rychlostX = 0;
    rychlostY = 0;
    naZemi = false;
    levelHotovy = false;
}

function kresliTutorial() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(50, 100, WIDTH - 100, 300);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CONTROLS', WIDTH / 2, 160);
    ctx.font = '20px Arial';
    ctx.fillText('← → = move', WIDTH / 2, 200);
    ctx.fillText('SPACE = jump', WIDTH / 2, 230);
    ctx.fillText('Mobile: Tap buttons to move and jump', WIDTH / 2, 270);
    ctx.fillText('Tap or press any key to start', WIDTH / 2, 310);
}

function kresliTlacidla() {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;

    // Ľavé tlačidlo
    ctx.beginPath();
    ctx.roundRect(tlacidloVlavo.x, tlacidloVlavo.y, tlacidloVlavo.w, tlacidloVlavo.h, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⬅️', tlacidloVlavo.x + tlacidloVlavo.w / 2, tlacidloVlavo.y + tlacidloVlavo.h / 2);

    // Pravé tlačidlo
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.roundRect(tlacidloVpravo.x, tlacidloVpravo.y, tlacidloVpravo.w, tlacidloVpravo.h, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.fillText('➡️', tlacidloVpravo.x + tlacidloVpravo.w / 2, tlacidloVpravo.y + tlacidloVpravo.h / 2);

    // Skok
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.roundRect(tlacidloSkok.x, tlacidloSkok.y, tlacidloSkok.w, tlacidloSkok.h, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.fillText('⬆️', tlacidloSkok.x + tlacidloSkok.w / 2, tlacidloSkok.y + tlacidloSkok.h / 2);
}


function loop() {
    ovladanie();
    if (!levelHotovy) kolizie();

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(pozadieObr, 0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = 'rgb(0,32,64)';
    [...platformy, zakladPlatforma].forEach(p => {
        ctx.fillRect(p.x, p.y, p.sirka, p.vyska);
    });

    ctx.drawImage(cielObr, cielX, cielY, CIEL_SIRKA, CIEL_VYSKA);
    ctx.drawImage(hracObr, hracX, hracY, HRAC_SIRKA, HRAC_VYSKA);

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 20, 30);

    kresliTlacidla();

    if (tutorialZobrazeny) kresliTutorial();

    if (levelHotovy) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(WIDTH / 2 - 200, HEIGHT / 2 - 80, 400, 120);
        ctx.fillStyle = 'yellow';
        ctx.font = '64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('YOU WIN!', WIDTH / 2, HEIGHT / 2);
    }

    requestAnimationFrame(loop);
}

generujLevel();
loop();
