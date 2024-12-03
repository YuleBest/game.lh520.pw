// 游戏变量
let currentPlayer = 'black';
let board = Array(15).fill().map(() => Array(15).fill(null));
let moveHistory = [];
let aiEnabled = false;
let ai = new GomokuAI();
let aiDifficulty = 'medium'; // 默认中等难度
let isThinking = false;

// 添加落子动画相关的 CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes pieceAppear {
        0% {
            transform: scale(0);
            opacity: 0;
        }
        60% {
            transform: scale(1.2);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
    .cell.black::after, .cell.white::after {
        animation: pieceAppear 0.3s ease-out;
    }
`;
document.head.appendChild(style);

// 初始化棋盘
function initializeBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    
    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.onclick = () => makeMove(i, j);
            boardElement.appendChild(cell);
        }
    }
}

function makeMove(row, col) {
    console.log('Making move:', row, col, currentPlayer);
    if (board[row][col] || (aiEnabled && currentPlayer === 'white') || isThinking) {
        console.log('Move rejected:', { 
            occupied: board[row][col], 
            aiTurn: aiEnabled && currentPlayer === 'white',
            thinking: isThinking 
        });
        return;
    }

    // 记录移动
    const moveNumber = moveHistory.length + 1;
    board[row][col] = currentPlayer;
    moveHistory.push({
        row, 
        col, 
        player: currentPlayer,
        moveNumber,
        timestamp: new Date().toLocaleTimeString()
    });
    
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    cell.classList.add(currentPlayer);

    if (checkWin(row, col)) {
        showWinMessage(currentPlayer);
        return;
    }

    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    updateCurrentPlayer();

    // AI 移动
    if (aiEnabled && currentPlayer === 'white') {
        console.log('AI turn starting');
        isThinking = true;
        showThinkingIndicator();
        
        Promise.resolve().then(() => {
            console.log('Calculating AI move');
            const move = ai.getBestMove(board);
            console.log('AI selected move:', move);
            
            if (move) {
                setTimeout(() => {
                    console.log('Executing AI move');
                    isThinking = false;
                    hideThinkingIndicator();
                    
                    const [aiRow, aiCol] = move;
                    board[aiRow][aiCol] = 'white';
                    
                    // 记录 AI 的移动
                    moveHistory.push({
                        row: aiRow, 
                        col: aiCol, 
                        player: 'white',
                        moveNumber: moveHistory.length + 1,
                        timestamp: new Date().toLocaleTimeString()
                    });
                    
                    const aiCell = document.querySelector(`[data-row="${aiRow}"][data-col="${aiCol}"]`);
                    aiCell.classList.add('white');

                    if (checkWin(aiRow, aiCol)) {
                        showWinMessage('white');
                        return;
                    }

                    currentPlayer = 'black';
                    updateCurrentPlayer();
                }, 300);
            } else {
                console.log('No valid move found');
                isThinking = false;
                hideThinkingIndicator();
            }
        }).catch(error => {
            console.error('AI error:', error);
            isThinking = false;
            hideThinkingIndicator();
        });
    }
}

function checkWin(row, col) {
    const directions = [
        [[0, 1], [0, -1]],  // 水平
        [[1, 0], [-1, 0]],  // 垂直
        [[1, 1], [-1, -1]], // 对角线
        [[1, -1], [-1, 1]]  // 反对角线
    ];

    return directions.some(dir => {
        const count = countInDirection(row, col, dir[0][0], dir[0][1]) +
                     countInDirection(row, col, dir[1][0], dir[1][1]) + 1;
        return count >= 5;
    });
}

function countInDirection(row, col, dr, dc) {
    const player = board[row][col];
    let count = 0;
    let r = row + dr;
    let c = col + dc;

    while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
        count++;
        r += dr;
        c += dc;
    }

    return count;
}

function undoMove() {
    if (moveHistory.length === 0 || isThinking) return;

    // 如果 AI 开启且当前是 AI 回合，需要撤销两步
    if (aiEnabled && currentPlayer === 'white') {
        // 撤销两步
        for (let i = 0; i < 2 && moveHistory.length > 0; i++) {
            const lastMove = moveHistory.pop();
            board[lastMove.row][lastMove.col] = null;
            const cell = document.querySelector(
                `[data-row="${lastMove.row}"][data-col="${lastMove.col}"]`
            );
            cell.classList.remove(lastMove.player);
        }
        currentPlayer = 'black';
    } else {
        // 正常撤销一步
        const lastMove = moveHistory.pop();
        board[lastMove.row][lastMove.col] = null;
        const cell = document.querySelector(
            `[data-row="${lastMove.row}"][data-col="${lastMove.col}"]`
        );
        cell.classList.remove(lastMove.player);
        currentPlayer = lastMove.player;
    }
    
    updateCurrentPlayer();
}

function startGame() {
    console.log('Starting new game');
    board = Array(15).fill().map(() => Array(15).fill(null));
    moveHistory = [];
    currentPlayer = 'black';
    isThinking = false;
    
    updateCurrentPlayer();
    
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('black', 'white');
    });

    if (aiEnabled && currentPlayer === 'white') {
        console.log('AI starts first');
        const move = ai.getBestMove(board);
        console.log('AI initial move:', move);
        if (move) {
            setTimeout(() => {
                const [aiRow, aiCol] = move;
                board[aiRow][aiCol] = 'white';
                
                // 记录 AI 的第一步
                moveHistory.push({
                    row: aiRow, 
                    col: aiCol, 
                    player: 'white',
                    moveNumber: 1,
                    timestamp: new Date().toLocaleTimeString()
                });
                
                const aiCell = document.querySelector(`[data-row="${aiRow}"][data-col="${aiCol}"]`);
                aiCell.classList.add('white');
                currentPlayer = 'black';
                updateCurrentPlayer();
            }, 300);
        }
    }
}

function showWinMessage(winner) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-top toast-center z-50';
    toast.style.position = 'fixed';
    toast.style.top = '50%';
    toast.style.left = '50%';
    toast.style.transform = 'translate(-50%, -50%)';
    toast.innerHTML = `
        <div class="alert alert-success">
            <span>${winner === 'black' ? '黑方' : '白方'}获胜！</span>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function toggleAI() {
    aiEnabled = !aiEnabled;
    const aiButton = document.getElementById('aiButton');
    aiButton.textContent = aiEnabled ? 'AI已开启' : '开启AI';
    aiButton.classList.toggle('btn-success');
    aiButton.classList.toggle('btn-ghost');
    
    // 重新初始化 AI
    if (aiEnabled) {
        ai = new GomokuAI();
    }
    
    // 重新开始游戏
    startGame();
}

function setAIDifficulty(difficulty) {
    aiDifficulty = difficulty;
    // 更新按钮状态
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('btn-active');
        if (btn.dataset.difficulty === difficulty) {
            btn.classList.add('btn-active');
        }
    });
}

// 添加思考指示器相关函数
function showThinkingIndicator() {
    const currentPlayerElement = document.getElementById('currentPlayer');
    currentPlayerElement.innerHTML = '白方思考中<span class="loading loading-dots loading-sm ml-2"></span>';
}

function hideThinkingIndicator() {
    updateCurrentPlayer();
}

function updateCurrentPlayer() {
    const currentPlayerElement = document.getElementById('currentPlayer');
    currentPlayerElement.textContent = currentPlayer === 'black' ? '黑方' : '白方';
}

// 添加显示记录的函数
function showMoveHistory() {
    const modal = document.createElement('div');
    modal.className = 'modal modal-open';
    modal.innerHTML = `
        <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">本局记录</h3>
            <div class="overflow-y-auto max-h-96">
                <table class="table table-zebra w-full">
                    <thead>
                        <tr>
                            <th>步数</th>
                            <th>玩家</th>
                            <th>位置</th>
                            <th>时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${moveHistory.map(move => `
                            <tr>
                                <td>${move.moveNumber}</td>
                                <td>${move.player === 'black' ? '黑方' : '白方'}</td>
                                <td>(${move.row + 1}, ${move.col + 1})</td>
                                <td>${move.timestamp}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="modal-action">
                <button class="btn" onclick="this.closest('.modal').remove()">关闭</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// 修改 HTML，添加查看记录按钮
function addHistoryButton() {
    const joinDiv = document.querySelector('.join');
    const historyButton = document.createElement('button');
    historyButton.className = 'btn btn-ghost join-item';
    historyButton.innerHTML = '<i class="fas fa-history"></i> 查看记录';
    historyButton.onclick = showMoveHistory;
    joinDiv.appendChild(historyButton);
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', function() {
    initializeBoard();
    
    // 绑定按钮事件
    const buttons = document.querySelectorAll('.join .btn');
    buttons.forEach(button => {
        if (button.textContent === '重新开始') {
            button.onclick = startGame;
        } else if (button.textContent === '悔棋') {
            button.onclick = undoMove;
        }
    });

    // 单独处理 AI 按钮，因为它有特殊的 id
    const aiButton = document.getElementById('aiButton');
    if (aiButton) {
        aiButton.onclick = toggleAI;
    }

    // 添加历史记录按钮
    addHistoryButton();
}); 