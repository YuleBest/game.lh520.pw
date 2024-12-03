class PuzzleGame {
    constructor() {
        // DOM 元素
        this.container = document.getElementById('puzzleContainer');
        this.movesDisplay = document.getElementById('moves');
        this.timerDisplay = document.getElementById('timer');
        this.difficultySelect = document.getElementById('difficulty');
        this.startButton = document.getElementById('startButton');
        this.imageInput = document.getElementById('imageInput');

        // 游戏状态
        this.pieces = [];
        this.selectedPiece = null;
        this.size = parseInt(this.difficultySelect.value);
        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.gameImage = new Image();

        // 添加游戏是否开始的标志
        this.gameStarted = false;

        // 绑定事件
        this.startButton.addEventListener('click', () => this.startGame());
        this.difficultySelect.addEventListener('change', () => {
            this.size = parseInt(this.difficultySelect.value);
            this.startGame();
        });
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));

        // 加载默认图片并开始游戏
        this.gameImage.onload = () => this.startGame();
        this.gameImage.src = 'https://maxpcimg.cc/i/2024/09/29/66f8cb5b1cd75.jpg';

        // 修改预览按钮样式和位置
        this.previewButton = document.createElement('button');
        this.previewButton.className = 'btn btn-ghost join-item';
        this.previewButton.innerHTML = '<i class="fas fa-eye"></i> 查看原图';
        this.previewButton.title = '查看原图';
        this.previewButton.onclick = () => this.showPreview();

        // 将预览按钮添加到游戏控制区域
        const joinArea = document.querySelector('.join');
        joinArea.appendChild(this.previewButton);

        // 创建预览模态框
        this.previewModal = document.createElement('div');
        this.previewModal.className = 'preview-modal fixed inset-0 bg-black/50 hidden items-center justify-center z-50';
        this.previewModal.innerHTML = `
            <div class="relative bg-base-100 p-4 rounded-lg max-w-2xl">
                <img src="" alt="原图预览" class="w-full h-auto rounded-lg">
                <button class="btn btn-circle btn-ghost absolute -top-2 -right-2">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        document.body.appendChild(this.previewModal);

        // 绑定预览模态框事件
        this.previewModal.onclick = (e) => {
            if (e.target === this.previewModal || e.target.closest('.btn-circle')) {
                this.hidePreview();
            }
        };

        // 添加移动端适配的类名
        const gameControls = document.querySelector('.flex.flex-col.sm\\:flex-row');
        if (gameControls) {
            gameControls.classList.add('game-controls');
        }
    }

    startGame() {
        // 重置游戏状态
        this.moves = 0;
        this.timer = 0;
        this.gameStarted = false; // 重置游戏开始标志
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.updateDisplay();
        
        // 创建拼图
        this.createPuzzle();
    }

    // 添加开始计时方法
    startTimer() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.timerInterval = setInterval(() => {
                this.timer++;
                this.updateDisplay();
            }, 1000);
        }
    }

    createPuzzle() {
        // 清空容器
        this.container.innerHTML = '';
        this.container.className = 'flex gap-4 justify-center';

        // 创建源区域和目标区域
        const sourceArea = document.createElement('div');
        const targetArea = document.createElement('div');
        sourceArea.className = 'puzzle-grid source-grid';
        targetArea.className = 'puzzle-grid target-grid';

        // 设置网格
        [sourceArea, targetArea].forEach(area => {
            // 设置CSS变量
            area.style.setProperty('--grid-size', this.size);
            // 直接设置网格列数，确保立即生效
            area.style.cssText = `
                width: 300px;
                aspect-ratio: 1;
                grid-template-columns: repeat(${this.size}, 1fr);
                grid-template-rows: repeat(${this.size}, 1fr);
            `;
        });

        // 裁切图片并创建拼图块
        this.createPiecesFromImage().then(pieces => {
            // 打乱拼图块顺序
            this.shuffleArray(pieces);

            // 添加拼图块到源区域
            pieces.forEach(piece => {
                sourceArea.appendChild(piece);
            });

            // 添加空槽到目标区域
            for (let i = 0; i < this.size * this.size; i++) {
                const slot = this.createSlot(i);
                targetArea.appendChild(slot);
            }
        });

        // 创建一个包装容器
        const wrapper = document.createElement('div');
        wrapper.className = 'flex gap-4 justify-center relative';
        wrapper.appendChild(sourceArea);
        wrapper.appendChild(targetArea);

        this.container.appendChild(wrapper);
    }

    async createPiecesFromImage() {
        // 创建临时canvas用于裁切图片
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置canvas大小为图片大小
        const pieceSize = 300 / this.size; // 每个拼图块的大小
        canvas.width = pieceSize;
        canvas.height = pieceSize;

        const pieces = [];
        
        // 裁切图片创建拼图块
        for (let i = 0; i < this.size * this.size; i++) {
            const row = Math.floor(i / this.size);
            const col = i % this.size;

            // 清除canvas
            ctx.clearRect(0, 0, pieceSize, pieceSize);

            // 在canvas上绘制裁切后的图片部分
            ctx.drawImage(
                this.gameImage,
                col * (this.gameImage.width / this.size),
                row * (this.gameImage.height / this.size),
                this.gameImage.width / this.size,
                this.gameImage.height / this.size,
                0,
                0,
                pieceSize,
                pieceSize
            );

            // 创建拼图块元素，传递canvas和当前位置信息
            const piece = this.createPiece(i, canvas);
            pieces.push(piece);
        }

        return pieces;
    }

    createPiece(index, canvas) {
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
        piece.dataset.originalIndex = index;
        
        piece.style.cssText = `
            aspect-ratio: 1;
            width: 100%;
            height: 100%;
            background-image: url(${canvas.toDataURL('image/jpeg', 0.9)});
            background-size: cover;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.2s ease;
            border: 1px solid var(--fallback-b3,oklch(var(--b3)/1));
            user-select: none;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: transparent;
        `;

        // 添加触摸反馈
        piece.addEventListener('touchstart', () => {
            piece.classList.add('touch-feedback');
        });
        piece.addEventListener('touchend', () => {
            piece.classList.remove('touch-feedback');
        });

        piece.addEventListener('click', () => this.handlePieceClick(piece));
        return piece;
    }

    createSlot(index) {
        const slot = document.createElement('div');
        slot.className = 'puzzle-slot';
        slot.dataset.index = index;
        
        slot.style.cssText = `
            aspect-ratio: 1;
            background: var(--fallback-b2,oklch(var(--b2)/0.3));
            border: 1px solid var(--fallback-b3,oklch(var(--b3)/1));
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        // 修改事件监听，分别处理槽位和拼图块的点击
        slot.addEventListener('click', (e) => {
            const piece = e.target.closest('.puzzle-piece');
            if (piece) {
                // 如果点击的是拼图块，调用拼图块的点击处理
                this.handlePieceClick(piece);
            } else {
                // 如果点击的是空槽位，调用槽位的点击处理
                this.handleSlotClick(slot);
            }
        });

        return slot;
    }

    handlePieceClick(piece) {
        console.log('Piece clicked:', piece);
        if (this.selectedPiece === piece) {
            // 取消选中当前拼图块
            piece.classList.remove('selected');
            this.selectedPiece = null;
        } else {
            // 选中新的拼图块
            if (this.selectedPiece) {
                // 如果已有选中的拼图块，则交换位置
                this.startTimer();
                const selectedParent = this.selectedPiece.parentNode;
                const pieceParent = piece.parentNode;
                
                selectedParent.appendChild(piece);
                pieceParent.appendChild(this.selectedPiece);
                
                this.selectedPiece.classList.remove('selected');
                this.selectedPiece = null;
                this.moves++;
                this.updateDisplay();
                this.checkWin();
            } else {
                // 选中当前拼图块
                piece.classList.add('selected');
                this.selectedPiece = piece;
            }
        }
    }

    handleSlotClick(slot) {
        console.log('Slot clicked:', slot);
        const existingPiece = slot.querySelector('.puzzle-piece');
        if (!existingPiece && this.selectedPiece) {
            // 如果是空槽位且有选中的拼图块，则移动拼图块
            this.startTimer();
            slot.appendChild(this.selectedPiece);
            this.selectedPiece.classList.remove('selected');
            this.selectedPiece = null;
            this.moves++;
            this.updateDisplay();
            this.checkWin();
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // 使用更大的尺寸以确保清晰度
                const outputSize = 1200;
                const size = Math.min(img.width, img.height);
                const x = (img.width - size) / 2;
                const y = (img.height - size) / 2;

                canvas.width = outputSize;
                canvas.height = outputSize;

                // 使用白色背景
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, outputSize, outputSize);

                // 使用更好的图像平滑设置
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // 绘制裁剪后的图片
                ctx.drawImage(img, x, y, size, size, 0, 0, outputSize, outputSize);

                // 使用更高质量的图片格式
                this.gameImage.src = canvas.toDataURL('image/jpeg', 1.0);

                // 清理 canvas
                canvas.width = 1;
                canvas.height = 1;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    checkWin() {
        const targetArea = document.querySelector('.target-grid');
        const pieces = targetArea.getElementsByClassName('puzzle-piece');
        
        if (pieces.length !== this.size * this.size) return;

        const isWin = Array.from(pieces).every((piece, index) => {
            return parseInt(piece.dataset.originalIndex) === index;
        });

        if (isWin) {
            clearInterval(this.timerInterval);
            setTimeout(() => {
                alert(`恭喜完成！\n移动次数：${this.moves}\n用时：${this.formatTime(this.timer)}`);
            }, 100);
        }
    }

    // 辅助方法
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    updateDisplay() {
        this.movesDisplay.textContent = this.moves;
        this.timerDisplay.textContent = this.formatTime(this.timer);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    // 添加显示预览方法
    showPreview() {
        const img = this.previewModal.querySelector('img');
        img.src = this.gameImage.src;
        this.previewModal.classList.remove('hidden');
        this.previewModal.classList.add('flex');
    }

    // 添加隐藏预览方法
    hidePreview() {
        this.previewModal.classList.add('hidden');
        this.previewModal.classList.remove('flex');
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new PuzzleGame();
}); 