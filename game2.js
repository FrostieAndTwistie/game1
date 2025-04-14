const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const platformCount = 6;
const platformWidth = 100;
const platformHeight = 20;
const platforms = [];

function getRandomX() {
  return Math.random() * (canvas.width - platformWidth);
}

// Vytvorenie platforiem na požadovaných pozíciách
for (let i = 0; i < platformCount; i++) {
  let x = i === 0 ? 0 : getRandomX(); // prvá platforma vľavo
  let y = i === 0 
    ? canvas.height - platformHeight // prvá úplne dole
    : canvas.height * (i / 6);

  platforms.push({
    x: x,
    y: y,
    width: platformWidth,
    height: platformHeight,
    dx: 0,
    moving: false,
    hasMoved: false,
    color: i === 0 ? 'rgb(0,32,64)' : 'rgba(0,118,182,0.5)'
  });
}

function drawPlatforms() {
  platforms.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });
}

function updatePlatforms() {
  platforms.forEach(p => {
    if (p.moving) {
      p.x += p.dx;

      if ((p.dx < 0 && p.x <= 0) || (p.dx > 0 && p.x + p.width >= canvas.width)) {
        p.moving = false;
        p.hasMoved = true;
        p.x = getRandomX();
        p.dx = 0;
      }
    }
  });
}

function pickTwoPlatformsToMove(excludeMoved = true) {
  let candidates = platforms
    .map((p, i) => ({ p, i }))
    .filter(obj => !excludeMoved || !obj.p.hasMoved)
    .map(obj => obj.i);

  if (candidates.length < 2) return;

  let selected = [];
  while (selected.length < 2) {
    const randIndex = Math.floor(Math.random() * candidates.length);
    selected.push(candidates[randIndex]);
    candidates.splice(randIndex, 1);
  }

  platforms[selected[0]].moving = true;
  platforms[selected[0]].dx = 3;

  platforms[selected[1]].moving = true;
  platforms[selected[1]].dx = -3;
}

pickTwoPlatformsToMove();

setTimeout(() => {
  pickTwoPlatformsToMove(true);
}, 3000);

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlatforms();
  drawPlatforms();
  requestAnimationFrame(gameLoop);
}

gameLoop();
