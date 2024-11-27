const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const speedDisplay = document.getElementById('speed');
const startButton = document.getElementById('start-game');

// 初始化游戏
let snake = [];
let direction = { x: 0, y: 0 };
let food = {};
let score = 0;
let time = 0;
let speed = 100; // 初始速度
let maxSpeed = 25; // 最大速度
let intervalId;
let lastTime = 0;

alert(`游戏规则：不要让蛇撞到墙壁或自己的身体，得分越高速度越快，最高速度为 ${maxSpeed}ms/格。你可以使用按钮或键盘上的箭头键控制蛇的移动。`);

function getRandomPosition() {
    return {
        x: Math.floor(Math.random() * (canvas.width / 10)) * 10,
        y: Math.floor(Math.random() * (canvas.height / 10)) * 10
    };
}

function initializeGame() {
    snake = [getRandomPosition()];
    direction = { x: 10, y: 0 }; // 初始向右移动
    food = getRandomPosition();
    score = 0;
    time = 0;
    speed = 100;
    scoreDisplay.textContent = score;
    timeDisplay.textContent = time;
    speedDisplay.textContent = speed;
    clearInterval(intervalId);
    lastTime = Date.now();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制蛇
    snake.forEach(segment => {
        ctx.fillStyle = 'green';
        ctx.fillRect(segment.x, segment.y, 10, 10);
    });

    // 绘制食物
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x, food.y, 10, 10);

    // 更新分数显示
    scoreDisplay.textContent = score;
    timeDisplay.textContent = Math.floor((Date.now() - lastTime) / 1000);
    speedDisplay.textContent = speed;
}

function update() {
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score++;
        food = getRandomPosition();
        snake.push({}); // 增加蛇的长度
    } else {
        snake.pop(); // 移除蛇尾
    }

    // 添加新的头部位置
    snake.unshift(head);

    // 检测碰撞
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height || snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
        alert(`游戏结束，你的分数是 ${score}`);
        location.reload();
    }

    draw();
    if (score < 15) {
        speed = Math.max(maxSpeed, 100 - score * 5);
    } else {
        speed = maxSpeed; // 达到最大速度后保持不变
    }
    speedDisplay.textContent = speed;
    clearInterval(intervalId);
    intervalId = setInterval(update, speed);
}

function changeDirection(newDirection) {
    // 防止反向移动
    if (direction.x * newDirection.x + direction.y * newDirection.y !== -100) {
        direction = newDirection;
    }
}

startButton.addEventListener('click', () => {
    initializeGame();
    intervalId = setInterval(update, speed);
});

document.getElementById('up').addEventListener('click', () => changeDirection({ x: 0, y: -10 }));
document.getElementById('left').addEventListener('click', () => changeDirection({ x: -10, y: 0 }));
document.getElementById('right').addEventListener('click', () => changeDirection({ x: 10, y: 0 }));
document.getElementById('down').addEventListener('click', () => changeDirection({ x: 0, y: 10 }));

// 键盘控制
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            changeDirection({ x: 0, y: -10 });
            break;
        case 'ArrowDown':
            changeDirection({ x: 0, y: 10 });
            break;
        case 'ArrowLeft':
            changeDirection({ x: -10, y: 0 });
            break;
        case 'ArrowRight':
            changeDirection({ x: 10, y: 0 });
            break;
    }
});
