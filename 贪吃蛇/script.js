const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const startButton = document.getElementById('start-game');
const upButton = document.getElementById('up');
const downButton = document.getElementById('down');
const leftButton = document.getElementById('left');
const rightButton = document.getElementById('right');

let snake = [];
let aiSnakes = [];
let direction = { x: 10, y: 0 };
let food = {};
let specialFood = {};
let obstacles = [];
let score = 0;
let time = 0;
let lives = 3;
let timerStarted = false;
let snakeMoveInterval;
let aiInterval;
let timeInterval;

// 初始化游戏
function initializeGame() {
    snake = [{ x: 100, y: 100 }];
    aiSnakes = [createAISnake(), createAISnake()];
    direction = { x: 0, y: 0 };
    food = getRandomPosition();
    specialFood = getRandomPosition();
    obstacles = generateObstacles(5);
    score = 0;
    lives = 3;
    time = 0;
    timerStarted = false;

    updateDisplay();

    clearInterval(snakeMoveInterval);
    clearInterval(aiInterval);
    clearInterval(timeInterval);

    snakeMoveInterval = setInterval(updateSnakePosition, 100);
    aiInterval = setInterval(moveAISnakes, 200);
    draw();
}

// 更新显示
function updateDisplay() {
    scoreDisplay.textContent = score;
    timeDisplay.textContent = `${time}`;
    const livesDisplay = ''.repeat(lives);
    document.getElementById('lives-board').textContent = livesDisplay;
}

// 获取随机位置
function getRandomPosition() {
    return {
        x: Math.floor(Math.random() * (canvas.width / 10)) * 10,
        y: Math.floor(Math.random() * (canvas.height / 10)) * 10
    };
}

// 获取随机方向
function getRandomDirection() {
    const directions = [{ x: 10, y: 0 }, { x: -10, y: 0 }, { x: 0, y: 10 }, { x: 0, y: -10 }];
    return directions[Math.floor(Math.random() * directions.length)];
}

// 创建随机的 AI 蛇
function createAISnake() {
    return {
        body: [getRandomPosition()],
        direction: getRandomDirection(),
        color: getRandomColor(),
    };
}

// 随机颜色
function getRandomColor() {
    const colors = ['blue', 'orange', 'purple', 'pink'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// 生成障碍物
function generateObstacles(count) {
    const obs = [];
    for (let i = 0; i < count; i++) {
        obs.push(getRandomPosition());
    }
    return obs;
}

// AI 蛇移动逻辑
function moveAISnakes() {
    aiSnakes.forEach(aiSnake => {
        const head = {
            x: aiSnake.body[0].x + aiSnake.direction.x,
            y: aiSnake.body[0].y + aiSnake.direction.y
        };

        if (checkCollision(head) || Math.random() < 0.2) {
            aiSnake.direction = getRandomDirection();
        } else {
            aiSnake.body.unshift(head);
            if (Math.random() < 0.1) aiSnake.body.push({});
            aiSnake.body.pop();
        }
    });
    draw();
}

// 更新玩家蛇位置
function updateSnakePosition() {
    if (direction.x === 0 && direction.y === 0) return;

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    if (checkCollision(head)) {
        clearInterval(snakeMoveInterval);
        clearInterval(aiInterval);
        clearInterval(timeInterval);
        alert(`游戏结束！得分：${score}`);
        location.reload();
        return;
    }

    if (head.x === food.x && head.y === food.y) {
        score += 25;
        food = getRandomPosition();
        snake.push({});
    } else if (head.x === specialFood.x && head.y === specialFood.y) {
        score += 100;
        specialFood = getRandomPosition();
        snake.push({});
    } else {
        snake.pop();
    }

    snake.unshift(head);
    updateDisplay();
    draw();
}

// 碰撞检测
function checkCollision(head) {
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) return true;
    if (snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) return true;
    if (obstacles.some(obs => obs.x === head.x && obs.y === head.y)) return true;
    if (aiSnakes.some(aiSnake => aiSnake.body.some(segment => segment.x === head.x && segment.y === head.y))) return true;

    return false;
}

// 绘制所有元素
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    snake.forEach(segment => {
        ctx.fillStyle = 'green';
        ctx.fillRect(segment.x, segment.y, 10, 10);
    });

    aiSnakes.forEach(aiSnake => {
        aiSnake.body.forEach(segment => {
            ctx.fillStyle = aiSnake.color;
            ctx.fillRect(segment.x, segment.y, 10, 10);
        });
    });

    ctx.fillStyle = 'yellow';
    ctx.fillRect(food.x, food.y, 10, 10);

    ctx.fillStyle = 'red';
    ctx.fillRect(specialFood.x, specialFood.y, 10, 10);

    ctx.fillStyle = 'black';
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, 10, 10);
    });
}

// 监听按钮点击事件，控制方向
upButton.addEventListener('click', () => {
    direction = { x: 0, y: -10 };
    if (!timerStarted) {
        timeInterval = setInterval(() => {
            time++;
            updateDisplay();
        }, 1000);
        timerStarted = true;
    };
});
downButton.addEventListener('click', () => {
    direction = { x: 0, y: 10 };
    if (!timerStarted) {
        timeInterval = setInterval(() => {
            time++;
            updateDisplay();
        }, 1000);
        timerStarted = true;
    };
});
leftButton.addEventListener('click', () => {
    direction = { x: -10, y: 0 };
    if (!timerStarted) {
        timeInterval = setInterval(() => {
            time++;
            updateDisplay();
        }, 1000);
        timerStarted = true;
    };
});
rightButton.addEventListener('click', () => {
    direction = { x: 10, y: 0 };
    if (!timerStarted) {
        timeInterval = setInterval(() => {
            time++;
            updateDisplay();
        }, 1000);
        timerStarted = true;
    };
});

// 控制方向键
document.addEventListener('keydown', (e) => {
    const directions = {
        ArrowUp: { x: 0, y: -10 },
        ArrowDown: { x: 0, y: 10 },
        ArrowLeft: { x: -10, y: 0 },
        ArrowRight: { x: 10, y: 0 }
    };

    // 获取当前按键对应的方向
    const newDirection = directions[e.key];

    // 如果按键是有效方向且不是反向的方向
    if (newDirection &&
        (newDirection.x !== -direction.x || newDirection.y !== -direction.y)) {
        direction = newDirection;
        
        // 如果计时器没有启动，则开始计时
        if (!timerStarted) {
            timeInterval = setInterval(() => {
                time++;
                updateDisplay();
            }, 1000);
            timerStarted = true;
        }
    }
});

// 监听键盘事件，阻止箭头键默认滚动行为
window.addEventListener('keydown', function(e) {
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

    if (keys.includes(e.key)) {
        e.preventDefault(); // 阻止默认滚动行为
    }
});

startButton.addEventListener('click', initializeGame);

initializeGame();