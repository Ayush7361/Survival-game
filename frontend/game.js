const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");  

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

let leaderboardScores = [];
let leaderboardFetched = false;


function playMoveSound() {
  moveSound.currentTime = 0;
  moveSound.play().catch(function () {});
}

function playHitSound() {
  hitSound.currentTime = 0;
  hitSound.play().catch(function () {});
}
// BACKEDN CONNECTION

function sendScore(name, score) {
  fetch("https://survival-game-backend-98hj.onrender.com/api/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name, score: score })
  });
}

function getLeaderboard(callback) {
  fetch("https://survival-game-backend-98hj.onrender.com/api/leaderboard")
    .then(function (res) {
      return res.json();
    })
    .then(callback);
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


// enemies

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


// collision 
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
  hideControls();
  showRestartButton();

  const playerName = prompt("Enter your name:");
  if (playerName) {
    sendScore(playerName, survivedSeconds);
  }
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

const rankColors = ["gold", "silver", "#cd7f32"];

function getRankColor(index) {
  if (index < rankColors.length) {
    return rankColors[index];
  }
  return "white";
}

function drawGameOverScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.font = "bold 90px Arial";
  ctx.fillText("GAME OVER", canvas.width / 2, 150);

  ctx.font = "48px Arial";
  ctx.fillText("Survived: " + survivedSeconds + "s", canvas.width / 2, 230);

  ctx.font = "bold 40px Arial";
  ctx.fillText("LEADERBOARD", canvas.width / 2, 320);

  if (!leaderboardFetched) {
    leaderboardFetched = true;
    getLeaderboard(function (scores) {
      leaderboardScores = scores;
      drawGameOverScreen();
    });
  }

  ctx.font = "32px Arial";
  for (let i = 0; i < leaderboardScores.length && i < 10; i++) {
    const entry = leaderboardScores[i];
    ctx.fillStyle = getRankColor(i);
    ctx.fillText((i + 1) + ". " + entry.name + " - " + entry.score + "s", canvas.width / 2, 380 + i * 45);
  }

  ctx.textAlign = "left";
}

function drawWorldWithShake() {
  const offsetX = (Math.random() - 0.5) * shakeIntensity;
  const offsetY = (Math.random() - 0.5) * shakeIntensity;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  drawWorld();
  ctx.restore();
}

//  main game loop 
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

// mobile controls - buttons already exist in HTML, we just wire them up

function handleDirectionPress(dx, dy) {
  if (!gameActive) return;
  movePlayer(dx, dy);
  checkCollision();
}

function hideControls() {
  for (let i = 0; i < directionButtons.length; i++) {
    directionButtons[i].el.classList.add("hidden");
  }
}

const restartBtn = document.getElementById("restartBtn");

function showRestartButton() {
  restartBtn.classList.remove("hidden");
}

restartBtn.addEventListener("click", function () {
  location.reload();
});

const directionButtons = [
  { el: document.getElementById("upBtn"), dx: 0, dy: -1 },
  { el: document.getElementById("downBtn"), dx: 0, dy: 1 },
  { el: document.getElementById("leftBtn"), dx: -1, dy: 0 },
  { el: document.getElementById("rightBtn"), dx: 1, dy: 0 }
];

for (let i = 0; i < directionButtons.length; i++) {
  const button = directionButtons[i];

  button.el.addEventListener("touchstart", function (e) {
    e.preventDefault();
    handleDirectionPress(button.dx, button.dy);
  });

  button.el.addEventListener("click", function () {
    handleDirectionPress(button.dx, button.dy);
  });
}

requestAnimationFrame(gameLoop);