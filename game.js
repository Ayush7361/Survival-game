const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d"); // toolbox used to draw on the canvas

const TILE = 144;
const SIZE = 12;

const playerImg = document.getElementById("playerImg");
const enemyImages = [
  document.getElementById("enemy1Img"),
  document.getElementById("enemy2Img"),
  document.getElementById("enemy3Img"),
  document.getElementById("enemy4Img"),
  document.getElementById("enemy5Img"),
  document.getElementById("enemy6Img")
];

const moveSound = document.getElementById("moveSound");
const hitSound = document.getElementById("hitSound");
const gameOverImg = document.getElementById("gameOverImg");

// 0 = open tile, 1 = wall
const walls = [
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,0,1,0,1,1,1,1,0],
  [0,0,0,1,0,1,0,0,0,0,1,0],
  [1,1,0,1,0,1,1,1,1,0,1,0],
  [0,0,0,0,0,0,0,0,1,0,0,0],
  [0,1,1,1,1,1,1,0,1,1,1,0],
  [0,0,0,0,0,0,1,0,0,0,0,0],
  [0,1,1,1,1,0,1,1,1,1,1,0],
  [0,0,0,0,1,0,0,0,0,0,1,0],
  [0,1,1,0,1,1,1,1,1,0,1,0],
  [0,0,0,0,0,0,0,0,1,0,0,0],
  [0,1,1,1,1,1,1,0,0,0,1,0]
];

let gameActive = true;
let player = { x: 0, y: 0 };

let enemies = [
  { x: 3, y: 2 },
  { x: 7, y: 4 },
  { x: 5, y: 7 },
  { x: 9, y: 1 },
  { x: 2, y: 9 },
  { x: 6, y: 6 }
];

const startTime = performance.now();
let survivedSeconds = 0;

let lastEnemyMoveTime = 0;
let enemyMoveDelay = 400;

let deathTime = 0;
const shakeDuration = 400;
const shakeIntensity = 25;


// sound helpers 
// .play() returns a Promise. If the browser blocks autoplay, it rejects.
// We just ignore that failure with .catch(() => {}) so it doesn't crash anything.

function playMoveSound() {
  moveSound.currentTime = 0;
  moveSound.play().catch(function () {});
}

function playHitSound() {
  hitSound.currentTime = 0;
  hitSound.play().catch(function () {});
}


// movement rules

function isWalkable(x, y) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) {
    return false;
  }
  return walls[y][x] === 0;
}

function movePlayer(deltaX, deltaY) {
  const newX = player.x + deltaX;
  const newY = player.y + deltaY;

  if (isWalkable(newX, newY)) {
    player.x = newX;
    player.y = newY;
    playMoveSound();
  }
}

function getMoveFromKey(key) {
  if (key === "ArrowUp")    return { dx: 0, dy: -1 };
  if (key === "ArrowDown")  return { dx: 0, dy: 1 };
  if (key === "ArrowLeft")  return { dx: -1, dy: 0 };
  if (key === "ArrowRight") return { dx: 1, dy: 0 };
  return null;
}

document.addEventListener("keydown", function (event) {
  if (!gameActive) return;

  const move = getMoveFromKey(event.key);
  if (move) {
    movePlayer(move.dx, move.dy);
    checkCollision();
  }
});


// ---------- enemies ----------

const randomDirections = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 }
];

function moveEnemyRandomly(enemy) {
  const direction = randomDirections[Math.floor(Math.random() * 4)];
  const newX = enemy.x + direction.dx;
  const newY = enemy.y + direction.dy;

  if (isWalkable(newX, newY)) {
    enemy.x = newX;
    enemy.y = newY;
  }
}

function updateEnemies(time) {
  const enoughTimePassed = time - lastEnemyMoveTime > enemyMoveDelay;
  if (!enoughTimePassed) return;

  for (let i = 0; i < enemies.length; i++) {
    moveEnemyRandomly(enemies[i]);
  }

  checkCollision();
  lastEnemyMoveTime = time;
}


// collision / death 

function checkCollision() {
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (enemy.x === player.x && enemy.y === player.y) {
      handleDeath();
      return;
    }
  }
}

function handleDeath() {
  if (!gameActive) return;

  gameActive = false;
  playHitSound();
  deathTime = performance.now();
}


//  drawing

function drawGrid() {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const pixelX = col * TILE;
      const pixelY = row * TILE;

      if (walls[row][col]) {
        ctx.fillRect(pixelX, pixelY, TILE, TILE);
      } else {
        ctx.strokeRect(pixelX, pixelY, TILE, TILE);
      }
    }
  }
}

function drawEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    ctx.drawImage(enemyImages[i], enemy.x * TILE, enemy.y * TILE, TILE, TILE);
  }
}

function drawPlayer() {
  ctx.drawImage(playerImg, player.x * TILE, player.y * TILE, TILE, TILE);
}

function drawTimer() {
  ctx.font = "36px Arial";
  ctx.fillText("Time: " + survivedSeconds + "s", 20, 50);
}

function drawWorld() {
  drawGrid();
  drawEnemies();
  drawPlayer();
  drawTimer();
}

function drawGameOverScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(gameOverImg, 0, 0, canvas.width, canvas.height);
  ctx.font = "64px Arial";
  ctx.fillText("Survived: " + survivedSeconds + "s", 200, 200);
}

// draws the world slightly offset by a random amount, to fake a "shake" effect
function drawWorldWithShake() {
  const offsetX = (Math.random() - 0.5) * shakeIntensity;
  const offsetY = (Math.random() - 0.5) * shakeIntensity;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  drawWorld();
  ctx.restore();
}


//  main game loop 
// runs once per animation frame (~60 times per second)

function gameLoop(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameActive) {
    survivedSeconds = Math.floor((time - startTime) / 1000);
    enemyMoveDelay = Math.max(80, 400 - survivedSeconds * 15); // enemies speed up over time

    updateEnemies(time);
    drawWorld();
  }
  else if (time - deathTime < shakeDuration) {
    drawWorldWithShake();
  }
  else {
    drawGameOverScreen();
    return; // stop the loop, game is fully over
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);