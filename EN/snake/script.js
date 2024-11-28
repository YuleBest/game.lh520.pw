const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const startButton = document.getElementById('start-game');

let snake = [];
let aiSnakes = [];
let direction = { x: 10, y: 0 };
let foods = []; // Normal food array
let specialFoods = []; // Special food array
let obstacles = [];
let score = 0;
let time = 0;
let lives = 3;
let timerStarted = false;
let snakeMoveInterval;
let aiInterval;
let timeInterval;
let scoreChangeEffects = [];
let lifePotion = {};
let speedPotion = {};
let slowPotion = {};
let baseSpeed = 100; // Base movement speed (milliseconds)
let currentSpeed = baseSpeed;
let aiSnakeLives = {}; // Store AI snake lives
let isInvincible = false;
let invincibleTimer = null;
let invincibleTimeLeft = 0;

// Add touch control variables
let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 30;

// Initialize the game
function initializeGame() {
    // Remove previous event listeners
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);
    
    snake = [{ x: 100, y: 100 }];
    aiSnakes = [createAISnake(), createAISnake()];
    direction = { x: 0, y: 0 };
    
    // Initialize food arrays
    foods = Array(6).fill().map(() => getRandomPosition());
    specialFoods = Array(3).fill().map(() => getRandomPosition());
    
    currentSpeed = baseSpeed;
    lifePotion = Math.random() < 0.3 ? getRandomPosition() : null;
    speedPotion = Math.random() < 0.6 ? getRandomPosition() : null;
    slowPotion = Math.random() < 0.6 ? getRandomPosition() : null;
    obstacles = generateObstacles(5);
    score = 0;
    lives = 3;
    time = 0;
    timerStarted = false;

    isInvincible = false;
    if (invincibleTimer) {
        clearInterval(invincibleTimer);
        invincibleTimer = null;
    }
    invincibleTimeLeft = 0;

    updateDisplay();

    clearInterval(snakeMoveInterval);
    clearInterval(aiInterval);
    clearInterval(timeInterval);

    snakeMoveInterval = setInterval(updateSnakePosition, currentSpeed);
    aiInterval = setInterval(moveAISnakes, currentSpeed * 2);
    draw();

    // Add touch control to the canvas
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
}

// Update display
function updateDisplay() {
    scoreDisplay.textContent = score;
    timeDisplay.textContent = `${time}`;
    
    // Update life display
    const livesDisplay = Array(lives).fill('<i class="fas fa-heart" style="color: #ff7aa0;"></i>').join(' ');
    document.getElementById('lives-board').innerHTML = livesDisplay;
    
    // Update speed display (modified to multiplier display)
    const speedMultiplier = (baseSpeed / currentSpeed).toFixed(2);
    document.getElementById('speed-display').textContent = speedMultiplier;
}

// Get random position
function getRandomPosition() {
    return {
        x: Math.floor(Math.random() * (canvas.width / 10)) * 10,
        y: Math.floor(Math.random() * (canvas.height / 10)) * 10
    };
}

// Get random direction
function getRandomDirection() {
    const directions = [{ x: 10, y: 0 }, { x: -10, y: 0 }, { x: 0, y: 10 }, { x: 0, y: -10 }];
    return directions[Math.floor(Math.random() * directions.length)];
}

// Create random AI snake
function createAISnake() {
    const id = Math.random().toString(36).substr(2, 9); // Generate unique ID
    aiSnakeLives[id] = 1; // Set AI's life to 1
    return {
        id: id,
        body: [getRandomPosition()],
        direction: getRandomDirection(),
        color: getRandomColor(),
    };
}

// Random color
function getRandomColor() {
    // Use soft colors, avoiding yellow, red, and black
    const colors = [
        '#3498db', // Blue
        '#9b59b6', // Purple
        '#1abc9c', // Light green
        '#16a085', // Dark green
        '#27ae60', // Deep green
        '#8e44ad'  // Dark purple
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Generate obstacles
function generateObstacles(count) {
    const obs = [];
    for (let i = 0; i < count; i++) {
        obs.push(getRandomPosition());
    }
    return obs;
}

// AI snake movement logic
function moveAISnakes() {
    aiSnakes = aiSnakes.filter(aiSnake => aiSnakeLives[aiSnake.id] > 0);
    
    aiSnakes.forEach(aiSnake => {
        const head = {
            x: aiSnake.body[0].x + aiSnake.direction.x,
            y: aiSnake.body[0].y + aiSnake.direction.y
        };
        let shouldGrow = false;

        // Check if AI snake hits other AI snakes
        const hitOtherAI = aiSnakes.some(otherSnake => 
            otherSnake !== aiSnake && 
            otherSnake.body.some(segment => segment.x === head.x && segment.y === head.y)
        );

        // Check if AI snake hits player snake
        const hitPlayer = snake.some(segment => segment.x === head.x && segment.y === head.y);

        // Check if food is eaten
        if (foods.some(food => food.x === head.x && food.y === head.y)) {
            shouldGrow = true;
            const foodIndex = foods.findIndex(food => food.x === head.x && food.y === head.y);
            foods[foodIndex] = getRandomPosition();
        } else if (specialFoods.some(food => food.x === head.x && food.y === head.y)) {
            shouldGrow = true;
            const specialFoodIndex = specialFoods.findIndex(food => food.x === head.x && food.y === head.y);
            specialFoods[specialFoodIndex] = getRandomPosition();
        }

        if (checkCollision(head, false) || hitOtherAI || Math.random() < 0.2) {
            aiSnake.direction = getRandomDirection();
        } else if (hitPlayer) {
            aiSnakeLives[aiSnake.id] = 0;
            aiSnake.body.forEach(segment => {
                score += 50;
                showScoreChange(50, canvas.offsetLeft + segment.x, canvas.offsetTop + segment.y);
                specialFoods[specialFoods.findIndex(food => food.x === head.x && food.y === head.y)] = segment;
            });
        } else {
            aiSnake.body.unshift(head);
            if (!shouldGrow) {
                aiSnake.body.pop();
            }
        }
    });
    draw();
}

// Update player snake position
function updateSnakePosition() {
    if (direction.x === 0 && direction.y === 0) return;

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    let shouldGrow = false; // Add flag to determine if growth is needed

    if (checkCollision(head)) {
        if (lives <= 0) {
            clearInterval(snakeMoveInterval);
            clearInterval(aiInterval);
            clearInterval(timeInterval);
        }
        return;
    }

    // Check if speed potion is eaten
    if (speedPotion && head.x === speedPotion.x && head.y === speedPotion.y) {
        currentSpeed = baseSpeed * 0.75;
        clearInterval(snakeMoveInterval);
        snakeMoveInterval = setInterval(updateSnakePosition, currentSpeed);
        showScoreChange("⚡Speed +25%", canvas.offsetLeft + head.x, canvas.offsetTop + head.y);
        speedPotion = null;
        setTimeout(() => {
            currentSpeed = baseSpeed;
            clearInterval(snakeMoveInterval);
            snakeMoveInterval = setInterval(updateSnakePosition, currentSpeed);
            showScoreChange("⚡Speed restored", canvas.offsetLeft + head.x, canvas.offsetTop + head.y);
        }, 5000);
    }

    // Check if life potion is eaten
    if (lifePotion && head.x === lifePotion.x && head.y === lifePotion.y) {
        lives++;
        showScoreChange("❤️+1", canvas.offsetLeft + head.x, canvas.offsetTop + head.y);
        lifePotion = null;
    }

    // Check if slow potion is eaten
    if (slowPotion && head.x === slowPotion.x && head.y === slowPotion.y) {
        currentSpeed = baseSpeed * 1.25;
        clearInterval(snakeMoveInterval);
        snakeMoveInterval = setInterval(updateSnakePosition, currentSpeed);
        showScoreChange("🐌Speed -25%", canvas.offsetLeft + head.x, canvas.offsetTop + head.y);
        slowPotion = null;
        setTimeout(() => {
            currentSpeed = baseSpeed;
            clearInterval(snakeMoveInterval);
            snakeMoveInterval = setInterval(updateSnakePosition, currentSpeed);
            showScoreChange("🐌Speed restored", canvas.offsetLeft + head.x, canvas.offsetTop + head.y);
        }, 5000);
    }

    // Check if normal food is eaten
    const foodIndex = foods.findIndex(food => food.x === head.x && food.y === head.y);
    if (foodIndex !== -1) {
        score += 25;
        showScoreChange(25, head.x, head.y);
        foods[foodIndex] = getRandomPosition();
        shouldGrow = true;
    }

    // Check if special food is eaten
    const specialFoodIndex = specialFoods.findIndex(food => food.x === head.x && food.y === head.y);
    if (specialFoodIndex !== -1) {
        score += 100;
        showScoreChange(100, head.x, head.y);
        specialFoods[specialFoodIndex] = getRandomPosition();
        shouldGrow = true;
    }

    // Add new head first
    snake.unshift(head);
    
    // If no food is eaten, remove the tail
    if (!shouldGrow) {
        snake.pop();
    }

    updateDisplay();
    draw();
}

// Collision detection
function checkCollision(head, isPlayer = true) {
    // Check if hit wall
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        if (isPlayer) {
            lives = 0;
            showGameOver();
        }
        return true;
    }
    
    // Check if hit obstacle
    let hitObstacle = false;
    let obstacleIndex = -1;
    
    obstacles.forEach((obs, index) => {
        if (obs.x === head.x && obs.y === head.y) {
            hitObstacle = true;
            obstacleIndex = index;
        }
    });
    
    if (hitObstacle && isPlayer) {
        if (isInvincible) {
            // Hit obstacle within invincible time, directly remove obstacle
            obstacles.splice(obstacleIndex, 1);
            return false;
        }
        lives--;
        obstacles.splice(obstacleIndex, 1);
        showScoreChange(-1, canvas.offsetLeft + head.x, canvas.offsetTop + head.y);
        updateDisplay();
        if (lives <= 0) {
            showGameOver();
            return true;
        }
        // Start invincible time
        startInvincibleTime();
        return false;
    }
    
    if (isPlayer) {
        // Check if hit self
        if (snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
            lives--;
            showScoreChange(-1, canvas.offsetLeft + head.x, canvas.offsetTop + head.y);
            updateDisplay();
            if (lives <= 0) {
                showGameOver();
                return true;
            }
            // Start invincible time
            startInvincibleTime();
            return false;
        }
        
        // Player hits AI snake, kills AI snake and gains points
        aiSnakes.forEach(aiSnake => {
            if (aiSnakeLives[aiSnake.id] > 0 && aiSnake.body.some(segment => segment.x === head.x && segment.y === head.y)) {
                aiSnakeLives[aiSnake.id] = 0;
                // Convert each body part of AI snake to special food
                aiSnake.body.forEach(segment => {
                    score += 50;
                    showScoreChange(50, canvas.offsetLeft + segment.x, canvas.offsetTop + segment.y);
                    specialFoods[specialFoods.findIndex(food => food.x === head.x && food.y === head.y)] = segment;
                });
            }
        });
    }
    
    return false;
}

// Draw all elements
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player snake's trail effect
    snake.forEach((segment, index) => {
        const alpha = (snake.length - index) / snake.length;
        ctx.fillStyle = `rgba(46, 204, 113, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.roundRect(segment.x - 2, segment.y - 2, 14, 14, 4);
        ctx.fill();
    });

    // Draw player snake's entity
    snake.forEach((segment, index) => {
        const isHead = index === 0;
        
        // If invincible, add golden outline
        if (isInvincible) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(segment.x - 1, segment.y - 1, 12, 12, 3);
            ctx.stroke();
        }

        ctx.fillStyle = isHead ? '#27ae60' : '#2ecc71';
        ctx.beginPath();
        ctx.roundRect(segment.x, segment.y, 10, 10, 3);
        ctx.fill();

        if (isHead) {
            ctx.shadowColor = '#2ecc71';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(segment.x, segment.y, 10, 10, 3);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });

    // If invincible, show remaining time
    if (isInvincible) {
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText(`Invincible: ${invincibleTimeLeft}s`, canvas.width / 2, 30);
        ctx.textAlign = 'left'; // Reset text alignment
    }

    // Draw AI snakes
    aiSnakes.forEach(aiSnake => {
        if (aiSnakeLives[aiSnake.id] > 0) {
            // AI snake's trail effect
            aiSnake.body.forEach((segment, index) => {
                const alpha = (aiSnake.body.length - index) / aiSnake.body.length;
                ctx.fillStyle = `${aiSnake.color}${Math.floor(alpha * 50)}`; // Use hexadecimal transparency
                ctx.beginPath();
                ctx.roundRect(segment.x, segment.y, 10, 10, 3);
                ctx.fill();
            });
        }
    });

    // Draw all normal food
    ctx.fillStyle = '#f1c40f';
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 10;
    foods.forEach(food => {
        ctx.beginPath();
        ctx.roundRect(food.x, food.y, 10, 10, 3);
        ctx.fill();
    });

    // Draw special food
    ctx.fillStyle = '#e74c3c';
    ctx.shadowColor = '#e74c3c';
    specialFoods.forEach(food => {
        ctx.beginPath();
        ctx.roundRect(food.x, food.y, 10, 10, 3);
        ctx.fill();
    });

    // Draw life potion
    if (lifePotion) {
        ctx.font = '10px Arial';
        ctx.fillText('❤️', lifePotion.x - 1, lifePotion.y + 8);
    }

    // Draw speed potion
    if (speedPotion) {
        ctx.font = '10px Arial';
        ctx.fillText('⚡', speedPotion.x - 1, speedPotion.y + 8);
    }

    // Draw slow potion
    if (slowPotion) {
        ctx.font = '10px Arial';
        ctx.fillText('🐌', slowPotion.x - 1, slowPotion.y + 8);
    }

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw obstacles
    ctx.fillStyle = '#34495e';
    obstacles.forEach(obs => {
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, 10, 10, 3);
        ctx.fill();
    });
}

// Add touch guide overlay
function showTouchGuide() {
    const guide = document.createElement('div');
    guide.className = 'touch-guide';
    guide.innerHTML = `
        <div class="guide-overlay">
            <div class="guide-area up">
                <i class="fas fa-chevron-up"></i>
                <span>Up swipe area</span>
            </div>
            <div class="guide-area right">
                <i class="fas fa-chevron-right"></i>
                <span>Right swipe area</span>
            </div>
            <div class="guide-area down">
                <i class="fas fa-chevron-down"></i>
                <span>Down swipe area</span>
            </div>
            <div class="guide-area left">
                <i class="fas fa-chevron-left"></i>
                <span>Left swipe area</span>
            </div>
            <div class="guide-center">
                <span>Tap anywhere to start</span>
            </div>
        </div>
    `;
    document.body.appendChild(guide);

    guide.addEventListener('click', () => {
        guide.remove();
        localStorage.setItem('snakeGameGuideShown', 'true');
    });
}

// Check if mobile device
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

startButton.addEventListener('click', () => {
    showGameIntro();
});

window.addEventListener('load', () => {
    showGameIntro();
});

// Modify game over popup function
function showGameOver() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 25px;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        text-align: center;
        z-index: 1000;
        border: 1px solid rgba(255, 158, 181, 0.2);
        min-width: 280px;
    `;

    // Calculate score per second
    const scorePerSecond = time > 0 ? Math.round((score / time) * 10) / 10 : score;

    modal.innerHTML = `
        <h2 style="
            color: var(--primary-dark);
            margin: 0 0 20px 0;
            font-size: 1.5rem;
        ">Game Over</h2>
        
        <div style="
            margin: 15px 0;
            padding: 15px;
            background: var(--background-color);
            border-radius: var(--border-radius);
        ">
            <p style="margin: 8px 0;">
                <i class="fas fa-star" style="color: var(--primary-color);"></i>
                Final Score: ${score}
            </p>
            <p style="margin: 8px 0;">
                <i class="fas fa-clock" style="color: var(--primary-color);"></i>
                Game Time: ${time}s
            </p>
            <p style="margin: 8px 0;">
                <i class="fas fa-tachometer-alt" style="color: var(--primary-color);"></i>
                Score/Second: ${scorePerSecond}
            </p>
            <p style="margin: 8px 0;">
                <i class="fas fa-heart" style="color: var(--primary-color);"></i>
                Lives Left: ${lives}
            </p>
        </div>

        <div style="
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
        ">
            <button onclick="location.reload()" style="
                padding: 12px 20px;
                border-radius: var(--border-radius);
                background: var(--primary-color);
                color: white;
                border: none;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <i class="fas fa-redo"></i>
                Restart
            </button>
            
            <button onclick="window.location.href='https://lh520.pw/'" style="
                padding: 12px 20px;
                border-radius: var(--border-radius);
                background: var(--secondary-color);
                color: white;
                border: none;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <i class="fas fa-home"></i>
                Home
            </button>
        </div>
    `;

    // Add button hover effect
    const buttons = modal.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mouseover', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(255, 158, 181, 0.3)';
        });
        
        button.addEventListener('mouseout', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });

    document.body.appendChild(modal);
}

// Modify showScoreChange function
function showScoreChange(amount, x, y) {
    const gameCanvas = document.getElementById('gameCanvas');
    const rect = gameCanvas.getBoundingClientRect();
    
    // Calculate the position 20 pixels above the snake head
    const offsetY = -20; // Offset up by 20 pixels
    
    const effect = document.createElement('div');
    effect.className = 'score-change';
    effect.textContent = amount > 0 ? `+${amount}` : amount;
    effect.style.cssText = `
        position: fixed;
        left: ${rect.left + x}px;
        top: ${rect.top + y + offsetY}px; // Add upward offset
        color: ${amount > 0 ? '#2ecc71' : '#e74c3c'};
        font-weight: bold;
        font-size: 20px;
        pointer-events: none;
        animation: floatUp 1s ease-out forwards;
        z-index: 1000;
    `;
    document.body.appendChild(effect);
    
    setTimeout(() => effect.remove(), 1000);
}

// Add player collision handling function
function handlePlayerCollision() {
    lives--;
    updateDisplay();
    
    if (lives <= 0) {
        showGameOver();
        return true;
    } else {
        // Use snake head position to display life decrease hint
        const head = snake[0];
        showScoreChange(-1, head.x, head.y);
        snake = [{ x: 100, y: 100 }];
        direction = { x: 0, y: 0 };
    }
    return false;
}

// Add invincible time start function
function startInvincibleTime() {
    isInvincible = true;
    invincibleTimeLeft = 5;
    
    // Clear previous timers
    if (invincibleTimer) {
        clearInterval(invincibleTimer);
    }
    
    // Create new timers
    invincibleTimer = setInterval(() => {
        invincibleTimeLeft--;
        if (invincibleTimeLeft <= 0) {
            isInvincible = false;
            clearInterval(invincibleTimer);
            invincibleTimer = null;
        }
    }, 1000);
}

// Add share function
document.getElementById('share-game').addEventListener('click', async () => {
    const url = 'https://lh520.pw/Snake Battle/';
    
    try {
        // Try using the new clipboard API
        await navigator.clipboard.writeText(url);
        
        // Create a temporary toast element
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1000;
            animation: fadeInOut 2s ease-in-out forwards;
        `;
        toast.textContent = 'Link copied to clipboard!';
        document.body.appendChild(toast);

        // Remove toast after 2 seconds
        setTimeout(() => {
            toast.remove();
        }, 2000);
    } catch (err) {
        // If clipboard API is not available, use traditional method
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert('Link copied to clipboard!');
    }
});

// Add fade in/out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, 20px); }
        20% { opacity: 1; transform: translate(-50%, 0); }
        80% { opacity: 1; transform: translate(-50%, 0); }
        100% { opacity: 0; transform: translate(-50%, -20px); }
    }
`;
document.head.appendChild(style);

// Modify game rules text
function updateGameRules() {
    const rulesContent = document.querySelector('.rules-content');
    rulesContent.innerHTML = `
        <p>• PC: Arrow keys to move</p>
        <p>• Mobile: Swipe to control direction</p>
        <p>• Press R: Quick restart</p>
        <p>• Hit wall/Killed by AI: Instant death</p>
        <p>• Hit self/obstacles: Lose 1 life</p>
        <p>• Kill AI snake: 50 points/segment</p>
        <p>• 5s invincible after injury</p>
    `;
}

// Add keyboard control event listener
document.addEventListener('keydown', (e) => {
    const directions = {
        ArrowUp: { x: 0, y: -10 },
        ArrowDown: { x: 0, y: 10 },
        ArrowLeft: { x: -10, y: 0 },
        ArrowRight: { x: 10, y: 0 }
    };

    // Get the current key's direction
    const newDirection = directions[e.key];

    // Check if direction change is allowed
    if (newDirection && isValidDirection(newDirection)) {
        direction = newDirection;
        
        // If timer is not started, start timing
        if (!timerStarted) {
            timeInterval = setInterval(() => {
                time++;
                updateDisplay();
            }, 1000);
            timerStarted = true;
        }
    }

    // R key to restart the game
    if (e.key.toLowerCase() === 'r') {
        location.reload();
    }
});

// Listen for keyboard events, prevent arrow keys from scrolling
window.addEventListener('keydown', function(e) {
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (keys.includes(e.key)) {
        e.preventDefault();
    }
});

// Add direction validation function
function isValidDirection(newDir) {
    // If snake length is 1, allow any direction movement
    if (snake.length === 1) return true;
    
    // Check if it's moving in the opposite direction
    return !(
        (newDir.x === -direction.x && newDir.y === direction.y) || 
        (newDir.x === direction.x && newDir.y === -direction.y)
    );
}

// Add the following functions to the file
function showGameIntro() {
    const intro = document.createElement('div');
    intro.className = 'game-intro';
    intro.innerHTML = `
        <div class="game-intro-content">
            <h1 style="color: var(--primary-color); font-size: 3em; margin-bottom: 30px;">
                Greedy Snake Battle
            </h1>
            <div style="text-align: left; margin: 20px auto; max-width: 400px; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
                <h3 style="color: var(--primary-color); margin-bottom: 10px;">Game Rules</h3>
                <p>• PC: Arrow keys to move</p>
                <p>• Mobile: Swipe to control direction</p>
                <p>• Press R: Quick restart</p>
                <p>• Hit wall/Killed by AI: Instant death</p>
                <p>• Hit self/obstacles: Lose 1 life</p>
                <p>• Kill AI snake: 50 points/segment</p>
                <p>• 5s invincible after injury</p>
            </div>
            <button id="start-intro" class="action-btn" style="font-size: 1.5em; padding: 15px 40px;">
                Start Game
            </button>
        </div>
    `;
    document.body.appendChild(intro);
    
    const canvas = document.getElementById('gameCanvas');
    canvas.classList.add('zoomed');
    
    document.getElementById('start-intro').addEventListener('click', () => {
        intro.classList.add('hiding');
        canvas.classList.remove('zoomed');
        setTimeout(() => {
            intro.remove();
            initializeGame();
            
            // Add touch control only to the canvas
            canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
            canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
            canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        }, 500);
    });
}

// Modify touch event handling function
function handleTouchStart(e) {
    // Handle touch events only on the canvas
    if (e.target === canvas) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        touchStartX = touch.clientX - rect.left;
        touchStartY = touch.clientY - rect.top;
    }
}

function handleTouchMove(e) {
    // Prevent default behavior on the canvas
    if (e.target === canvas) {
        e.preventDefault();
    }
}

function handleTouchEnd(e) {
    // Handle touch events only on the canvas
    if (e.target === canvas) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        const touchEndX = touch.clientX - rect.left;
        const touchEndY = touch.clientY - rect.top;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Check if minimum swipe distance is reached
        if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
            return; // Swipe distance too small, ignore
        }
        
        // Determine the main swipe direction
        let newDirection;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            newDirection = deltaX > 0 ? { x: 10, y: 0 } : { x: -10, y: 0 };
        } else {
            // Vertical swipe
            newDirection = deltaY > 0 ? { x: 0, y: 10 } : { x: 0, y: -10 };
        }
        
        // Check if direction change is allowed
        if (isValidDirection(newDirection)) {
            direction = newDirection;
            
            // Start timer
            if (!timerStarted) {
                timeInterval = setInterval(() => {
                    time++;
                    updateDisplay();
                }, 1000);
                timerStarted = true;
            }
        }
    }
}