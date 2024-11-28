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
let foods = []; // 普通食物数组
let specialFoods = []; // 特殊食物数组
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
let baseSpeed = 100; // 基础移动速度（毫秒）
let currentSpeed = baseSpeed;
let aiSnakeLives = {}; // 存储 AI 蛇的生命值
let isInvincible = false;
let invincibleTimer = null;
let invincibleTimeLeft = 0;

// 添加触摸控制变量
let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 30; // 最小滑动距离，防止误触

// 添加触摸事件监听
document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchmove', (e) => {
    e.preventDefault(); // 防止页面滚动
}, { passive: false });

document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // 检查是否达到最小滑动距离
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
        return; // 滑动距离太小，忽略
    }
    
    // 判断主要的滑动方向
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (deltaX > 0 && direction.x !== -10) {
            direction = { x: 10, y: 0 }; // 右
        } else if (deltaX < 0 && direction.x !== 10) {
            direction = { x: -10, y: 0 }; // 左
        }
    } else {
        // 垂直滑动
        if (deltaY > 0 && direction.y !== -10) {
            direction = { x: 0, y: 10 }; // 下
        } else if (deltaY < 0 && direction.y !== 10) {
            direction = { x: 0, y: -10 }; // 上
        }
    }
    
    // 启动计时器
    if (!timerStarted) {
        timeInterval = setInterval(() => {
            time++;
            updateDisplay();
        }, 1000);
        timerStarted = true;
    }
});

// 初始化游戏
function initializeGame() {
    snake = [{ x: 100, y: 100 }];
    aiSnakes = [createAISnake(), createAISnake()];
    direction = { x: 0, y: 0 };
    
    // 初始化食物数组
    foods = Array(4).fill().map(() => getRandomPosition());
    specialFoods = Array(2).fill().map(() => getRandomPosition());
    
    currentSpeed = baseSpeed;
    lifePotion = Math.random() < 0.2 ? getRandomPosition() : null;
    speedPotion = Math.random() < 0.5 ? getRandomPosition() : null; // 50%概率出现
    slowPotion = Math.random() < 0.5 ? getRandomPosition() : null; // 50%概率出现
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

    // 检查是否需要显示引导
    if (!localStorage.getItem('snakeGameGuideShown') && isMobile()) {
        showTouchGuide();
    }

    if (isMobile()) {
        initJoystick();
    }

    updateGameRules();
}

// 更新显示
function updateDisplay() {
    scoreDisplay.textContent = score;
    timeDisplay.textContent = `${time}`;
    
    // 更新生命值显示
    const livesDisplay = Array(lives).fill('<i class="fas fa-heart" style="color: #ff7aa0;"></i>').join(' ');
    document.getElementById('lives-board').innerHTML = livesDisplay;
    
    // 更新速度显示（修改为倍数显示）
    const speedMultiplier = (baseSpeed / currentSpeed).toFixed(2);
    document.getElementById('speed-display').textContent = speedMultiplier;
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
    const id = Math.random().toString(36).substr(2, 9); // 生成唯一ID
    aiSnakeLives[id] = 1; // 设置 AI 蛇的生命值为 1
    return {
        id: id,
        body: [getRandomPosition()],
        direction: getRandomDirection(),
        color: getRandomColor(),
    };
}

// 随机颜色
function getRandomColor() {
    // 使用柔和的颜色，避免黄色、红色和黑色
    const colors = [
        '#3498db', // 蓝色
        '#9b59b6', // 紫色
        '#1abc9c', // 青绿色
        '#16a085', // 深青色
        '#27ae60', // 深绿色
        '#8e44ad'  // 深紫色
    ];
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
    aiSnakes = aiSnakes.filter(aiSnake => aiSnakeLives[aiSnake.id] > 0);
    
    aiSnakes.forEach(aiSnake => {
        const head = {
            x: aiSnake.body[0].x + aiSnake.direction.x,
            y: aiSnake.body[0].y + aiSnake.direction.y
        };
        let shouldGrow = false;

        // 检查 AI 蛇是否撞到其他 AI 蛇
        const hitOtherAI = aiSnakes.some(otherSnake => 
            otherSnake !== aiSnake && 
            otherSnake.body.some(segment => segment.x === head.x && segment.y === head.y)
        );

        // 检查 AI 蛇是否撞到玩家蛇
        const hitPlayer = snake.some(segment => segment.x === head.x && segment.y === head.y);

        // 检查是否吃到食物
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

// 更新玩家蛇位置
function updateSnakePosition() {
    if (direction.x === 0 && direction.y === 0) return;

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    let shouldGrow = false; // 添加标记，判断是否应该增长

    if (checkCollision(head)) {
        if (lives <= 0) {
            clearInterval(snakeMoveInterval);
            clearInterval(aiInterval);
            clearInterval(timeInterval);
        }
        return;
    }

    // 检查是否吃到速度药水
    if (speedPotion && head.x === speedPotion.x && head.y === speedPotion.y) {
        currentSpeed = baseSpeed * 0.75;
        clearInterval(snakeMoveInterval);
        snakeMoveInterval = setInterval(updateSnakePosition, currentSpeed);
        showScoreChange("⚡速度+25%", canvas.offsetLeft + head.x, canvas.offsetTop + head.y);
        speedPotion = null;
        setTimeout(() => {
            currentSpeed = baseSpeed;
            clearInterval(snakeMoveInterval);
            snakeMoveInterval = setInterval(updateSnakePosition, currentSpeed);
            showScoreChange("⚡速度恢复", canvas.offsetLeft + head.x, canvas.offsetTop + head.y);
        }, 5000);
    }

    // 检查是否吃到生命药水
    if (lifePotion && head.x === lifePotion.x && head.y === lifePotion.y) {
        lives++;
        showScoreChange("❤️+1", canvas.offsetLeft + head.x, canvas.offsetTop + head.y);
        lifePotion = null;
    }

    // 检查是否吃到缓慢药水
    if (slowPotion && head.x === slowPotion.x && head.y === slowPotion.y) {
        currentSpeed = baseSpeed * 1.25;
        clearInterval(snakeMoveInterval);
        snakeMoveInterval = setInterval(updateSnakePosition, currentSpeed);
        showScoreChange("🐌速度-25%", canvas.offsetLeft + head.x, canvas.offsetTop + head.y);
        slowPotion = null;
        setTimeout(() => {
            currentSpeed = baseSpeed;
            clearInterval(snakeMoveInterval);
            snakeMoveInterval = setInterval(updateSnakePosition, currentSpeed);
            showScoreChange("🐌速度恢复", canvas.offsetLeft + head.x, canvas.offsetTop + head.y);
        }, 5000);
    }

    // 检查是否吃到普通食物
    const foodIndex = foods.findIndex(food => food.x === head.x && food.y === head.y);
    if (foodIndex !== -1) {
        score += 25;
        showScoreChange(25, canvas.offsetLeft + head.x, canvas.offsetTop + head.y);
        foods[foodIndex] = getRandomPosition();
        shouldGrow = true;
    }

    // 检查是否吃到特殊食物
    const specialFoodIndex = specialFoods.findIndex(food => food.x === head.x && food.y === head.y);
    if (specialFoodIndex !== -1) {
        score += 100;
        showScoreChange(100, canvas.offsetLeft + head.x, canvas.offsetTop + head.y);
        specialFoods[specialFoodIndex] = getRandomPosition();
        shouldGrow = true;
    }

    // 先添加新的头部
    snake.unshift(head);
    
    // 如果没有吃到食物，则移除尾部
    if (!shouldGrow) {
        snake.pop();
    }

    updateDisplay();
    draw();
}

// 碰撞检测
function checkCollision(head, isPlayer = true) {
    // 检查是否撞墙
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        if (isPlayer) {
            lives = 0;
            showGameOver();
        }
        return true;
    }
    
    // 检查是否撞到障碍物
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
            // 无敌时间内撞到障碍物，直接消除障碍物
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
        // 启动无敌时间
        startInvincibleTime();
        return false;
    }
    
    if (isPlayer) {
        // 检查是否撞到自己
        if (snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
            lives--;
            showScoreChange(-1, canvas.offsetLeft + head.x, canvas.offsetTop + head.y);
            updateDisplay();
            if (lives <= 0) {
                showGameOver();
                return true;
            }
            // 启动无敌时间
            startInvincibleTime();
            return false;
        }
        
        // 玩家主动撞击 AI 蛇时，击杀 AI 蛇并获得分数
        aiSnakes.forEach(aiSnake => {
            if (aiSnakeLives[aiSnake.id] > 0 && aiSnake.body.some(segment => segment.x === head.x && segment.y === head.y)) {
                aiSnakeLives[aiSnake.id] = 0;
                // 将 AI 蛇的每个身体部分转换为特殊食物
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

// 绘制所有元素
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制玩家蛇的拖影效果
    snake.forEach((segment, index) => {
        const alpha = (snake.length - index) / snake.length;
        ctx.fillStyle = `rgba(46, 204, 113, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.roundRect(segment.x - 2, segment.y - 2, 14, 14, 4);
        ctx.fill();
    });

    // 绘制玩家蛇的实体
    snake.forEach((segment, index) => {
        const isHead = index === 0;
        
        // 如果处于无敌状态，添加金色描边
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

    // 如果处于无敌状态，显示剩余时间
    if (isInvincible) {
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText(`无敌: ${invincibleTimeLeft}s`, canvas.width / 2, 30);
        ctx.textAlign = 'left'; // 重置文本对齐
    }

    // 绘制 AI 蛇
    aiSnakes.forEach(aiSnake => {
        if (aiSnakeLives[aiSnake.id] > 0) {
            // AI蛇的拖影效果
            aiSnake.body.forEach((segment, index) => {
                const alpha = (aiSnake.body.length - index) / aiSnake.body.length;
                ctx.fillStyle = `${aiSnake.color}${Math.floor(alpha * 50)}`; // 使用十六进制的透明度
                ctx.beginPath();
                ctx.roundRect(segment.x, segment.y, 10, 10, 3);
                ctx.fill();
            });
        }
    });

    // 绘制所有普通食物
    ctx.fillStyle = '#f1c40f';
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 10;
    foods.forEach(food => {
        ctx.beginPath();
        ctx.roundRect(food.x, food.y, 10, 10, 3);
        ctx.fill();
    });

    // 绘制所有特殊食物
    ctx.fillStyle = '#e74c3c';
    ctx.shadowColor = '#e74c3c';
    specialFoods.forEach(food => {
        ctx.beginPath();
        ctx.roundRect(food.x, food.y, 10, 10, 3);
        ctx.fill();
    });

    // 绘制生命药水
    if (lifePotion) {
        ctx.font = '20px Arial';
        ctx.fillText('❤️', lifePotion.x - 5, lifePotion.y + 15);
    }

    // 绘制速度药水
    if (speedPotion) {
        ctx.font = '20px Arial';
        ctx.fillText('⚡', speedPotion.x - 5, speedPotion.y + 15);
    }

    // 绘制缓慢药水
    if (slowPotion) {
        ctx.font = '20px Arial';
        ctx.fillText('🐌', slowPotion.x - 5, slowPotion.y + 15);
    }

    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // 绘制障碍物
    ctx.fillStyle = '#34495e';
    obstacles.forEach(obs => {
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, 10, 10, 3);
        ctx.fill();
    });
}

// 添加触摸引导遮罩
function showTouchGuide() {
    const guide = document.createElement('div');
    guide.className = 'touch-guide';
    guide.innerHTML = `
        <div class="guide-overlay">
            <div class="guide-area up">
                <i class="fas fa-chevron-up"></i>
                <span>上滑区域</span>
            </div>
            <div class="guide-area right">
                <i class="fas fa-chevron-right"></i>
                <span>右滑区域</span>
            </div>
            <div class="guide-area down">
                <i class="fas fa-chevron-down"></i>
                <span>下滑区域</span>
            </div>
            <div class="guide-area left">
                <i class="fas fa-chevron-left"></i>
                <span>左滑区域</span>
            </div>
            <div class="guide-center">
                <span>点击任意位置开始</span>
            </div>
        </div>
    `;
    document.body.appendChild(guide);

    guide.addEventListener('click', () => {
        guide.remove();
        localStorage.setItem('snakeGameGuideShown', 'true');
    });
}

// 检测是否为移动设备
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

startButton.addEventListener('click', initializeGame);

initializeGame();

// 添加游戏结束弹窗
function showGameOver() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-align: center;
        z-index: 1000;
    `;
    modal.innerHTML = `
        <h2>游戏结束</h2>
        <p>最终得分：${score}分</p>
        <p>游戏时间：${time}秒</p>
        <p>剩余生命：${lives}</p>
        <button onclick="location.reload()" style="margin-top: 10px;">重新开始</button>
    `;
    document.body.appendChild(modal);
}

// 添加分数变化效果函数
function showScoreChange(amount, x, y) {
    const effect = document.createElement('div');
    effect.className = 'score-change';
    effect.textContent = amount > 0 ? `+${amount}` : amount;
    effect.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        color: ${amount > 0 ? '#2ecc71' : '#e74c3c'};
        font-weight: bold;
        font-size: 20px;
        pointer-events: none;
        animation: floatUp 1s ease-out forwards;
    `;
    document.body.appendChild(effect);
    
    setTimeout(() => effect.remove(), 1000);
}

// 添加玩家碰撞处理函数
function handlePlayerCollision() {
    lives--;
    updateDisplay();
    
    if (lives <= 0) {
        showGameOver();
        return true;
    } else {
        // 显示生命值减少提示
        showScoreChange(-1, canvas.offsetLeft + canvas.width / 2, canvas.offsetTop);
        // 重置蛇的位置
        snake = [{ x: 100, y: 100 }];
        direction = { x: 0, y: 0 };
    }
    return false;
}

// 添加无敌时间启动函数
function startInvincibleTime() {
    isInvincible = true;
    invincibleTimeLeft = 5;
    
    // 清除之前的定时器
    if (invincibleTimer) {
        clearInterval(invincibleTimer);
    }
    
    // 创建新的定时器
    invincibleTimer = setInterval(() => {
        invincibleTimeLeft--;
        if (invincibleTimeLeft <= 0) {
            isInvincible = false;
            clearInterval(invincibleTimer);
            invincibleTimer = null;
        }
    }, 1000);
}

// 添加分享功能
document.getElementById('share-game').addEventListener('click', async () => {
    const url = 'https://lh520.pw/贪吃蛇/';
    
    try {
        // 尝试使用新的剪贴板 API
        await navigator.clipboard.writeText(url);
        
        // 创建一个临时提示元素
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
        toast.textContent = '链接已复制到剪贴板！';
        document.body.appendChild(toast);

        // 2秒后移除提示
        setTimeout(() => {
            toast.remove();
        }, 2000);
    } catch (err) {
        // 如果剪贴板 API 不可用，使用传统方法
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert('链接已复制到剪贴板！');
    }
});

// 添加淡入淡出动画
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

// 修改游戏规则文本
function updateGameRules() {
    const rulesContent = document.querySelector('.rules-content');
    rulesContent.innerHTML = `
        <p>• 电脑：方向键控制移动</p>
        <p>• 手机：滑动屏幕控制方向</p>
        <p>• R键：快速重新开始</p>
        <p>• 撞墙/被AI击杀：直接死亡</p>
        <p>• 撞自己/障碍物：生命值-1</p>
        <p>• 击杀AI蛇：获得50分/节</p>
        <p>• 受伤后获得5秒无敌时间</p>
    `;
}

// 添加键盘控制事件监听
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

    // R键重新开始游戏
    if (e.key.toLowerCase() === 'r') {
        location.reload();
    }
});

// 监听键盘事件，阻止箭头键默认滚动行为
window.addEventListener('keydown', function(e) {
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (keys.includes(e.key)) {
        e.preventDefault();
    }
});

// 添加按钮点击事件
upButton.addEventListener('click', () => {
    if (direction.y !== 10) { // 防止反向移动
        direction = { x: 0, y: -10 };
        startTimer();
    }
});

downButton.addEventListener('click', () => {
    if (direction.y !== -10) {
        direction = { x: 0, y: 10 };
        startTimer();
    }
});

leftButton.addEventListener('click', () => {
    if (direction.x !== 10) {
        direction = { x: -10, y: 0 };
        startTimer();
    }
});

rightButton.addEventListener('click', () => {
    if (direction.x !== -10) {
        direction = { x: 10, y: 0 };
        startTimer();
    }
});

// 辅助函数：启动计时器
function startTimer() {
    if (!timerStarted) {
        timeInterval = setInterval(() => {
            time++;
            updateDisplay();
        }, 1000);
        timerStarted = true;
    }
}