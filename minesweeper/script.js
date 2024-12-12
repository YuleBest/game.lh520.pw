let board = [];
let gameState = {
    width: 9,
    height: 9,
    mines: 10,
    revealed: 0,
    flagged: 0,
    isGameOver: false,
    startTime: null,
    timerInterval: null
};

// 初始化游戏
function startGame(difficulty) {
    // 根据难度设置游戏参数
    switch(difficulty) {
        case 'easy':
            gameState.width = 9;
            gameState.height = 9;
            gameState.mines = 10;
            break;
        case 'medium':
            gameState.width = 16;
            gameState.height = 16;
            gameState.mines = 40;
            break;
        case 'hard':
            gameState.width = 16;
            gameState.height = 30;
            gameState.mines = 99;
            break;
        case 'custom':
            // 获取自定义设置
            const width = parseInt(document.getElementById('customWidth').value);
            const height = parseInt(document.getElementById('customHeight').value);
            const mines = parseInt(document.getElementById('customMines').value);
            
            // 验证输入
            if (isNaN(width) || isNaN(height) || isNaN(mines) ||
                width < 5 || width > 50 || 
                height < 5 || height > 50 || 
                mines < 1 || mines >= (width * height)) {
                alert('请输入有效的游戏参数！\n宽度和高度：5-50\n地雷数：1至格子总数-1');
                return;
            }
            
            gameState.width = width;
            gameState.height = height;
            gameState.mines = mines;
            
            // 隐藏对话框
            hideCustomDialog();
            break;
    }

    // 重置游戏状态
    gameState.revealed = 0;
    gameState.flagged = 0;
    gameState.isGameOver = false;
    gameState.startTime = null;
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    document.getElementById('timer').textContent = '0';
    document.getElementById('mines-count').textContent = gameState.mines;

    // 创建游戏板
    board = [];
    for (let y = 0; y < gameState.height; y++) {
        board[y] = [];
        for (let x = 0; x < gameState.width; x++) {
            board[y][x] = {
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            };
        }
    }

    // 随机放置地雷
    let minesPlaced = 0;
    while (minesPlaced < gameState.mines) {
        const x = Math.floor(Math.random() * gameState.width);
        const y = Math.floor(Math.random() * gameState.height);
        if (!board[y][x].isMine) {
            board[y][x].isMine = true;
            minesPlaced++;
        }
    }

    // 计算每个格子周围的地雷数
    for (let y = 0; y < gameState.height; y++) {
        for (let x = 0; x < gameState.width; x++) {
            if (!board[y][x].isMine) {
                board[y][x].neighborMines = countNeighborMines(x, y);
            }
        }
    }

    // 渲染游戏板
    renderBoard();
}

// 计算指定格子周围的地雷数
function countNeighborMines(x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const newX = x + dx;
            const newY = y + dy;
            if (newX >= 0 && newX < gameState.width && 
                newY >= 0 && newY < gameState.height && 
                board[newY][newX].isMine) {
                count++;
            }
        }
    }
    return count;
}

// 渲染游戏板
function renderBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.style.gridTemplateColumns = `repeat(${gameState.width}, 30px)`;
    gameBoard.innerHTML = '';

    for (let y = 0; y < gameState.height; y++) {
        for (let x = 0; x < gameState.width; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.x = x;
            cell.dataset.y = y;

            if (board[y][x].isRevealed) {
                cell.classList.add('revealed');
                if (board[y][x].isMine) {
                    cell.classList.add('mine');
                    cell.textContent = '💣';
                } else if (board[y][x].neighborMines > 0) {
                    cell.textContent = board[y][x].neighborMines;
                    cell.dataset.number = board[y][x].neighborMines;
                }
            } else if (board[y][x].isFlagged) {
                cell.classList.add('flagged');
                cell.textContent = '🚩';
            }

            cell.addEventListener('click', handleClick);
            cell.addEventListener('contextmenu', handleRightClick);
            gameBoard.appendChild(cell);
        }
    }
}

// 处理左键点击
function handleClick(event) {
    if (gameState.isGameOver) return;
    
    const x = parseInt(event.target.dataset.x);
    const y = parseInt(event.target.dataset.y);

    if (!gameState.startTime) {
        gameState.startTime = Date.now();
        gameState.timerInterval = setInterval(updateTimer, 1000);
    }

    if (board[y][x].isFlagged) return;

    if (board[y][x].isMine) {
        gameOver(false);
        return;
    }

    revealCell(x, y);
    renderBoard();

    // 检查是否获胜
    checkWin();
}

// 处理右键点击
function handleRightClick(event) {
    event.preventDefault();
    if (gameState.isGameOver) return;

    const x = parseInt(event.target.dataset.x);
    const y = parseInt(event.target.dataset.y);

    if (!gameState.startTime) {
        gameState.startTime = Date.now();
        gameState.timerInterval = setInterval(updateTimer, 1000);
    }

    if (!board[y][x].isRevealed) {
        const wasFlagged = board[y][x].isFlagged;
        board[y][x].isFlagged = !wasFlagged;
        
        // 只在剩余地雷数大于0或者是取消标记时更新计数
        if (!wasFlagged && gameState.mines - gameState.flagged > 0) {
            gameState.flagged++;
        } else if (wasFlagged) {
            gameState.flagged--;
        } else {
            // 如果剩余地雷数为0且试图继续标记，恢复标记状态
            board[y][x].isFlagged = false;
        }
        
        document.getElementById('mines-count').textContent = 
            gameState.mines - gameState.flagged;
        renderBoard();
    }
}

// 揭示格子
function revealCell(x, y) {
    if (x < 0 || x >= gameState.width || y < 0 || y >= gameState.height || 
        board[y][x].isRevealed || board[y][x].isFlagged) {
        return;
    }

    board[y][x].isRevealed = true;
    gameState.revealed++;

    if (board[y][x].neighborMines === 0) {
        // 如果是格子，递归揭示周围的格子
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                revealCell(x + dx, y + dy);
            }
        }
    }
}

// 游戏结束
function gameOver(isWin) {
    gameState.isGameOver = true;
    clearInterval(gameState.timerInterval);

    // 显示所有地雷
    for (let y = 0; y < gameState.height; y++) {
        for (let x = 0; x < gameState.width; x++) {
            if (board[y][x].isMine) {
                board[y][x].isRevealed = true;
            }
        }
    }
    renderBoard();

    // 显示游戏结果
    setTimeout(() => {
        alert(isWin ? '恭喜你赢了！' : '游戏结束！');
    }, 100);
}

// 更新计时器
function updateTimer() {
    if (gameState.startTime) {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        document.getElementById('timer').textContent = elapsed;
    }
}

// 切换主题
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
}

// 显示自定义难度对话框
function showCustomDialog() {
    document.getElementById('customDialog').classList.add('show');
    document.getElementById('dialogOverlay').classList.add('show');
}

// 隐藏自定义难度对话框
function hideCustomDialog() {
    document.getElementById('customDialog').classList.remove('show');
    document.getElementById('dialogOverlay').classList.remove('show');
}

// 切换作弊面板的显示/隐藏
function toggleCheat() {
    const cheatPanel = document.getElementById('cheatPanel');
    if (cheatPanel.classList.contains('hidden')) {
        cheatPanel.classList.remove('hidden');
        // 添加淡入动画
        cheatPanel.style.opacity = '0';
        cheatPanel.style.display = 'block';
        setTimeout(() => {
            cheatPanel.style.opacity = '1';
        }, 10);
    } else {
        // 添加淡出动画
        cheatPanel.style.opacity = '0';
        setTimeout(() => {
            cheatPanel.classList.add('hidden');
        }, 300);
    }
}

// 标记一个未标记的地雷
function markOneMine() {
    // 找到一个未标记的地雷
    for (let y = 0; y < gameState.height; y++) {
        for (let x = 0; x < gameState.width; x++) {
            if (board[y][x].isMine && !board[y][x].isFlagged && !board[y][x].isRevealed) {
                // 标记这个地雷
                board[y][x].isFlagged = true;
                gameState.flagged++;
                document.getElementById('mines-count').textContent = 
                    gameState.mines - gameState.flagged;
                renderBoard();
                
                // 检查是否获胜
                checkWin();
                return;
            }
        }
    }
}

// 标记所有未标记的地雷
function markAllMines() {
    let newFlagsCount = 0;
    
    // 标记所有未标记的地雷
    for (let y = 0; y < gameState.height; y++) {
        for (let x = 0; x < gameState.width; x++) {
            if (board[y][x].isMine && !board[y][x].isFlagged && !board[y][x].isRevealed) {
                board[y][x].isFlagged = true;
                newFlagsCount++;
            }
        }
    }
    
    // 更新标记计数
    gameState.flagged += newFlagsCount;
    document.getElementById('mines-count').textContent = 
        gameState.mines - gameState.flagged;
    renderBoard();
    
    // 检查是否获胜
    checkWin();
}

// 检查是否获胜
function checkWin() {
    // 检查是否所有非地雷格子都已揭示
    const allSafeCellsRevealed = gameState.revealed === 
        (gameState.width * gameState.height - gameState.mines);
    
    // 检查是否所有地雷都已标记
    let allMinesFlagged = true;
    for (let y = 0; y < gameState.height; y++) {
        for (let x = 0; x < gameState.width; x++) {
            if (board[y][x].isMine && !board[y][x].isFlagged) {
                allMinesFlagged = false;
                break;
            }
        }
        if (!allMinesFlagged) break;
    }
    
    // 如果两个条件都满足，游戏胜利
    if (allSafeCellsRevealed && allMinesFlagged) {
        gameOver(true);
    }
}

// 初始化游戏
startGame('easy'); 