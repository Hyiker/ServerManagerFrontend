// ==========================================================
// Global Game Variables
// ==========================================================

// --- Color and Layout ---
const gridBG = [24, 21, 17];      // Color for the game grid background
const gameBG = [68, 60, 51];      // Color for the main background
const scl = 4;                    // Scale factor for rendering
const padding = 4;                // Padding value
const columns = 100;              // Game grid width
const rows = 160;                 // Game grid height
const gameOffset = 4 * scl;       // Offset for the game area
let nextOffset;                   // X-offset for the "next block" display
let gameRes;                      // p5.Vector for game resolution (width, height)

// --- Game State ---
let grid = [];                    // The main 2D array representing the game board
let buff;                         // p5.Image buffer for rendering the grid efficiently
let t = 0;                        // Time counter / frame counter
let playerBlock;                  // The currently controlled block
let nextBlock;                    // The upcoming block
let vis = [];                     // Array for visited cells during flood fill (line clear)
let fullLine = false;             // Flag indicating a full line has been detected
let cleartime = 0;                // Timer for the line clearing animation
let placed = false;               // Flag indicating the player block has been placed
let linesCleared = 0;             // Total lines cleared
let score = 0;                    // Player's score
let difficulty = 1;               // Current game difficulty/level
let vel = 0.5;                    // Falling speed of blocks
let dupChance = 0.5;              // Chance for the next block to be a different color
let gameOver = true;              // Game over state flag
let paused = true;                // Paused state flag
let scoreSubmitted = true;        // Flag to prevent multiple score submissions

// --- UI & DOM Elements ---
let startScreen, pauseScreen, aboutScreen, gameoverScreen;
let gameoverText;
let timeText = "00:00";
let levelSlider, levelText, sfxSlider1, sfxSlider2, musSlider1, musSlider2, musicText;

// --- Sound & Assets ---
let placeSound, lineSound, gameMusic;
let pixelFont;
let lpfilter; // Low-pass filter for music when paused

// --- Leaderboard & User ---
let userId;
const lbUrl = "https://fanrco.pythonanywhere.com";

// --- Controls ---
const btnControls = {
    'fast': false,
    'rotate': false,
    'down': false,
    'left': false,
    'right': false
};

// ==========================================================
// Game Data (Blocks & Colors)
// ==========================================================

const brick = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 2, 2, 0, 1, 0],
    [0, 1, 0, 2, 2, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
];
const staticbrick = [
    [2, 0, 0, 0, 0, 0, 0, 2],
    [0, 1, 2, 1, 1, 2, 1, 0],
    [0, 2, 1, 1, 1, 1, 2, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 2, 1, 1, 1, 1, 2, 0],
    [0, 1, 2, 1, 1, 2, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 2]
];
const cols = [102, 196, 340, 50]; // Color hues
const blockType = [
    [
        [0, 0, 0, 1, 1, 0, 1, 1],
        [0, 0, 0, 1, 1, 0, 1, 1],
        [0, 0, 0, 1, 1, 0, 1, 1],
        [0, 0, 0, 1, 1, 0, 1, 1]
    ],
    [
        [0, 0, 0, 1, 1, 0, 0, 2],
        [0, 0, 1, 0, 2, 0, 2, 1],
        [0, 2, 1, 2, 1, 1, 1, 0],
        [0, 0, 0, 1, 1, 1, 2, 1]
    ],
    [
        [0, 0, 1, 0, 1, 1, 1, 2],
        [0, 1, 1, 1, 2, 1, 2, 0],
        [0, 0, 0, 1, 0, 2, 1, 2],
        [0, 0, 0, 1, 1, 0, 2, 0]
    ],
    [
        [0, 0, 1, 0, 1, 1, 2, 1],
        [0, 1, 0, 2, 1, 1, 1, 0],
        [0, 0, 1, 0, 1, 1, 2, 1],
        [0, 1, 0, 2, 1, 1, 1, 0]
    ],
    [
        [0, 1, 1, 1, 1, 0, 2, 0],
        [0, 0, 0, 1, 1, 1, 1, 2],
        [0, 1, 1, 1, 1, 0, 2, 0],
        [0, 0, 0, 1, 1, 1, 1, 2]
    ],
    [
        [0, 0, 1, 0, 2, 0, 1, 1],
        [0, 1, 1, 0, 1, 1, 1, 2],
        [1, 0, 0, 1, 1, 1, 2, 1],
        [0, 0, 0, 1, 0, 2, 1, 1]
    ],
    [
        [0, 0, 1, 0, 2, 0, 3, 0],
        [0, 0, 0, 1, 0, 2, 0, 3],
        [0, 0, 1, 0, 2, 0, 3, 0],
        [0, 0, 0, 1, 0, 2, 0, 3]
    ]
];
const blockWidth = [
    [1, 1, 1, 1],
    [1, 2, 1, 2],
    [1, 2, 1, 2],
    [2, 1, 2, 1],
    [2, 1, 2, 1],
    [2, 1, 2, 1],
    [3, 0, 3, 0]
];
const blockHeight = [
    [1, 1, 1, 1],
    [2, 1, 2, 1],
    [2, 1, 2, 1],
    [1, 2, 1, 2],
    [1, 2, 1, 2],
    [1, 2, 1, 2],
    [0, 3, 0, 3]
];

// ==========================================================
// p5.js Core Functions (preload, setup, draw)
// ==========================================================

function preload() {
    // Handle user ID cookie
    userId = getCookie('userId');
    if (!userId) {
        userId = generateUserId();
        setCookie('userId', userId, 3650); // Set cookie for 10 years
    }

    // Load assets
    soundFormats('mp3', 'ogg');
    placeSound = loadSound('sounds/place');
    lineSound = loadSound('sounds/line');
    gameMusic = loadSound('sounds/music');
    pixelFont = loadFont('fonts/retroFont.ttf');
}

function setup() {
    // Get DOM elements for UI screens
    startScreen = document.getElementById('startpage');
    pauseScreen = document.getElementById('pausepage');
    gameoverScreen = document.getElementById('gameoverpage');
    aboutScreen = document.getElementById('aboutpage');
    sfxSlider1 = document.getElementById('sfx1Slider');
    sfxSlider2 = document.getElementById('sfx2Slider');
    musSlider1 = document.getElementById('mus1Slider');
    musSlider2 = document.getElementById('mus2Slider');
    gameoverText = document.getElementById('gameoverText');

    loadLeaderboard();

    // Setup canvas
    gameRes = createVector(columns * scl, rows * scl);
    nextOffset = gameRes.x + gameOffset;
    const cnv = createCanvas(gameRes.x + gameOffset * 11, gameRes.y);
    cnv.parent('cnv');
    textFont(pixelFont);
    frameRate(60);
    noSmooth();

    // Setup audio
    lpfilter = new p5.LowPass();
    lpfilter.freq(10000);
    gameMusic.disconnect();
    gameMusic.connect(lpfilter);
    gameMusic.setVolume(0.5);

    // Initialize volume sliders and game state
    SFXvolume(1);
    MUSvolume(1);
    resetGame();

    console.log("Now with more sand!");
}

function draw() {
    UI();
    GameLogic();
}


// ==========================================================
// Game Logic
// ==========================================================

function GameLogic() {
    if (paused) return;

    if (gameOver) {
        gameMusic.stop();
        return;
    }

    if (fullLine) {
        // Line clear animation
        if (cleartime === 0) {
            linesCleared += 1;
            lineSound.play();
        }
        cleartime += 1;
        setLineColor(cleartime);
        if (cleartime > 30) {
            deleteLine();
            cleartime = 0;
            fullLine = false;
        }
        return;
    }

    if (placed) {
        // A block has been placed, generate the next one
        if (!gameMusic.isPlaying()) {
            gameMusic.loop();
        }
        playerBlock = nextBlock;
        nextBlock = new Block();
        nextBlock.newBlock();

        // Avoid consecutive blocks of the same color
        if (playerBlock.col === nextBlock.col) {
            if (random() < dupChance) {
                nextBlock.col = (nextBlock.col + 1) % 4;
                nextBlock.renderBlock();
            }
        }
        placed = false;
    }

    // Update difficulty based on lines cleared
    difficulty = min(floor(linesCleared / 10), 9) + 1;
    vel = 0.5 + difficulty * 0.1;
    dupChance = 0.5 + difficulty * 0.02;

    // Main update loop
    updateGrid();
    playerBlock.update();
    playerBlock.handleControls();
    checkLine();
    t += 1;
}

function resetGame() {
    scoreSubmitted = false;
    let responseBox = document.getElementById('responseBox');
    responseBox.innerHTML = '';
    score = 0;
    linesCleared = 0;
    t = 0;
    lpfilter.freq(10000);
    placed = false;
    buff = createImage(columns, rows);

    // Initialize grid
    grid = [];
    for (let i = 0; i < rows; i++) {
        grid[i] = [];
        for (let j = 0; j < columns; j++) {
            grid[i].push(null);
        }
    }

    // Create first blocks
    playerBlock = new Block();
    playerBlock.newBlock();
    nextBlock = new Block();
    nextBlock.newBlock();
}

function startGame() {
    resetGame();
    paused = false;
    gameOver = false;
    startScreen.open = false;
    gameMusic.stop();
}

function unpauseGame() {
    lpfilter.freq(10000);
    paused = false;
    pauseScreen.open = false;
}

function newGame() {
    pauseScreen.open = false;
    gameoverScreen.open = false;
    startScreen.open = true;
    gameMusic.stop();
}

// ==========================================================
// Block Class
// ==========================================================

function Block() {
    this.pos = createVector(0, 0);
    this.grav = vel;
    this.sprite = null;
    this.grid = []; // Local grid for rendering the block sprite
    this.type = 0;
    this.col = 0; // Color index
    this.isStatic = false;
    this.rot = 0; // Rotation index
    this.canRotate = true;

    // Clears the local grid for the block's sprite
    this.clearGrid = function() {
        this.grid = [];
        for (let i = 0; i < 32; i++) {
            this.grid.push(new Array(32).fill(null));
        }
    };

    // Renders the block's data onto its local sprite
    this.renderBlock = function() {
        this.clearGrid();
        AddBlock(this.grid, 0, 31, blockType[this.type][this.rot], this.col, this.isStatic);
        renderFromArray(this.grid, this.sprite);
    };

    // Generates a new random block
    this.newBlock = function() {
        this.isStatic = false; // Math.random() < 0.1; // Example for static chance
        this.sprite = createImage(32, 32);
        this.type = int(random(blockType.length));
        this.col = int(random(4));
        this.pos = createVector(int(columns / 2 - (blockWidth[this.type][0] + 1)), 0);
        this.renderBlock();
    };

    // Displays the block on the main canvas
    this.show = function() {
        image(this.sprite, this.pos.x * scl, (this.pos.y - 32) * scl, 32 * scl, 32 * scl);
    };

    // Updates block position and checks for placement
    this.update = function() {
        let x = Math.floor(this.pos.x);
        let y = Math.ceil(this.pos.y);

        if (y + 1 >= rows) {
            placed = true;
        } else {
            // Check for collision with settled sand below
            for (let i = 0; i < 4; i++) {
                let brickOffsetX = blockType[this.type][this.rot][i * 2];
                let brickOffsetY = blockType[this.type][this.rot][i * 2 + 1];
                let brickBaseX = int(x + brickOffsetX * 8);
                let brickBaseY = int(y - brickOffsetY * 8);

                if (brickBaseY <= 0) continue;

                for (let j = 0; j < 8; j++) {
                    if (grid[brickBaseY + 1][brickBaseX + j] != null) {
                        if (grid[brickBaseY][brickBaseX + j]) {
                            this.pos.y -= 1; // Adjust position if overlapping
                        }
                        placed = true;
                    }
                }
            }
        }

        if (placed) {
            // Check for game over (topping out)
            if (this.pos.y - 8 * (blockHeight[this.type][this.rot] + 1) < 0) {
                gameOver = true;
                gameOverScore();
                gameoverScreen.open = true;
            }
            // Add block to the main grid
            AddBlock(grid, x, min(y, rows - 1), blockType[this.type][this.rot], this.col, this.isStatic);
            placeSound.play();
            return;
        }

        this.pos.y += this.grav;
    };

    // Rotates the block
    this.rotate = function() {
        this.rot = (this.rot + 1) % 4;
        this.clearGrid();
        this.sprite = createImage(32, 32);
        AddBlock(this.grid, 0, 31, blockType[this.type][this.rot], this.col, this.isStatic);
        renderFromArray(this.grid, this.sprite);

        // Prevent rotation out of bounds
        let w = blockWidth[this.type][this.rot] + 1;
        if (this.pos.x > columns - w * 8) {
            this.pos.x = columns - w * 8;
        }
    };

    // Handles user input for moving and rotating the block
    this.handleControls = function() {
        let speed = 1;
        if (keyIsDown(SHIFT) || keyIsDown(CONTROL) || btnControls['fast'] === true) {
            speed = 2;
        }

        if (keyIsDown(87) || keyIsDown(UP_ARROW) || btnControls['rotate'] === true) {
            if (this.canRotate) {
                this.rotate();
                this.canRotate = false;
            }
        } else {
            this.canRotate = true;
        }

        if (keyIsDown(65) || keyIsDown(LEFT_ARROW) || btnControls['left'] === true) {
            this.pos.x -= speed;
            if (this.pos.x < 0) {
                this.pos.x = 0;
            }
        }

        if (keyIsDown(68) || keyIsDown(RIGHT_ARROW) || btnControls['right'] === true) {
            this.pos.x += speed;
            let w = blockWidth[this.type][this.rot] + 1;
            if (this.pos.x > columns - w * 8) {
                this.pos.x = columns - w * 8;
            }
        }

        if (keyIsDown(83) || keyIsDown(DOWN_ARROW) || btnControls['down'] === true) {
            this.pos.y += 1;
            score += 1; // Bonus points for fast-dropping
        }
    };
}


// ==========================================================
// Grid and Rendering Logic
// ==========================================================

// Adds a full multi-part block to a grid array
function AddBlock(targetGrid, x, y, blockData, colorIndex, isStatic) {
    for (let i = 0; i < 4; i++) {
        AddSingleBrick(
            targetGrid,
            x + blockData[i * 2] * 8,
            y - blockData[i * 2 + 1] * 8,
            colorIndex,
            isStatic
        );
    }
}

// Adds a single 8x8 "brick" to a grid array
function AddSingleBrick(targetGrid, x, y, colorIndex, isStatic) {
    let brickData = isStatic ? staticbrick : brick;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (y - row < 0) continue;
            let brightness = map(brickData[row][col], 0, 2, 0.6, 1);
            let saturation = 0.9 - (isStatic / 3);
            let rgb = HSVtoRGB(cols[colorIndex] / 360, saturation, brightness);
            // [colorId, r, g, b, visited_flag, is_static_flag]
            targetGrid[y - row][x + col] = [colorIndex, rgb.r, rgb.g, rgb.b, 0, isStatic];
        }
    }
}

// Renders a 2D array of color data to a p5.Image object
function renderFromArray(sourceGrid, targetImage) {
    let gridHeight = sourceGrid.length;
    let gridWidth = sourceGrid[0].length;
    targetImage.loadPixels();
    for (let r = 0; r < gridHeight; r++) {
        for (let c = 0; c < gridWidth; c++) {
            let index = (r * gridWidth + c) * 4;
            let pixel = sourceGrid[r][c];
            if (pixel == null) {
                targetImage.pixels[index] = 0;
                targetImage.pixels[index + 1] = 0;
                targetImage.pixels[index + 2] = 0;
                targetImage.pixels[index + 3] = 0; // Transparent
            } else {
                targetImage.pixels[index] = pixel[1]; // R
                targetImage.pixels[index + 1] = pixel[2]; // G
                targetImage.pixels[index + 2] = pixel[3]; // B
                targetImage.pixels[index + 3] = 255; // Opaque
            }
        }
    }
    targetImage.updatePixels();
}

// ==========================================================
// Sand Physics and Line Clearing
// ==========================================================

// Updates a single cell based on falling sand rules
function updateLogic(c, r) {
    if (grid[r][c] == null) return;

    grid[r][c][4] = 0; // Reset visited flag

    if (r >= rows - 1) return; // At the bottom

    // Fall straight down
    if (grid[r + 1][c] == null) {
        grid[r + 1][c] = grid[r][c];
        grid[r][c] = null;
        return;
    }

    if (grid[r][c][5]) return; // Is static, doesn't slide

    // Check diagonal spots
    let canFallLeft = c > 0 && grid[r + 1][c - 1] == null;
    let canFallRight = c < columns - 1 && grid[r + 1][c + 1] == null;

    if (canFallLeft && canFallRight) {
        // Fall randomly left or right
        if (random() < 0.5) {
            grid[r + 1][c - 1] = grid[r][c];
        } else {
            grid[r + 1][c + 1] = grid[r][c];
        }
        grid[r][c] = null;
    } else if (canFallLeft) {
        grid[r + 1][c - 1] = grid[r][c];
        grid[r][c] = null;
    } else if (canFallRight) {
        grid[r + 1][c + 1] = grid[r][c];
        grid[r][c] = null;
    }
}

// Iterates through the grid to apply sand physics
function updateGrid() {
    // Alternate scan direction to prevent bias
    if (t % 4 == 0) {
        for (let r = rows - 1; r >= 0; r--) {
            for (let c = 0; c < columns; c++) {
                updateLogic(c, r);
            }
        }
    } else if (t % 4 == 2) {
        for (let r = rows - 1; r >= 0; r--) {
            for (let c = columns - 1; c >= 0; c--) {
                updateLogic(c, r);
            }
        }
    }
}

// Checks for a full horizontal line of the same color
function checkLine() {
    vis = [];
    for (let r = 0; r < rows; r++) {
        vis = [];
        fullLine = false;
        if (grid[r][0] == null || grid[r][0][4] == 1) continue;
        // Start flood fill from the left edge
        floodFill(0, r, grid[r][0][0]);
        if (fullLine) return; // Found a line to clear
    }
}

// Flood fill algorithm to find connected pixels of the same color
function floodFill(c, r, colorId) {
    if (c < 0 || c >= columns || r < 0 || r >= rows ||
        grid[r][c] == null || grid[r][c][4] == 1 || grid[r][c][0] != colorId) {
        return;
    }
    if (c == columns - 1) {
        fullLine = true; // Reached the right edge
    }
    grid[r][c][4] = 1; // Mark as visited
    vis.push([c, r]);

    floodFill(c + 1, r, colorId);
    floodFill(c - 1, r, colorId);
    floodFill(c, r + 1, colorId);
    floodFill(c, r - 1, colorId);
}

// Animates the line that is being cleared
function setLineColor(time) {
    let val = 255;
    if (time % 10 < 5) {
        val = 0;
    }
    for (let cell of vis) {
        grid[cell[1]][cell[0]][1] = val;
        grid[cell[1]][cell[0]][2] = val;
        grid[cell[1]][cell[0]][3] = val;
    }
}

// Deletes the cleared line from the grid
function deleteLine() {
    for (let cell of vis) {
        grid[cell[1]][cell[0]] = null;
    }
    score += vis.length;
    vis = [];
}


// ==========================================================
// UI, Controls, and Display
// ==========================================================

function UI() {
    renderFromArray(grid, buff);

    // Draw background and grid
    noStroke();
    background(gameBG[0], gameBG[1], gameBG[2]);
    fill(gridBG[0], gridBG[1], gridBG[2]);
    rect(0, 0, columns * scl, rows * scl);
    image(buff, 0, 0, columns * scl, rows * scl);

    // Draw player block if active
    if (!gameOver && !placed) {
        playerBlock.show();
    }

    // Draw "Next Block" area
    fill(gridBG[0], gridBG[1], gridBG[2]);
    rect(nextOffset, gameOffset * 2, gameOffset * 10, gameOffset * 10);
    image(
        nextBlock.sprite,
        nextOffset + (5 - (blockWidth[nextBlock.type][0] + 1)) * gameOffset,
        (5 - (6 - blockHeight[nextBlock.type][0]) + 1) * gameOffset,
        32 * scl,
        32 * scl
    );

    // Draw Score, Time, etc.
    let minutes = floor(t / 3600); // 60fps * 60s
    let seconds = floor(t / 60) % 60;
    if (minutes < 10) minutes = "0" + minutes;
    if (seconds < 10) seconds = "0" + seconds;
    timeText = minutes + ":" + seconds;

    fill(230);
    stroke(0);
    strokeWeight(8);
    textSize(32);

    text(timeText, nextOffset - 2, gameOffset * 16);
    text("LINES:", nextOffset - 2, gameOffset * 19);
    text(linesCleared, nextOffset - 2, gameOffset * 21);
    text("SCORE:", nextOffset - 2, gameOffset * 24);
    text(score, nextOffset - 2, gameOffset * 26);
    text("LEVEL:", nextOffset - 2, gameOffset * 29);
    text(difficulty, nextOffset - 2, gameOffset * 31);
}

function keyPressed() {
    if (keyCode === 80) { // 'P' for pause
        if (gameOver) return;
        if (paused) {
            lpfilter.freq(10000); // Remove filter
        } else {
            lpfilter.freq(200); // Apply filter
        }
        paused = !paused;
        pauseScreen.open = !pauseScreen.open;
    }
}

function setButton(buttonName, isPressed) {
    btnControls[buttonName] = isPressed;
}

// ==========================================================
// Volume and UI Toggles
// ==========================================================

function SFXvolume(val) {
    let volume = val / 10;
    placeSound.setVolume(volume / 2);
    lineSound.setVolume(volume / 2);
    sfxSlider1.value = val;
    sfxSlider2.value = val;
}

function MUSvolume(val) {
    let volume = val / 10;
    gameMusic.setVolume(volume / 2);
    musSlider1.value = val;
    musSlider2.value = val;
}

function toggleAbout() {
    aboutScreen.open = !aboutScreen.open;
    startScreen.open = !startScreen.open;
}

function gameOverScore() {
    gameoverText.innerHTML = '';
    gameoverText.innerHTML += "SCORE: " + score;
    gameoverText.innerHTML += " LINES: " + linesCleared;
}

function shareText() {
    let text = '';
    let levelStr = difficulty.toString();
    let linesStr = linesCleared.toString();
    let scoreStr = score.toString();

    text += `LEVEL: ${levelStr}${' '.repeat(6 - levelStr.length)}| `;
    text += `LINES: ${linesStr}${' '.repeat(6 - linesStr.length)}\n`;
    text += `SCORE: ${scoreStr}${' '.repeat(9 - scoreStr.length)}| `;
    text += `TIME: ${timeText}${' '.repeat(7 - timeText.length)}\n`;
    text += "Play now at https://sandtris.com/";

    navigator.clipboard.writeText(text);
    alert("Share Text Copied to Clipboard!");
}


// ==========================================================
// Backend and Leaderboard Functions
// ==========================================================

async function generateScoreHash(userId, name, score, duration, timestamp) {
    const data = `${userId}:${name}:${score}:${duration}:${timestamp}`;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return `${hashHex}|${t}`; // Include frame count as a nonce
    } catch (error) {
        console.error("Error generating score hash:", error);
        return null;
    }
}

function handleReturnMessage(response) {
    let responseBox = document.getElementById('responseBox');
    if (response.hasOwnProperty('message')) {
        responseBox.innerHTML = response.message;
        return;
    }
    responseBox.innerHTML = response.error;
    scoreSubmitted = false;
}

function submitScore() {
    if (scoreSubmitted) return;
    scoreSubmitted = true;
    responseBox.innerHTML = "Sending score...";

    const name = document.getElementById('name').value;
    const finalScore = score;
    const finalTime = timeText;
    const timestamp = new Date().toISOString();

    generateScoreHash(userId, name, finalScore, finalTime, timestamp).then(hash => {
        fetch(lbUrl + '/submit_score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    name: name,
                    score: finalScore,
                    duration: finalTime,
                    timestamp: timestamp,
                    hash: hash
                })
            })
            .then(response => response.json())
            .then(data => {
                handleReturnMessage(data);
                loadLeaderboard();
            })
            .catch(error => console.error(error));
    }).catch(error => console.error(error));
}

function loadLeaderboard() {
    fetch(lbUrl + '/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId })
    })
    .then(response => response.json())
    .then(data => {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';
        const leaderboard = data.leaderboard;
        const bestUserScore = data.bestUserScore;

        leaderboard.forEach(entry => {
            const row = document.createElement('div');
            row.className = `leaderboard ${entry.rank % 2 ? 'leaderboard--gray' : 'leaderboard--black'}`;
            row.innerHTML = `
                <p>${entry.rank}.</p>
                <div class="namescore">
                    <p>${entry.name}</p>
                    <p>${entry.score}</p>
                </div>
            `;
            list.appendChild(row);
        });

        const bestScoreEntry = document.getElementById('bestScoreEntry');
        bestScoreEntry.innerHTML = `
            <p>${bestUserScore.rank ?? '?'}.</p>
            <div class="namescore">
                <p>${bestUserScore.name ?? '???'}</p>
                <p>${bestUserScore.score ?? '???'}</p>
            </div>
        `;
    })
    .catch(error => console.error(error));
}


// ==========================================================
// Utility Functions
// ==========================================================

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value}; expires=${d.toUTCString()}; path=/`;
}

function generateUserId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function HSVtoRGB(h, s, v) {
    let r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s; v = h.v; h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}
