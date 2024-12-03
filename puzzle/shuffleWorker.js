// 在 Worker 中计算打乱移动序列
self.onmessage = function(e) {
    const { size, emptyIndex } = e.data;
    const moves = generateShuffleMoves(size, emptyIndex);
    self.postMessage(moves);
};

function generateShuffleMoves(size, emptyIndex) {
    const moves = [];
    const totalMoves = 100; // 打乱次数
    let lastMove = -1;
    let currentEmpty = emptyIndex;

    for (let i = 0; i < totalMoves; i++) {
        const validMoves = getValidMoves(size, currentEmpty);
        let move;
        
        // 避免来回移动
        do {
            move = validMoves[Math.floor(Math.random() * validMoves.length)];
        } while (move === lastMove);

        moves.push(move);
        lastMove = currentEmpty;
        currentEmpty = move;
    }

    return moves;
}

function getValidMoves(size, emptyIndex) {
    const validMoves = [];
    const row = Math.floor(emptyIndex / size);
    const col = emptyIndex % size;

    if (row > 0) validMoves.push(emptyIndex - size);
    if (row < size - 1) validMoves.push(emptyIndex + size);
    if (col > 0) validMoves.push(emptyIndex - 1);
    if (col < size - 1) validMoves.push(emptyIndex + 1);

    return validMoves;
} 