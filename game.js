const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Odstránené pevné konštanty WIDTH a HEIGHT

let tutorialZobrazeny = true;
let score = 0;

const HRAC_SIRKA = 80;
const HRAC_VYSKA = 120;
let hracX = 50;
// Počiatočná Y pozícia sa nastaví v handleResize alebo generujLevel na základe canvas.height
let hracY = 0;
let rychlostX = 0;
let rychlostY = 0;
const POHYB_RYCHLOST = 5;
const SKOK_SILA = 15;
const GRAVITACIA = 0.8;
let naZemi = true;

const CIEL_SIRKA = 100;
const CIEL_VYSKA = 120;
// Počiatočná X/Y pozícia sa nastaví v generujLevel na základe canvas.width/height
let cielX = 0;
let cielY = 0;

const hracObr = new Image();
hracObr.src = 'player1.png';
const cielObr = new Image();
cielObr.src = 'player2.png';
const pozadieObr = new Image();
pozadieObr.src = 'background.png';

let platformy = [];
let pohyblivaPlatforma = null;
let povodnaPozicia = null;
let smer = 1;
let pohybRychlost = 2;
let platformaAktivna = false;
// Základná platforma sa nastaví v handleResize
let zakladPlatforma = { x: 0, y: 0, sirka: 0, vyska: 40 };


let levelHotovy = false;
let aktualnyLevel = 0;
const maxLevel = 5;
let klavesy = {};

// Mobilné ovládanie - pozície sa nastavia v handleResize
let tlacidloVlavo = { x: 20, y: 0, w: 60, h: 60, stlacene: false };
let tlacidloVpravo = { x: 100, y: 0, w: 60, h: 60, stlacene: false };
let tlacidloSkok = { x: 0, y: 0, w: 60, h: 60, stlacene: false };

let hracUhol = 0;
let hracScaleY = 1;

let cielScale = 1;
let cielScaleSmer = 1;

// Funkcia volaná z index.html pri zmene veľkosti okna/canvasu
function handleResize(newWidth, newHeight) {
    console.log(`Game handling resize to: ${newWidth}x${newHeight}`);

    // Aktualizácia rozmerov základnej platformy
    zakladPlatforma.y = newHeight - 40;
    zakladPlatforma.sirka = newWidth;

    // Aktualizácia pozícií mobilných tlačidiel
    tlacidloVlavo.y = newHeight - 80;
    tlacidloVpravo.y = newHeight - 80;
    tlacidloSkok.x = newWidth - 80; // Vpravo
    tlacidloSkok.y = newHeight - 80;

    // Voliteľné: Ak je hra už spustená, môžeme prepočítať pozície iných prvkov
    // alebo vynútiť prekreslenie. Napríklad, ak by sa hráč mal vrátiť na zem:
    // if (!naZemi && hracY + HRAC_VYSKA > zakladPlatforma.y) {
    //    hracY = zakladPlatforma.y - HRAC_VYSKA;
    //    naZemi = true;
    //    rychlostY = 0;
    // }

    // Prekreslenie môže byť užitočné, ak sa UI mení s veľkosťou
    // (v tomto prípade to zabezpečí hlavná slučka loop)
}
// Sprístupníme funkciu globálne
window.handleResize = handleResize;


canvas.addEventListener('touchstart', e => {
    e.preventDefault(); // Zabráni default správaniu (napr. posun stránky)
    if (tutorialZobrazeny) {
        tutorialZobrazeny = false;
        return;
    }
    for (let t of e.touches) {
        // Správny výpočet pozície dotyku relatívne k canvasu
        let rect = canvas.getBoundingClientRect();
        let x = t.clientX - rect.left;
        let y = t.clientY - rect.top;

        if (bodVObdlzniku(x, y, tlacidloVlavo)) tlacidloVlavo.stlacene = true;
        if (bodVObdlzniku(x, y, tlacidloVpravo)) tlacidloVpravo.stlacene = true;
        if (bodVObdlzniku(x, y, tlacidloSkok)) {
            if (naZemi) {
                rychlostY = -SKOK_SILA;
                naZemi = false;
                score += 1; // Pridanie skóre za skok
            }
            tlacidloSkok.stlacene = true; // Označíme stlačenie pre vizuálnu spätnú väzbu
        }
    }
}, { passive: false }); // passive: false je dôležité pre preventDefault()

canvas.addEventListener('touchend', e => {
    e.preventDefault();
    // Uvoľníme všetky tlačidlá pri zdvihnutí akéhokoľvek prsta
    // Jednoduchší prístup, aj keď nie úplne presný pre multitouch
    tlacidloVlavo.stlacene = false;
    tlacidloVpravo.stlacene = false;
    tlacidloSkok.stlacene = false;
});

// Pomocná funkcia na detekciu kliku v obdĺžniku
function bodVObdlzniku(x, y, rect) {
    return x > rect.x && x < rect.x + rect.w && y > rect.y && y < rect.y + rect.h;
}

// Klávesnica
document.addEventListener('keydown', e => {
    if (tutorialZobrazeny) {
        tutorialZobrazeny = false;
        return; // Ignorujeme klávesy, kým je tutoriál zobrazený
    }
    klavesy[e.key.toLowerCase()] = true;
});
document.addEventListener('keyup', e => {
    klavesy[e.key.toLowerCase()] = false;
});

// Spracovanie ovládania (klávesnica + mobilné tlačidlá)
function ovladanie() {
    if (levelHotovy) return; // Zakážeme ovládanie po dokončení levelu

    // Pohyb do strán
    if (klavesy['arrowleft'] || tlacidloVlavo.stlacene) {
        rychlostX = -POHYB_RYCHLOST;
    } else if (klavesy['arrowright'] || tlacidloVpravo.stlacene) {
        rychlostX = POHYB_RYCHLOST;
    } else {
        rychlostX = 0;
    }

    // Skok (klávesnica)
    if ((klavesy[' '] || klavesy['arrowup']) && naZemi) {
        rychlostY = -SKOK_SILA;
        naZemi = false;
        score += 1; // Pridanie skóre za skok
    }
    // Skok mobilným tlačidlom je už spracovaný v 'touchstart'
}

// Spracovanie fyziky a kolízií
function kolizie() {
    naZemi = false; // Predpokladáme, že hráč nie je na zemi

    // Horizontálny pohyb a kontrola hraníc obrazovky
    hracX += rychlostX;
    if (hracX < 0) {
        hracX = 0;
        rychlostX = 0; // Zastavíme pohyb na hrane
    }
    if (hracX + HRAC_SIRKA > canvas.width) {
        hracX = canvas.width - HRAC_SIRKA;
        rychlostX = 0; // Zastavíme pohyb na hrane
    }

    // Vertikálny pohyb (gravitácia)
    rychlostY += GRAVITACIA;
    hracY += rychlostY;

    // Kolízia s platformami (vrátane základnej)
    let vsetkyPlatformy = [...platformy, zakladPlatforma];
    for (const p of vsetkyPlatformy) {
        // Detekcia kolízie zhora (hráč dopadá na platformu)
        if (
            hracX < p.x + p.sirka &&              // Hráč je vpravo od ľavého okraja platformy
            hracX + HRAC_SIRKA > p.x &&           // Hráč je vľavo od pravého okraja platformy
            hracY + HRAC_VYSKA >= p.y &&          // Hráčove nohy sú na alebo pod úrovňou platformy
            hracY + HRAC_VYSKA - rychlostY <= p.y + 1 // Hráčove nohy boli NAD úrovňou platformy v minulom frame (pridávame malú toleranciu)
        ) {
            // Ak je rýchlosť Y pozitívna (hráč padá)
            if (rychlostY > 0) {
                hracY = p.y - HRAC_VYSKA; // Zarovnáme hráča presne na platformu
                rychlostY = 0;           // Zastavíme vertikálny pohyb
                naZemi = true;           // Hráč je teraz na zemi
                break; // Našli sme kolíziu, ďalej nehľadáme
            }
        }
        // TODO: Pridať detekciu kolízie zdola (náraz hlavou) a zo strán, ak je to potrebné
    }

    // Reset levelu pri páde pod obrazovku (voliteľné)
    if (hracY > canvas.height + 100) { // Ak hráč padne hlboko pod
         console.log("Hráč padol, resetujem level...");
         generujLevel(); // Reštart aktuálneho levelu
         score = Math.max(0, score - 5); // Penalizácia skóre (voliteľné)
    }


    // Kolízia s cieľom
    if (
        !levelHotovy && // Kontrola, či level už nie je hotový
        hracX < cielX + CIEL_SIRKA &&
        hracX + HRAC_SIRKA > cielX &&
        hracY < cielY + CIEL_VYSKA &&
        hracY + HRAC_VYSKA > cielY
    ) {
        levelHotovy = true;
        score += 10; // Bonusové skóre za dokončenie levelu
        console.log(`Level ${aktualnyLevel + 1} dokončený! Skóre: ${score}`);
        setTimeout(() => {
            aktualnyLevel++;
            if (aktualnyLevel < maxLevel) {
                generujLevel(); // Generuj ďalší level
            } else {
                console.log("Gratulujem, prešli ste celú hru!");
                // Tu by mohla byť obrazovka "Game Over" alebo "You Won All Levels"
                // Zatiaľ len zastavíme generovanie nových levelov
                tutorialZobrazeny = true; // Zobrazíme info ako na začiatku
                // Môžeme zmeniť text tutoriálu na gratuláciu
            }
        }, 1500); // Pauza 1.5 sekundy pred ďalším levelom
    }
}

// Generovanie platform a pozícií pre nový level
function generujLevel() {
    console.log(`Generujem Level ${aktualnyLevel + 1}`);
    platformy = [];
    let kroky = 5 + aktualnyLevel; // Zvyšujeme počet platforiem s levelom
    let vyskaKrok = (canvas.height - 250) / kroky; // Rozostup platforiem

    // Generovanie platforiem
    for (let i = 0; i < kroky; i++) {
        let platSirka = 100 + Math.random() * 50; // Rôzna šírka platforiem
        let y = canvas.height - 150 - i * vyskaKrok; // Zhora nadol
        // Náhodná X pozícia, ale zabezpečíme, aby nebola úplne na kraji
        let x = Math.max(20, Math.floor(Math.random() * (canvas.width - platSirka - 40)));
        platformy.push({ x: x, y: y, sirka: platSirka, vyska: 20 });
    }

    // Umiestnenie cieľa na najvyššiu platformu (prvú v poli)
    if (platformy.length > 0) {
        cielX = platformy[0].x + (platformy[0].sirka / 2) - (CIEL_SIRKA / 2); // Centrovanie na platforme
        cielY = platformy[0].y - CIEL_VYSKA - 5; // Tesne nad platformou
    } else {
        // Fallback, ak by sa nevygenerovali platformy
        cielX = canvas.width - CIEL_SIRKA - 30;
        cielY = 50;
    }


    // Umiestnenie hráča na najnižšiu platformu (poslednú v poli)
     if (platformy.length > 0) {
        hracX = platformy[platformy.length - 1].x + (platformy[platformy.length - 1].sirka / 2) - (HRAC_SIRKA / 2); // Centrovanie
        hracY = platformy[platformy.length - 1].y - HRAC_VYSKA - 10; // Tesne nad platformou
     } else {
         // Fallback na základnú platformu
         hracX = 50;
         hracY = zakladPlatforma.y - HRAC_VYSKA - 10;
     }


    // Reset stavu hráča a levelu
    rychlostX = 0;
    rychlostY = 0;
    naZemi = false; // Hráč začína vo vzduchu nad štartovaciou platformou
    levelHotovy = false;
    pohyblivaPlatforma = null; // Reset pohyblivej platformy
    platformaAktivna = false;

    // Zabezpečenie, že hráč nespadne hneď na začiatku, ak sú súradnice zlé
    if (hracY >= canvas.height - HRAC_VYSKA) {
         hracY = canvas.height - HRAC_VYSKA - 50; // Posunieme vyššie
    }

     // Prvé nastavenie pohyblivej platformy pre nový level
     if (platformy.length > 0) {
         setTimeout(updateujPlatformy, 2000); // Spustíme pohyb po 2 sekundách
     }
}

// Kreslenie úvodného tutoriálu / informácií
function kresliTutorial() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(canvas.width * 0.1, canvas.height * 0.15, canvas.width * 0.8, canvas.height * 0.6); // Dynamická veľkosť
    ctx.fillStyle = 'white';
    ctx.font = `${Math.min(30, canvas.width / 20)}px Arial`; // Dynamická veľkosť fontu
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; // Lepšie centrovanie vertikálne

    let stredX = canvas.width / 2;
    let startY = canvas.height * 0.25;
    let riadokVyska = canvas.height * 0.06;

    if (aktualnyLevel >= maxLevel) {
        ctx.font = `${Math.min(40, canvas.width / 15)}px Arial Black`;
        ctx.fillStyle = 'yellow';
        ctx.fillText('GRATULUJEM!', stredX, startY);
        ctx.font = `${Math.min(25, canvas.width / 22)}px Arial`;
        ctx.fillStyle = 'white';
        ctx.fillText(`Prešli ste všetkých ${maxLevel} levelov!`, stredX, startY + riadokVyska * 1.5);
        ctx.fillText(`Vaše finálne skóre: ${score}`, stredX, startY + riadokVyska * 3);
        ctx.fillText('Hru reštartujete obnovením stránky (refresh)', stredX, startY + riadokVyska * 5);

    } else {
        ctx.fillText('OVLÁDANIE', stredX, startY);
        ctx.font = `${Math.min(22, canvas.width / 25)}px Arial`; // Menší font pre popis
        ctx.fillText('PC: Šípky ← → (pohyb), Medzerník / ↑ (skok)', stredX, startY + riadokVyska * 1.5);
        ctx.fillText('Mobil: Tlačidlá na obrazovke', stredX, startY + riadokVyska * 2.5);
        ctx.fillStyle = 'yellow';
        ctx.fillText('Ťuknite alebo stlačte klávesu pre štart', stredX, startY + riadokVyska * 4);
    }
}

// Kreslenie mobilných ovládacích tlačidiel
function kresliTlacidla() {
    // Kreslíme len ak bežíme na zariadení s dotykovým ovládaním (heuristika)
    // alebo ak explicitne chceme (napr. pre testovanie)
    const jeDotykove = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!jeDotykove) return; // Nezobrazujeme na PC (ak nemá dotyk)

    const tlacidla = [tlacidloVlavo, tlacidloVpravo, tlacidloSkok];
    const symboly = ['⬅️', '➡️', '⬆️'];

    tlacidla.forEach((btn, index) => {
        ctx.beginPath();
        // Použijeme roundRect pre zaoblené rohy, ak je dostupný (moderné prehliadače)
        if (ctx.roundRect) {
             ctx.roundRect(btn.x, btn.y, btn.w, btn.h, [10]); // Polomer zaoblenia 10
        } else {
             ctx.rect(btn.x, btn.y, btn.w, btn.h); // Fallback na ostré rohy
        }

        // Zvýraznenie stlačeného tlačidla
        ctx.fillStyle = btn.stlacene ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Symbol tlačidla
        ctx.fillStyle = 'white';
        ctx.font = `${Math.min(32, btn.w * 0.6)}px Arial`; // Dynamická veľkosť symbolu
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symboly[index], btn.x + btn.w / 2, btn.y + btn.h / 2 + 2); // Jemné posunutie symbolu pre lepšie centrovanie
    });
}

// Aktualizácia pohyblivej platformy
function updateujPlatformy() {
     if (levelHotovy || tutorialZobrazeny) return; // Zastavíme pohyb, ak hra nebeží

    // Ak žiadna platforma nie je aktívna, skúsime vybrať novú
    if (!platformaAktivna && platformy.length > 0) {
        let index = Math.floor(Math.random() * platformy.length);
        pohyblivaPlatforma = platformy[index];
        povodnaPozicia = pohyblivaPlatforma.x; // Uložíme počiatočnú pozíciu
        smer = Math.random() < 0.5 ? -1 : 1;   // Náhodný počiatočný smer
        pohybRychlost = 1 + Math.random() * 1.5; // Náhodná rýchlosť
        platformaAktivna = true;
        console.log("Aktivovaná pohyblivá platforma:", index);
    }

    // Ak máme aktívnu platformu, pohybujeme ňou
    if (platformaAktivna && pohyblivaPlatforma) {
        let predosleX = pohyblivaPlatforma.x;
        pohyblivaPlatforma.x += pohybRychlost * smer;

        // Detekcia okrajov obrazovky
        if (pohyblivaPlatforma.x <= 0) {
            pohyblivaPlatforma.x = 0; // Zastavíme presne na hrane
            smer = 1; // Otočíme smer
        } else if (pohyblivaPlatforma.x + pohyblivaPlatforma.sirka >= canvas.width) {
            pohyblivaPlatforma.x = canvas.width - pohyblivaPlatforma.sirka; // Zastavíme presne na hrane
            smer = -1; // Otočíme smer
        }

         // Ak hráč stojí na pohyblivej platforme, pohybujeme ho spolu s ňou
         if (
             naZemi && // Hráč musí byť na zemi
             hracY + HRAC_VYSKA === pohyblivaPlatforma.y && // Hráčove nohy sú presne na Y platformy
             hracX + HRAC_SIRKA > pohyblivaPlatforma.x &&  // Hráč čiastočne prekrýva platformu v X
             hracX < pohyblivaPlatforma.x + pohyblivaPlatforma.sirka
         ) {
             hracX += (pohyblivaPlatforma.x - predosleX); // Posunieme hráča o rovnakú delta X ako platformu
             // Zabezpečíme, aby hráč nebol posunutý mimo obrazovky platformou
             if (hracX < 0) hracX = 0;
             if (hracX + HRAC_SIRKA > canvas.width) hracX = canvas.width - HRAC_SIRKA;
         }

        // Voliteľné: Zastavenie a výber novej platformy po čase alebo návrate
        // Tento kód spôsoboval, že sa platforma niekedy zasekla, zjednodušíme:
        // Platforma sa bude pohybovať neustále tam a späť.
        // Ak chceme časový limit, môžeme použiť setTimeout na deaktiváciu.
    }

     // Plánovanie ďalšej aktivácie, ak momentálne žiadna nie je aktívna
     if (!platformaAktivna && platformy.length > 0 && !levelHotovy && !tutorialZobrazeny) {
         setTimeout(updateujPlatformy, 3000 + Math.random() * 2000); // Skúsime aktivovať novú po 3-5 sekundách
     }
}


// Hlavná herná slučka
function loop() {
    // Logika hry sa nespúšťa, kým nie je tutoriál skrytý
    if (!tutorialZobrazeny) {
        ovladanie();
        if (!levelHotovy) { // Kolízie a pohyb len ak level nie je hotový
            kolizie();
            updateujPlatformy(); // Aktualizujeme pohyb platformy len počas hry
        }
    }

    // --- VYKRESLENIE ---

    // Vyčistenie celej plochy canvasu
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vykreslenie pozadia
    if (pozadieObr.complete && pozadieObr.naturalHeight !== 0) { // Kreslíme, len ak je obrázok načítaný
        ctx.drawImage(pozadieObr, 0, 0, canvas.width, canvas.height);
    } else { // Fallback, ak obrázok chýba alebo sa nenačítal
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }


    // Vykreslenie platforiem (vrátane základnej)
    ctx.fillStyle = 'rgb(0, 32, 64)'; // Tmavšia farba pre platformy
    let vsetkyPlatformy = [...platformy, zakladPlatforma];
    vsetkyPlatformy.forEach(p => {
        ctx.fillRect(p.x, p.y, p.sirka, p.vyska);
    });

    // Vykreslenie cieľa (s animáciou škálovania)
    if (cielObr.complete && cielObr.naturalHeight !== 0) {
        ctx.save();
        ctx.translate(cielX + CIEL_SIRKA / 2, cielY + CIEL_VYSKA / 2);
        ctx.scale(cielScale, cielScale); // Aplikujeme pulzujúce škálovanie
        ctx.drawImage(cielObr, -CIEL_SIRKA / 2, -CIEL_VYSKA / 2, CIEL_SIRKA, CIEL_VYSKA);
        ctx.restore();
    } else { // Fallback
         ctx.fillStyle = 'gold';
         ctx.fillRect(cielX, cielY, CIEL_SIRKA, CIEL_VYSKA);
         ctx.fillStyle = 'black';
         ctx.fillText('C', cielX + CIEL_SIRKA / 2, cielY + CIEL_VYSKA / 2);
    }


    // Vykreslenie hráča (s animáciou rotácie a škálovania)
     if (hracObr.complete && hracObr.naturalHeight !== 0) {
        ctx.save(); // Uložíme aktuálny stav kreslenia
        ctx.translate(hracX + HRAC_SIRKA / 2, hracY + HRAC_VYSKA / 2); // Presunieme origo do stredu hráča
        ctx.rotate(hracUhol); // Aplikujeme rotáciu
        ctx.scale(1, hracScaleY); // Aplikujeme vertikálne škálovanie
        // Kreslíme obrázok okolo nového origa
        ctx.drawImage(hracObr, -HRAC_SIRKA / 2, -HRAC_VYSKA / 2, HRAC_SIRKA, HRAC_VYSKA);
        ctx.restore(); // Vrátime stav kreslenia
     } else { // Fallback
         ctx.fillStyle = 'red';
         ctx.fillRect(hracX, hracY, HRAC_SIRKA, HRAC_VYSKA);
     }


    // Vykreslenie skóre
    ctx.fillStyle = 'white';
    ctx.font = `${Math.min(24, canvas.width / 25)}px Arial`; // Dynamický font
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`SKÓRE: ${score}`, 20, 20);
    ctx.fillText(`Level: ${aktualnyLevel + 1} / ${maxLevel}`, 20, 50);


    // Vykreslenie mobilných tlačidiel (ak je to potrebné)
    kresliTlacidla();

    // Vykreslenie tutoriálu/výhernej obrazovky, ak je aktívny
    if (tutorialZobrazeny) {
        kresliTutorial();
    }

    // Vykreslenie správy o dokončení levelu
    if (levelHotovy && aktualnyLevel < maxLevel) { // Zobrazujeme len ak nie je posledný level
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 60, 400, 100); // Približne centrované
        ctx.fillStyle = 'yellow';
        ctx.font = `${Math.min(50, canvas.width / 10)}px Arial Black`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LEVEL UP!', canvas.width / 2, canvas.height / 2 - 10);
    }

    // --- Aktualizácia animácií pre ďalší frame ---
    // (Robíme to na konci, aby sa aplikovali na ďalšie kreslenie)

    // Animácia hráča
    if (!naZemi) { // Skok
        hracUhol = Math.sin(Date.now() / 150) * 0.15; // Mierne väčšie kývanie
        hracScaleY = 1 + Math.abs(Math.sin(Date.now() / 150)) * 0.1; // Stlačenie/natiahnutie
    } else if (Math.abs(rychlostX) > 0) { // Chôdza
        hracUhol = Math.sin(Date.now() / 200) * 0.08; // Jemné kývanie pri chôdzi
        hracScaleY = 1 + Math.sin(Date.now() / 100) * 0.05; // Jemné "dýchanie"
    } else { // Státie
        hracUhol = 0;
        hracScaleY = 1;
    }

    // Animácia cieľa (pulzovanie)
    cielScale += 0.004 * cielScaleSmer;
    if (cielScale > 1.06 || cielScale < 0.94) {
        cielScaleSmer *= -1; // Obrátime smer škálovania
    }

    // Požiadavka na ďalší frame animácie
    requestAnimationFrame(loop);
}

// --- ŠTART HRY ---
// Predpokladáme, že canvas už má rozmery nastavené z index.html
// Preto môžeme hneď volať handleResize, aby sa nastavili počiatočné pozície UI
handleResize(canvas.width, canvas.height);
// A potom vygenerovať prvý level a spustiť hru
generujLevel();
loop();