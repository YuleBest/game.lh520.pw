class PuzzleGame {
    constructor() {
        this.container = document.getElementById('puzzle-container');
        this.imageInput = document.getElementById('imageInput');
        this.difficultySelect = document.getElementById('difficulty');
        this.startButton = document.getElementById('startGame');
        this.previewImage = document.getElementById('preview-image');
        this.timerDisplay = document.getElementById('timer');
        this.movesDisplay = document.getElementById('moves');
        
        this.pieces = [];
        this.size = 3;
        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.selectedPiece = null;
        
        this.bindEvents();
        this.setupUploadGuide();
        this.setupFileInputControl();
        
        // 添加说明按钮事件监听
        document.getElementById('showRules').addEventListener('click', () => this.showIntro());
        
        // 初始禁用开始按钮
        this.startButton.disabled = true;
        this.startButton.classList.add('disabled');
        this.startButton.title = '请先上传图片';
        
        // 添加分享按钮事件监听
        document.getElementById('shareGame').addEventListener('click', () => this.shareGame());
    }

    bindEvents() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // 创建正方形裁剪的图片
                    const squareImage = this.cropImageToSquare(img);
                    const guide = document.querySelector('.upload-guide');
                    if (guide) {
                        const preview = document.getElementById('preview');
                        preview.innerHTML = `
                            <h3>原图预览</h3>
                            <img id="preview-image" src="${squareImage}" alt="预览图">
                        `;
                        this.previewImage = document.getElementById('preview-image');
                        
                        // 启用开始按钮
                        this.startButton.disabled = false;
                        this.startButton.classList.remove('disabled');
                        this.startButton.title = '点击开始游戏';
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    cropImageToSquare(img) {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        // 计算裁剪位置，使图片居中
        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;
        
        // 绘制裁剪后的图
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
        
        return canvas.toDataURL('image/jpeg', 0.9);
    }

    startGame() {
        if (!this.previewImage.src) {
            alert('请先上传图片！');
            return;
        }

        // 隐藏文件输入
        document.getElementById('file-input-wrapper').style.display = 'none';

        // 如果游戏已完成，需要重置状态
        if (this.gameCompleted) {
            this.gameCompleted = false;
            const modal = document.querySelector('.completion-modal');
            if (modal) modal.remove();
        }

        this.size = parseInt(this.difficultySelect.value);
        this.moves = 0;
        this.updateMovesDisplay();
        this.startTimer();
        this.createPuzzlePieces();
        this.shufflePieces();
    }

    createPuzzlePieces() {
        this.container.innerHTML = '';
        this.container.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        this.container.setAttribute('data-size', this.size);
        this.pieces = [];
        this.originalOrder = [];

        const pieceSize = 100;
        
        for (let i = 0; i < this.size * this.size; i++) {
            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';
            piece.dataset.originalIndex = i;
            piece.dataset.currentIndex = i;

            const row = Math.floor(i / this.size);
            const col = i % this.size;
            
            piece.style.backgroundImage = `url(${this.previewImage.src})`;
            piece.style.backgroundPosition = `${-col * pieceSize}% ${-row * pieceSize}%`;
            piece.style.backgroundSize = `${this.size * 100}%`;

            piece.draggable = true;
            piece.addEventListener('dragstart', (e) => this.handleDragStart(e));
            piece.addEventListener('dragend', (e) => this.handleDragEnd(e));
            piece.addEventListener('dragover', (e) => e.preventDefault());
            piece.addEventListener('drop', (e) => this.handleDrop(e));

            piece.addEventListener('touchstart', (e) => this.handleTouchStart(e));
            piece.addEventListener('touchmove', (e) => this.handleTouchMove(e));
            piece.addEventListener('touchend', (e) => this.handleTouchEnd(e));

            this.container.appendChild(piece);
            this.pieces.push(piece);
            this.originalOrder.push(i);
        }
    }

    shufflePieces() {
        let shuffledIndices = [...Array(this.pieces.length).keys()];
        
        for (let i = shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
        }
        
        shuffledIndices.forEach((newIndex, currentIndex) => {
            const piece = this.pieces[currentIndex];
            const row = Math.floor(newIndex / this.size);
            const col = newIndex % this.size;
            const pieceSize = 100;
            
            piece.style.backgroundPosition = `${-col * pieceSize}% ${-row * pieceSize}%`;
            piece.dataset.currentIndex = newIndex;
        });
    }

    handleDragStart(e) {
        this.draggedPiece = e.target;
        e.target.classList.add('dragging');
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    handleDrop(e) {
        e.preventDefault();
        const dropTarget = e.target;
        
        if (dropTarget.classList.contains('puzzle-piece') && this.draggedPiece !== dropTarget) {
            this.swapPieces(this.draggedPiece, dropTarget);
            this.moves++;
            this.updateMovesDisplay();
            this.checkWin();
        }
    }

    handleTouchStart(e) {
        const touch = e.touches[0];
        this.draggedPiece = e.target;
        this.draggedPiece.classList.add('dragging');
        
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        
        const rect = this.draggedPiece.getBoundingClientRect();
        this.initialX = rect.left;
        this.initialY = rect.top;
    }

    handleTouchMove(e) {
        if (!this.draggedPiece) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        
        this.draggedPiece.style.position = 'fixed';
        this.draggedPiece.style.left = `${this.initialX + deltaX}px`;
        this.draggedPiece.style.top = `${this.initialY + deltaY}px`;
    }

    handleTouchEnd(e) {
        if (!this.draggedPiece) return;
        
        const touch = e.changedTouches[0];
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (dropTarget && dropTarget.classList.contains('puzzle-piece') && 
            this.draggedPiece !== dropTarget) {
            this.swapPieces(this.draggedPiece, dropTarget);
            this.moves++;
            this.updateMovesDisplay();
            this.checkWin();
        }
        
        this.draggedPiece.style.position = '';
        this.draggedPiece.style.left = '';
        this.draggedPiece.style.top = '';
        this.draggedPiece.classList.remove('dragging');
        this.draggedPiece = null;
    }

    swapPieces(piece1, piece2) {
        const tempBackground = piece1.style.backgroundPosition;
        piece1.style.backgroundPosition = piece2.style.backgroundPosition;
        piece2.style.backgroundPosition = tempBackground;

        // 增加移动次数并检查是否完成
        this.moves++;
        this.updateMovesDisplay();
        this.checkWin();
    }

    checkWin() {
        // 检查每个拼图块的背景位置是否正确
        const isWin = this.pieces.every((piece, index) => {
            const row = Math.floor(index / this.size);
            const col = index % this.size;
            const expectedPosition = `${-col * 100}% ${-row * 100}%`;
            return piece.style.backgroundPosition === expectedPosition;
        });

        if (isWin) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            this.gameCompleted = true;
            
            // 禁用拖拽
            this.pieces.forEach(piece => {
                piece.draggable = false;
                piece.style.cursor = 'default';
                piece.replaceWith(piece.cloneNode(true));
            });

            // 根据难度级别显示不同的称号
            const titles = {
                2: "新手",
                3: "初级玩家",
                4: "中级玩家",
                5: "高级玩家",
                6: "专业玩家",
                7: "精英玩家",
                8: "大师级玩家",
                9: "传奇玩家",
                10: "拼图之神"
            };

            const completionModal = document.createElement('div');
            completionModal.className = 'completion-modal fade-in';
            completionModal.innerHTML = `
                <div class="completion-content">
                    <h2>🎉 恭喜完成！</h2>
                    <h3 style="color: var(--primary-color); margin: 10px 0;">
                        获得称号：${titles[this.size]}
                    </h3>
                    <div class="stats">
                        <p><i class="fas fa-th-large"></i> 难度：${this.size}x${this.size}</p>
                        <p><i class="fas fa-clock"></i> 用时：${this.timer}秒</p>
                        <p><i class="fas fa-arrows-alt"></i> 移动次数：${this.moves}</p>
                        <p><i class="fas fa-tachometer-alt"></i> 平均速度：${(this.moves/this.timer).toFixed(2)}步/秒</p>
                    </div>
                    <div class="actions">
                        <button onclick="document.getElementById('file-input-wrapper').style.display = 'block'; location.reload()" class="action-btn">
                            <i class="fas fa-redo"></i> 再玩一次
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(completionModal);

            // 添加点击事件关闭弹窗
            completionModal.addEventListener('click', (e) => {
                if (e.target === completionModal) {
                    completionModal.remove();
                }
            });

            // 添加样式
            if (!document.querySelector('#completion-styles')) {
                const style = document.createElement('style');
                style.id = 'completion-styles';
                style.textContent = `
                    .completion-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.8);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 1000;
                    }
                    .completion-content {
                        background: white;
                        padding: 30px;
                        border-radius: var(--border-radius);
                        text-align: center;
                        box-shadow: var(--shadow);
                        max-width: 90%;
                        width: 400px;
                    }
                    .completion-content h2 {
                        color: var(--primary-dark);
                        margin-bottom: 20px;
                    }
                    .completion-content .stats {
                        margin: 20px 0;
                    }
                    .completion-content .stats p {
                        margin: 10px 0;
                        color: var(--text-color);
                    }
                    .completion-content .actions {
                        margin-top: 20px;
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.timer = 0;
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);
    }

    updateTimerDisplay() {
        this.timerDisplay.textContent = `用时：${this.timer}秒`;
    }

    updateMovesDisplay() {
        this.movesDisplay.textContent = `移动次数：${this.moves}`;
    }

    showIntro() {
        const intro = document.createElement('div');
        intro.className = 'game-intro-modal fade-in';
        intro.innerHTML = `
            <div class="game-intro-content">
                <h2><i class="fas fa-puzzle-piece"></i> 拼图游戏说明</h2>
                <div class="game-rules">
                    <div class="rules-section">
                        <h3><i class="fas fa-gamepad"></i> 游戏玩法</h3>
                        <ul>
                            <li>选择并上传一张喜欢的图片</li>
                            <li>选择难度等级（2x2 到 10x10）</li>
                            <li>点击"开始游戏"打乱拼图</li>
                            <li>通过拖动拼图块还原完整图片</li>
                        </ul>
                    </div>
                    
                    <div class="rules-section">
                        <h3><i class="fas fa-mouse-pointer"></i> 操作方式</h3>
                        <ul>
                            <li>电脑：用鼠标拖放拼图块</li>
                            <li>手机：触摸拖动拼图块</li>
                            <li>拖动任意两个拼图块可以交换位置</li>
                        </ul>
                    </div>

                    <div class="rules-section">
                        <h3><i class="fas fa-trophy"></i> 游戏目标</h3>
                        <ul>
                            <li>还原出完整的图片</li>
                            <li>尽可能减少移动次数</li>
                            <li>挑战更短的完成时间</li>
                            <li>解锁更高难度的称号</li>
                        </ul>
                    </div>

                    <div class="rules-section privacy-section">
                        <h3><i class="fas fa-shield-alt"></i> 隐私保护</h3>
                        <ul>
                            <li>所有图片处理均在本地进行</li>
                            <li>不会上传任何图片到服务器</li>
                            <li>您的图片数据绝对安全</li>
                        </ul>
                    </div>
                </div>
                <button class="action-btn close-btn">
                    <i class="fas fa-times"></i> 关闭
                </button>
            </div>
        `;

        // 添加关闭功能
        intro.addEventListener('click', (e) => {
            if (e.target === intro || e.target.closest('.close-btn')) {
                intro.remove();
            }
        });

        document.body.appendChild(intro);
    }

    setupUploadGuide() {
        const guide = document.createElement('div');
        guide.className = 'upload-guide fade-in';
        guide.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>点击或拖放图片到这里开始游戏</p>
            <p>支持 jpg、png、gif 格式</p>
        `;
        
        const primaryDark = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-dark').trim();
        const primaryColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-color').trim();
        
        guide.addEventListener('click', () => {
            this.imageInput.click();
        });

        guide.addEventListener('dragover', (e) => {
            e.preventDefault();
            guide.style.borderColor = primaryDark;
        });

        guide.addEventListener('dragleave', () => {
            guide.style.borderColor = primaryColor;
        });

        guide.addEventListener('drop', (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageUpload({ target: { files: [file] } });
            }
        });

        const preview = document.getElementById('preview');
        preview.innerHTML = '';
        preview.appendChild(guide);
    }

    setupFileInputControl() {
        // 创建一个包装器来控制显示/隐藏
        const wrapper = document.createElement('div');
        wrapper.id = 'file-input-wrapper';
        this.imageInput.parentNode.insertBefore(wrapper, this.imageInput);
        wrapper.appendChild(this.imageInput);
    }

    async shareGame() {
        const url = window.location.href;
        
        try {
            // 尝试使用新的剪贴板 API
            await navigator.clipboard.writeText(url);
            
            // 创建一个临时提示元素
            const toast = document.createElement('div');
            toast.className = 'toast-message fade-in';
            toast.innerHTML = `
                <i class="fas fa-check-circle"></i>
                链接已复制到剪贴板！
            `;
            document.body.appendChild(toast);

            // 2秒后移除提示
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
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
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new PuzzleGame();
}); 