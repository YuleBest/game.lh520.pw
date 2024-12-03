// 游戏配置
const config = {
    lives: 3,
    speed: 1,
    baseScore: 10,
    powerUpDuration: 5000,
    boardSize: 20,
    aiEnabled: false
};

// 游戏状态
let snake = [{x: 10, y: 10}];
let food = { x: 15, y: 15 };
let powerUp = null;
let direction = { x: 1, y: 0 };
let score = 0;
let gameLoop;
let powerUpTimeout;
let isPaused = false;
let gameStarted = false;
let gameTime = 0; // 添加游戏时间计数器
let timeInterval; // 添加时间间隔计时器

// 初始化游戏
function initGame() {
    // 创建游戏棋盘
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';
    
    // 创建格子
    for (let i = 0; i < config.boardSize * config.boardSize; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        board.appendChild(cell);
    }

    // 初始化游戏状态
    snake = [{x: 10, y: 10}];
    direction = { x: 0, y: 0 };
    score = 0;
    config.lives = 3;
    config.speed = 1;
    createFood();
    
    // 更新显示
    updateStatus();
    updateGameBoard();
}

function resetGame() {
    snake = [{x: 10, y: 10}];
    direction = { x: 0, y: 0 };
    score = 0;
    config.lives = 3;
    config.speed = 1;
    gameTime = 0; // 重置游戏时间
    createFood();
    updateStatus();
    
    if (gameLoop) clearInterval(gameLoop);
    if (timeInterval) clearInterval(timeInterval);
    
    isPaused = false;
    gameStarted = false;
    updateGameBoard();
}

function startGame() {
    if (gameLoop) clearInterval(gameLoop);
    if (timeInterval) clearInterval(timeInterval);
    
    resetGame();
    gameStarted = true;
    direction = { x: 0, y: 0 };
    gameTime = 0; // 重置游戏时间
    
    // 启动时间计数器
    timeInterval = setInterval(() => {
        if (!isPaused && gameStarted) {
            gameTime++;
            updateSpeed();
            updateStatus();
        }
    }, 1000);
    
    startGameLoop();
    isPaused = false;
    updateGameBoard();
}

function togglePause() {
    isPaused = !isPaused;
    const pauseBtn = document.querySelector('.btn:nth-child(2)');
    pauseBtn.textContent = isPaused ? '继续' : '暂停';
}

function startGameLoop() {
    if (gameLoop) clearInterval(gameLoop);
    // 速度越高，间隔时间越短
    const interval = 200 - (config.speed - 1) * 30; // 200ms到80ms之间线性变化
    gameLoop = setInterval(() => {
        if (!isPaused && gameStarted) {
            moveSnake();
            updateGameBoard();
        }
    }, interval);
}

function moveSnake() {
    // 如果游戏还没开始或者暂停，直接返回
    if (!gameStarted || isPaused) {
        return;
    }

    // 如果没有方向，不移动
    if (direction.x === 0 && direction.y === 0) {
        return;
    }

    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    // 检查碰撞
    if (checkCollision(head)) {
        handleCollision();
        return;
    }

    snake.unshift(head);

    // 检查食物
    if (head.x === food.x && head.y === food.y) {
        handleFoodCollect();
    } else if (powerUp && head.x === powerUp.x && head.y === powerUp.y) {
        handlePowerUpCollect();
    } else {
        snake.pop();
    }

    updateGameBoard();
}

function handleCollision() {
    config.lives--;
    updateStatus();

    if (config.lives <= 0) {
        gameOver();
    } else {
        // 重置蛇的位置但保持其他状态
        snake = [{x: 10, y: 10}];
        direction = { x: 0, y: 0 };
        updateGameBoard();
    }
}

function handleFoodCollect() {
    score += config.baseScore;
    createFood();
    updateStatus();

    // 每吃3个食物增加速度
    if (score % (config.baseScore * 3) === 0) {
        config.speed++;
        startGameLoop();
    }

    // 随机生成道具
    if (Math.random() < 0.3 && !powerUp) { // 30%概率生成道具
        spawnPowerUp();
    }
}

function createFood() {
    do {
        food = {
            x: Math.floor(Math.random() * config.boardSize),
            y: Math.floor(Math.random() * config.boardSize)
        };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y) ||
             (powerUp && food.x === powerUp.x && food.y === powerUp.y));
}

function spawnPowerUp() {
    const types = ['speed', 'shield', 'score'];
    do {
        powerUp = {
            x: Math.floor(Math.random() * config.boardSize),
            y: Math.floor(Math.random() * config.boardSize),
            type: types[Math.floor(Math.random() * types.length)]
        };
    } while (snake.some(segment => segment.x === powerUp.x && segment.y === powerUp.y) ||
             (food.x === powerUp.x && food.y === powerUp.y));

    // 道具持续时间
    setTimeout(() => {
        powerUp = null;
        updateGameBoard();
    }, 10000); // 10秒后消失
}

function handlePowerUpCollect() {
    switch(powerUp.type) {
        case 'speed':
            activateSpeedBoost();
            break;
        case 'shield':
            activateShield();
            break;
        case 'score':
            score += config.baseScore * 5;
            updateStatus();
            break;
    }
    powerUp = null;
}

// 更新游戏状态显示
function updateStatus() {
    document.getElementById('lives').textContent = config.lives;
    document.getElementById('speed').textContent = config.speed;
    document.getElementById('score').textContent = score;
    // 如果有显示时间的元素，也更新它
    const timeElement = document.getElementById('time');
    if (timeElement) {
        timeElement.textContent = gameTime;
    }
}

// 更新游戏棋盘显示
function updateGameBoard() {
    const cells = document.getElementsByClassName('cell');
    
    // 清除所有格子的状态
    Array.from(cells).forEach(cell => {
        cell.className = 'cell';
    });

    // 绘制蛇
    snake.forEach((segment, index) => {
        const cellIndex = segment.y * config.boardSize + segment.x;
        const cell = cells[cellIndex];
        if (cell) {
            cell.classList.add('snake');
            if (index === 0) cell.classList.add('snake-head');
        }
    });

    // 绘制食物
    const foodCell = cells[food.y * config.boardSize + food.x];
    if (foodCell) {
        foodCell.classList.add('food');
    }

    // 绘制道具
    if (powerUp) {
        const powerUpCell = cells[powerUp.y * config.boardSize + powerUp.x];
        if (powerUpCell) {
            powerUpCell.classList.add('power-up', powerUp.type);
        }
    }
}

// 碰撞检测
function checkCollision(head, isPlayer = true) {
    // 如果游戏还没开始，不进行碰撞检测
    if (!gameStarted) {
        return false;
    }

    // 检查是否撞墙
    if (head.x < 0 || head.x >= config.boardSize || 
        head.y < 0 || head.y >= config.boardSize) {
        if (isPlayer) {
            config.lives = 0;
            gameOver();
        }
        return true;
    }

    // 检查自身碰撞（跳过蛇头）
    return snake.slice(1).some(segment => 
        segment.x === head.x && segment.y === head.y
    );
}

// 游戏结束处理
function gameOver() {
    clearInterval(gameLoop);
    clearInterval(timeInterval); // 清除时间计时器
    gameStarted = false;
    
    const toast = document.createElement('div');
    toast.className = 'toast toast-top toast-center z-50';
    toast.style.position = 'fixed';
    toast.innerHTML = `
        <div class="alert alert-error">
            <span>游戏结束！最终得分：${score}，游戏时间：${gameTime}秒</span>
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
        resetGame();
    }, 3000);
}

// 速度提升道具效果
function activateSpeedBoost() {
    const originalSpeed = config.speed;
    config.speed *= 2;
    startGameLoop();

    // 添加视觉效果
    const board = document.getElementById('gameBoard');
    board.classList.add('speed-boost');

    setTimeout(() => {
        config.speed = originalSpeed;
        startGameLoop();
        board.classList.remove('speed-boost');
    }, config.powerUpDuration);
}

// 护盾道具效果
function activateShield() {
    const shield = document.createElement('div');
    shield.className = 'shield-effect';
    document.getElementById('gameBoard').appendChild(shield);

    const originalCheckCollision = checkCollision;
    checkCollision = () => false;

    setTimeout(() => {
        checkCollision = originalCheckCollision;
        shield.remove();
    }, config.powerUpDuration);
}

// 方向控制函数
function handleDirection(dir) {
    if (!gameStarted || isPaused) return;

    let newDirection;
    switch(dir) {
        case 'up':
            newDirection = { x: 0, y: -1 };
            break;
        case 'down':
            newDirection = { x: 0, y: 1 };
            break;
        case 'left':
            newDirection = { x: -1, y: 0 };
            break;
        case 'right':
            newDirection = { x: 1, y: 0 };
            break;
    }

    if (newDirection && isValidDirection(newDirection)) {
        direction = newDirection;
    }
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    // 阻止箭头键滚动页面
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault(); // 阻止默认行为
    }

    if (!gameStarted || isPaused) return;

    // 处理暂停键
    if (e.key === ' ') {
        togglePause();
        return;
    }

    // 方向键映射
    const directionMap = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right'
    };

    const dir = directionMap[e.key];
    if (dir) {
        handleDirection(dir);
    }
});

// 触摸控制
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchmove', function(e) {
    if (!touchStartX || !touchStartY) return;

    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    // 需要一定的移动距离才触发方向改变
    const minSwipeDistance = 30;

    if (Math.abs(dx) > minSwipeDistance || Math.abs(dy) > minSwipeDistance) {
        if (Math.abs(dx) > Math.abs(dy)) {
            handleDirection(dx > 0 ? 'right' : 'left');
        } else {
            handleDirection(dy > 0 ? 'down' : 'up');
        }
        // 更新起始点，避免连续触发
        touchStartX = touchEndX;
        touchStartY = touchEndY;
    }
});

document.addEventListener('touchend', function() {
    touchStartX = 0;
    touchStartY = 0;
});

// 优化移动端控制按钮
function initMobileControls() {
    const controls = document.querySelector('.game-controls');
    if (!controls) return;

    controls.style.width = '100%';
    controls.style.maxWidth = '300px';
    controls.style.margin = '1rem auto';
    
    const buttons = controls.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.style.width = '60px';
        btn.style.height = '60px';
        btn.style.fontSize = '24px';
    });
}

// 在初始化时调用移动端控制优化
document.addEventListener('DOMContentLoaded', function() {
    initGame();
    initMobileControls();
});

// 添加 isValidDirection 函数
function isValidDirection(newDir) {
    // 如果蛇长度为1，允许任意方向移动
    if (snake.length === 1) return true;
    
    // 不允许反向移动
    if (direction.x !== 0 && newDir.x === -direction.x) return false;
    if (direction.y !== 0 && newDir.y === -direction.y) return false;
    
    return true;
}

// 添加更新速度的函数
function updateSpeed() {
    // 每60秒增加1点速度，最高5
    const newSpeed = Math.min(5, 1 + Math.floor(gameTime / 60));
    if (newSpeed !== config.speed) {
        config.speed = newSpeed;
        startGameLoop(); // 重新设置游戏循环以更新速度
    }
}

// 添加新函数用于更新按钮状态
function updateButtonsState() {
    const startButton = document.querySelector('button[onclick="startGame()"]');
    if (startButton) {
        startButton.style.display = gameStarted ? 'none' : 'inline-flex';
    }
} 