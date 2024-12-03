class GomokuAI {
    constructor() {
        this.weights = {
            win5: 100000,    // 连五
            live4: 50000,    // 活四
            dead4: 10000,    // 死四
            live3: 8000,     // 活三
            dead3: 3000,     // 死三
            live2: 1000,     // 活二
            dead2: 300,      // 死二
            // 新增斜线相关权重
            diagonalLive3: 10000,  // 斜线活三权重更高
            diagonalDead3: 4000,   // 斜线死三权重更高
            diagonalLive2: 1500    // 斜线活二权重更高
        };
    }

    // 获取最佳移动位置
    getBestMove(board) {
        // 第一步下在中心点附近
        if (this.isFirstMove(board)) {
            const center = 7;
            const offset = Math.floor(Math.random() * 3) - 1;
            return [center + offset, center + offset];
        }

        // 检查是否有连五的机会
        const winningMove = this.findWinningMove(board);
        if (winningMove) return winningMove;

        // 检查是否需要防守
        const blockingMove = this.findBlockingMove(board);
        if (blockingMove) return blockingMove;

        // 寻找最佳进攻位置
        return this.findBestAttackMove(board);
    }

    // 检查是否是第一步
    isFirstMove(board) {
        return board.every(row => row.every(cell => cell === null));
    }

    // 寻找制胜点
    findWinningMove(board) {
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i][j] === null) {
                    // 检查是否能连五
                    board[i][j] = 'white';
                    if (this.checkWin(board, i, j, 'white')) {
                        board[i][j] = null;
                        return [i, j];
                    }
                    board[i][j] = null;
                }
            }
        }
        return null;
    }

    // 寻找防守点
    findBlockingMove(board) {
        let maxScore = 0;
        let bestMove = null;
        let diagonalThreats = new Set(); // 记录斜线威胁位置

        // 首先检查斜线威胁
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i][j] === null) {
                    // 检查是否是斜线威胁
                    if (this.isDiagonalThreat(board, i, j)) {
                        diagonalThreats.add(`${i},${j}`);
                    }
                }
            }
        }

        // 评估所有可能的位置
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i][j] === null) {
                    // 评估对手在此处下棋的威胁程度
                    board[i][j] = 'black';
                    const threatScore = this.evaluatePosition(board, i, j, false);
                    const continuousScore = this.evaluateContinuousThreats(board, i, j, 'black');
                    board[i][j] = null;

                    // 评估自己在此处下棋的进攻价值
                    board[i][j] = 'white';
                    const attackScore = this.evaluatePosition(board, i, j, true);
                    board[i][j] = null;

                    // 计算总分，对斜线威胁位置给予额外权重
                    let totalScore = threatScore * 2 + continuousScore * 3 + attackScore;
                    if (diagonalThreats.has(`${i},${j}`)) {
                        totalScore *= 1.5; // 提高斜线威胁位置的权重
                    }

                    if (totalScore > maxScore) {
                        maxScore = totalScore;
                        bestMove = [i, j];
                    }
                }
            }
        }

        // 降低防守阈值，更积极地防守
        if (maxScore >= this.weights.live2) {
            return bestMove;
        }

        return null;
    }

    // 新增：评估连续棋子的威胁
    evaluateContinuousThreats(board, row, col, player) {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        let maxThreat = 0;

        for (const [dx, dy] of directions) {
            let consecutive = 1;
            let spaces = 0;
            let blocked = 0;
            let isDiagonal = Math.abs(dx) === 1 && Math.abs(dy) === 1;

            // 向两个方向检查
            for (const dir of [-1, 1]) {
                let r = row + dx * dir;
                let c = col + dy * dir;
                let spaceFound = false;
                let currentRun = 0;  // 当前连续计数

                // 检查5格范围内的情况（增加检查范围）
                for (let i = 0; i < 5 && r >= 0 && r < 15 && c >= 0 && c < 15; i++) {
                    if (board[r][c] === player) {
                        if (!spaceFound) {
                            consecutive++;
                            currentRun++;
                        }
                    } else if (board[r][c] === null) {
                        if (currentRun >= 2) {  // 如果之前有连续棋子
                            spaces += 2;  // 增加空位权重
                        } else {
                            spaces++;
                        }
                        spaceFound = true;
                        currentRun = 0;
                    } else {
                        blocked++;
                        break;
                    }
                    r += dx * dir;
                    c += dy * dir;
                }
            }

            // 评估威胁程度，对斜线方向给予更高权重
            let threatScore = 0;
            if (consecutive >= 4 && spaces >= 1) {
                threatScore = this.weights.live4;
            } else if (consecutive >= 3) {
                if (spaces >= 2) {
                    threatScore = isDiagonal ? 
                        this.weights.diagonalLive3 : 
                        this.weights.live3;
                } else if (blocked === 1) {
                    threatScore = isDiagonal ? 
                        this.weights.diagonalDead3 : 
                        this.weights.dead3;
                }
            } else if (consecutive >= 2 && spaces >= 2) {
                threatScore = isDiagonal ? 
                    this.weights.diagonalLive2 : 
                    this.weights.live2;
            }

            // 特殊情况：连续的斜线威胁
            if (isDiagonal && consecutive >= 3 && spaces >= 1) {
                threatScore *= 1.5;  // 增加斜线威胁的权重
            }

            maxThreat = Math.max(maxThreat, threatScore);
        }

        return maxThreat;
    }

    // 寻找最佳进攻位置
    findBestAttackMove(board) {
        let moves = [];

        // 收集所有可能的移动
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i][j] === null && this.hasNeighbor(board, i, j)) {
                    // 评估AI（白方）的进攻分数
                    const aiScore = this.evaluatePosition(board, i, j, true);
                    // 评估玩家（黑方）的防守分数
                    const playerScore = this.evaluatePosition(board, i, j, false);
                    // 综合评分，防守权重更高
                    const score = aiScore + playerScore * 1.5;
                    moves.push([i, j, score]);
                }
            }
        }

        // 按分数排序并选择最佳位置
        moves.sort((a, b) => b[2] - a[2]);
        if (moves.length > 0) {
            // 从前两个最佳位置中随机选择一个
            const index = Math.floor(Math.random() * Math.min(2, moves.length));
            return [moves[index][0], moves[index][1]];
        }

        return [7, 7];
    }

    // 评估位置分数
    evaluatePosition(board, row, col, isAI) {
        const player = isAI ? 'white' : 'black';
        let totalScore = 0;
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

        for (const [dx, dy] of directions) {
            const pattern = this.getPattern(board, row, col, dx, dy, player);
            totalScore += this.evaluatePattern(pattern);
        }

        return totalScore;
    }

    // 获取某个方向的棋型
    getPattern(board, row, col, dx, dy, player) {
        let pattern = '';
        board[row][col] = player; // 临时放置棋子

        // 向两个方向扫描，增加扫描范围
        for (let dir of [-1, 1]) {
            for (let i = 1; i <= 5; i++) {
                const newRow = row + dx * dir * i;
                const newCol = col + dy * dir * i;
                if (newRow < 0 || newRow >= 15 || newCol < 0 || newCol >= 15) {
                    pattern += 'X'; // 边界
                } else if (board[newRow][newCol] === player) {
                    pattern += 'O'; // 己方棋子
                } else if (board[newRow][newCol] === null) {
                    pattern += '_'; // 空位
                } else {
                    pattern += 'X'; // 对方棋子
                }
            }
        }

        board[row][col] = null; // 恢复空位
        return pattern;
    }

    // 评估棋型分数
    evaluatePattern(pattern) {
        // 连五
        if (pattern.includes('OOOOO')) return this.weights.win5;
        
        // 活四或者双活三
        if (pattern.includes('_OOOO_')) return this.weights.live4;
        if (pattern.match(/_OOO_.*_OOO_/)) return this.weights.live4;
        
        // 死四（增加更多模式）
        if (pattern.match(/[X]OOOO_|_OOOOX|OOO_O|O_OOO|OO_OO/)) return this.weights.dead4;
        
        // 活三（增加更多模式）
        if (pattern.includes('_OOO_')) return this.weights.live3;
        if (pattern.includes('_O_OO_') || pattern.includes('_OO_O_')) return this.weights.live3;
        if (pattern.includes('__OOO__')) return this.weights.live3 * 1.2; // 双向活三
        
        // 死三
        if (pattern.match(/[X]OOO_|_OOOX|OO_O|O_OO/)) return this.weights.dead3;
        
        // 活二
        if (pattern.includes('_OO_')) return this.weights.live2;
        if (pattern.includes('_O_O_')) return this.weights.live2;
        if (pattern.includes('__OO__')) return this.weights.live2 * 1.2; // 双向活二
        
        // 死二
        if (pattern.match(/[X]OO_|_OOX/)) return this.weights.dead2;

        return 0;
    }

    // 检查是否获胜
    checkWin(board, row, col, player) {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        return directions.some(([dx, dy]) => {
            let count = 1;
            // 向两个方向检查
            for (const direction of [-1, 1]) {
                let r = row + dx * direction;
                let c = col + dy * direction;
                while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
                    count++;
                    r += dx * direction;
                    c += dy * direction;
                }
            }
            return count >= 5;
        });
    }

    // 检查是否有邻居
    hasNeighbor(board, row, col) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const newRow = row + dx;
                const newCol = col + dy;
                if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 
                    && board[newRow][newCol] !== null) {
                    return true;
                }
            }
        }
        return false;
    }

    // 新增：检查是否是斜线威胁
    isDiagonalThreat(board, row, col) {
        const diagonalDirs = [[1, 1], [1, -1]];
        for (const [dx, dy] of diagonalDirs) {
            let consecutive = 0;
            let spaces = 0;

            // 检查两个方向
            for (const dir of [-1, 1]) {
                let r = row + dx * dir;
                let c = col + dy * dir;
                
                // 检查4格范围
                for (let i = 0; i < 4 && r >= 0 && r < 15 && c >= 0 && c < 15; i++) {
                    if (board[r][c] === 'black') consecutive++;
                    else if (board[r][c] === null) spaces++;
                    else break;
                    r += dx * dir;
                    c += dy * dir;
                }
            }

            if (consecutive >= 2 && spaces >= 1) return true;
        }
        return false;
    }
} 