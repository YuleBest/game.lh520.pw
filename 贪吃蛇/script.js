const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const startButton = document.getElementById('start-game');

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
const minSwipeDistance = 30;

// 初始化游戏
function initializeGame() {
    // 移除之前的事件监听
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);
    
    snake = [{ x: 100, y: 100 }];
    aiSnakes = [createAISnake(), createAISnake()];
    direction = { x: 0, y: 0 };
    
    // 初始化食物数组
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

    // 为画布添加触摸控制
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
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
    aiSnakeLives[id] = 1; // 设置 AI 的生命值为 1
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
        showScoreChange(25, head.x, head.y);
        foods[foodIndex] = getRandomPosition();
        shouldGrow = true;
    }

    // 检查是否吃到特殊食物
    const specialFoodIndex = specialFoods.findIndex(food => food.x === head.x && food.y === head.y);
    if (specialFoodIndex !== -1) {
        score += 100;
        showScoreChange(100, head.x, head.y);
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

    // 绘制所特殊食
    ctx.fillStyle = '#e74c3c';
    ctx.shadowColor = '#e74c3c';
    specialFoods.forEach(food => {
        ctx.beginPath();
        ctx.roundRect(food.x, food.y, 10, 10, 3);
        ctx.fill();
    });

    // 绘制生命药水
    if (lifePotion) {
        ctx.font = '10px Arial';
        ctx.fillText('❤️', lifePotion.x - 1, lifePotion.y + 8);
    }

    // 绘制速度药水
    if (speedPotion) {
        ctx.font = '10px Arial';
        ctx.fillText('⚡', speedPotion.x - 1, speedPotion.y + 8);
    }

    // 绘制缓慢药水
    if (slowPotion) {
        ctx.font = '10px Arial';
        ctx.fillText('🐌', slowPotion.x - 1, slowPotion.y + 8);
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

startButton.addEventListener('click', () => {
    showGameIntro();
});

window.addEventListener('load', () => {
    showGameIntro();
});

// 修改游戏结束弹窗函数
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

    // 计算每秒得分
    const scorePerSecond = time > 0 ? Math.round((score / time) * 10) / 10 : score;

    modal.innerHTML = `
        <h2 style="
            color: var(--primary-dark);
            margin: 0 0 20px 0;
            font-size: 1.5rem;
        ">游戏结束</h2>
        
        <div style="
            margin: 15px 0;
            padding: 15px;
            background: var(--background-color);
            border-radius: var(--border-radius);
        ">
            <p style="margin: 8px 0;">
                <i class="fas fa-star" style="color: var(--primary-color);"></i>
                最终得分：${score}分
            </p>
            <p style="margin: 8px 0;">
                <i class="fas fa-clock" style="color: var(--primary-color);"></i>
                游戏时间：${time}秒
            </p>
            <p style="margin: 8px 0;">
                <i class="fas fa-tachometer-alt" style="color: var(--primary-color);"></i>
                每秒得分：${scorePerSecond}
            </p>
            <p style="margin: 8px 0;">
                <i class="fas fa-heart" style="color: var(--primary-color);"></i>
                剩余生命值${lives}
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
                重新开始
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
                返回首页
            </button>
        </div>
    `;

    // 添加按钮悬停效果
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

// 修改 showScoreChange 函数
function showScoreChange(amount, x, y) {
    const gameCanvas = document.getElementById('gameCanvas');
    const rect = gameCanvas.getBoundingClientRect();
    
    // 计算蛇头上方20像素的位置
    const offsetY = -20; // 向上偏移20像素
    
    const effect = document.createElement('div');
    effect.className = 'score-change';
    effect.textContent = amount > 0 ? `+${amount}` : amount;
    effect.style.cssText = `
        position: fixed;
        left: ${rect.left + x}px;
        top: ${rect.top + y + offsetY}px; // 添加向上的偏移
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

// 添加玩家碰撞处理函数
function handlePlayerCollision() {
    lives--;
    updateDisplay();
    
    if (lives <= 0) {
        showGameOver();
        return true;
    } else {
        // 使用蛇头位置显示生命值减少提示
        const head = snake[0];
        showScoreChange(-1, head.x, head.y);
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
        
        // 创建一个临时提示元
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

    // 获取当前键对应的方向
    const newDirection = directions[e.key];

    // 检查是否允许改变方向
    if (newDirection && isValidDirection(newDirection)) {
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

// 添加方向验证函数
function isValidDirection(newDir) {
    // 如果蛇长度为1，允许任意方向移动
    if (snake.length === 1) return true;
    
    // 检查是否是反方向移动
    return !(
        (newDir.x === -direction.x && newDir.y === direction.y) || 
        (newDir.x === direction.x && newDir.y === -direction.y)
    );
}

// 添加以下函数到文件中
function showGameIntro() {
    const intro = document.createElement('div');
    intro.className = 'game-intro';
    intro.innerHTML = `
        <div class="game-intro-content">
            <h1 style="color: var(--primary-color); font-size: 3em; margin-bottom: 30px;">
                贪吃蛇大作战
            </h1>
            <div style="text-align: left; margin: 20px auto; max-width: 400px; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
                <h3 style="color: var(--primary-color); margin-bottom: 10px;">游戏规则</h3>
                <p>• 电脑：方向键控制移动</p>
                <p>• 手机：滑动屏幕控制方向</p>
                <p>• R键：快速重新开始</p>
                <p>• 撞墙/被AI击杀：直接死亡</p>
                <p>• 撞自己/障碍物：生命值-1</p>
                <p>• 击杀AI蛇：获得50分/节</p>
                <p>• 受伤后获得5秒无敌时间</p>
            </div>
            <button id="start-intro" class="action-btn" style="font-size: 1.5em; padding: 15px 40px;">
                开始游戏
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
            
            // 只为画布添加触摸控制
            canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
            canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
            canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        }, 500);
    });
}

// 修改触摸事件处理函数
function handleTouchStart(e) {
    // 只在画布上处理触摸事件
    if (e.target === canvas) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        touchStartX = touch.clientX - rect.left;
        touchStartY = touch.clientY - rect.top;
    }
}

function handleTouchMove(e) {
    // 只在画布上阻止默认行为
    if (e.target === canvas) {
        e.preventDefault();
    }
}

function handleTouchEnd(e) {
    // 只在画布上处理触摸事件
    if (e.target === canvas) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        const touchEndX = touch.clientX - rect.left;
        const touchEndY = touch.clientY - rect.top;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // 检查是否达到最小滑动距离
        if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
            return; // 滑动距离太小，忽略
        }
        
        // 判断主要的滑动方向
        let newDirection;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 水平滑动
            newDirection = deltaX > 0 ? { x: 10, y: 0 } : { x: -10, y: 0 };
        } else {
            // 垂直滑动
            newDirection = deltaY > 0 ? { x: 0, y: 10 } : { x: 0, y: -10 };
        }
        
        // 检查是否允许改变方向
        if (isValidDirection(newDirection)) {
            direction = newDirection;
            
            // 启动计时器
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