const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // Kontextvariable for painting

// --- Game settings ---
let SIRKA_OBRAZOVKY = window.innerWidth;
let VYSKA_OBRAZOVKY = window.innerHeight;

// Nastavíme rozmery canvasu na maximálne rozmery okna
canvas.width = SIRKA_OBRAZOVKY;
canvas.height = VYSKA_OBRAZOVKY;

// Hráč
const HRAC_SIRKA = 40;
const HRAC_VYSKA = 60;
let hracX = 50;
let hracY = VYSKA_OBRAZOVKY - 40 - HRAC_VYSKA; // Na zemi na začiatku
let rychlostX = 0;
let rychlostY = 0;
const HRAC_RYCHLOST_POHYBU = 5;
const SKOK_VYKON = 15;
const GRAVITACIA = 0.8;
let naZemi = true;
let tesiSaHrac = false;

// Cieľ
const CIEL_SIRKA = 50;
const CIEL_VYSKA = 70;
const cielX = SIRKA_OBRAZOVKY - CIEL_SIRKA - 30;
const cielY = VYSKA_OBRAZOVKY - 40 - CIEL_VYSKA; // Na zemi
let tesiSaCiel = false;

// Načítanie obrázkov
const hracObrazok = new Image();
hracObrazok.src = 'player1.png';

const cielObrazok = new Image();
cielObrazok.src = 'player2.png';

const pozadieObrazok = new Image();
pozadieObrazok.src = 'background.png';

// Platformy (pole objektov s x, y, šírkou, výškou)
const platformy = [
    // Zem
    { x: 0, y: VYSKA_OBRAZOVKY - 40, sirka: SIRKA_OBRAZOVKY, vyska: 40 },
    // Ostatné (možno budete chcieť prispôsobiť pozície pre rôzne rozlíšenia)
    { x: 200, y: VYSKA_OBRAZOVKY - 150, sirka: 150, vyska: 20 },
    { x: 400, y: VYSKA_OBRAZOVKY - 280, sirka: 120, vyska: 20 },
    { x: 550, y: VYSKA_OBRAZOVKY - 400, sirka: 100, vyska: 20 }
];

let levelDokonceny = false;
let stlaceneKlavesy = {}; // Objekt na sledovanie stlačených kláves

// --- Funkcie Kreslenia ---
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
    ctx.fillStyle = 'blue'; // Farba platforiem
    platformy.forEach(p => {
        ctx.fillRect(p.x, p.y, p.sirka, p.vyska);
    });
}

// --- Ovládanie ---
document.addEventListener('keydown', (e) => {
    stlaceneKlavesy[e.key.toLowerCase()] = true; // Zaznamenaj stlačenú klávesu
});

document.addEventListener('keyup', (e) => {
    stlaceneKlavesy[e.key.toLowerCase()] = false; // Zaznamenaj uvoľnenú klávesu
});

function spracujOvladanie() {
    if (levelDokonceny) {
        rychlostX = 0;
        return;
    }

    rychlostX = 0; // Prednastavené na státie
    if (stlaceneKlavesy['a'] || stlaceneKlavesy['arrowleft']) {
        rychlostX = -HRAC_RYCHLOST_POHYBU;
    }
    if (stlaceneKlavesy['d'] || stlaceneKlavesy['arrowright']) {
        rychlostX = HRAC_RYCHLOST_POHYBU;
    }
    // Skok - len raz pri stlačení a ak je na zemi
    if ((stlaceneKlavesy['w'] || stlaceneKlavesy['arrowup'] || stlaceneKlavesy[' ']) && naZemi) {
       rychlostY = -SKOK_VYKON;
       naZemi = false;
    }
}

// --- Kolízie ---
function detekujKolizie() {
    naZemi = false; // Reset pred kontrolou

    // Pohyb X
    hracX += rychlostX;

    // Pohyb Y + Gravitácia
    rychlostY += GRAVITACIA;
    hracY += rychlostY;

    // Kolízia s platformami
    platformy.forEach(p => {
        // Jednoduchá kolízia zhora (pre platforming)
        if (hracX < p.x + p.sirka &&
            hracX + HRAC_SIRKA > p.x &&
            hracY + HRAC_VYSKA >= p.y && // Hráčova spodná hrana je pod hornou hranou platformy
            hracY + HRAC_VYSKA - rychlostY <= p.y) { // Ale v predchádzajúcom kroku bola nad ňou

            hracY = p.y - HRAC_VYSKA; // Polož hráča na platformu
            rychlostY = 0;
            naZemi = true;
        }
        // TODO: Pridať detailnejšie kolízie zo strán a zospodu pre presnejšie správanie
    });

    // Kolízia s cieľom
    if (hracX < cielX + CIEL_SIRKA &&
        hracX + HRAC_SIRKA > cielX &&
        hracY < cielY + CIEL_VYSKA &&
        hracY + HRAC_VYSKA > cielY) {
        if (!levelDokonceny) {
            levelDokonceny = true;
            tesiSaHrac = true;
            tesiSaCiel = true;
        }
    }
}

// --- Herná Slučka ---
function gameLoop() {
    // 1. Spracuj vstup
    spracujOvladanie();

    // 2. Aktualizuj stav (pohyb, kolízie)
    if (!levelDokonceny) {
       detekujKolizie();
    }

    // 3. Vykresli všetko
    // Vyčisti plátno (už to robí prekreslenie pozadia)
    // ctx.clearRect(0, 0, SIRKA_OBRAZOVKY, VYSKA_OBRAZOVKY);

    // Nakresli pozadie ako prvé
    nakresliPozadie();

    // Nakresli prvky hry
    nakresliPlatformy();
    nakresliCiel();
    nakresliHraca();

    // Správa o dokončení
    if (levelDokonceny) {
        ctx.fillStyle = 'yellow';
        ctx.font = '74px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Gratulujem!', SIRKA_OBRAZOVKY / 2, VYSKA_OBRAZOVKY / 2);
    }


    // Požiadaj prehliadač o ďalší snímok
    requestAnimationFrame(gameLoop);
}

// Inicializácia rozmerov pri spustení a pri zmene veľkosti okna
function upravRozmery() {
    SIRKA_OBRAZOVKY = window.innerWidth;
    VYSKA_OBRAZOVKY = window.innerHeight;
    canvas.width = SIRKA_OBRAZOVKY;
    canvas.height = VYSKA_OBRAZOVKY;

    // Budete možno chcieť prispôsobiť pozície herných elementov pri zmene rozlíšenia
    // Napríklad:
    hracY = VYSKA_OBRAZOVKY - 40 - HRAC_VYSKA;
    cielX = SIRKA_OBRAZOVKY - CIEL_SIRKA - 30;
    cielY = VYSKA_OBRAZOVKY - 40 - CIEL_VYSKA;
    platformy[0].sirka = SIRKA_OBRAZOVKY;
    platformy[0].y = VYSKA_OBRAZOVKY - 40;
    // Ostatné platformy možno budete musieť prispôsobiť komplexnejšie
}

window.addEventListener('resize', upravRozmery);
upravRozmery(); // Nastavíme rozmery aj pri prvom načítaní stránky

// Spusti hernú slučku
gameLoop();
