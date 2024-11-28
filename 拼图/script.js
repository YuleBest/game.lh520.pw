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
        
        document.getElementById('showRules').addEventListener('click', () => this.showIntro());
        
        this.startButton.disabled = true;
        this.startButton.classList.add('disabled');
        this.startButton.title = 'Please upload an image first';
        
        document.getElementById('shareGame').addEventListener('click', () => this.shareGame());
        
        this.cropper = null;
        this.setupCropModal();
    }

    setupUploadGuide() {
        const guide = document.createElement('div');
        guide.className = 'upload-guide fade-in';
        guide.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Click or Drop Image Here to Start</p>
            <p>Supports jpg, png, gif formats</p>
        `;
        
        const handleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.imageInput.click();
        };

        guide.addEventListener('touchend', handleClick, { passive: false });
        guide.addEventListener('click', handleClick);

        guide.addEventListener('dragover', (e) => {
            e.preventDefault();
            guide.style.borderColor = '#ff7aa0';
        });

        guide.addEventListener('dragleave', () => {
            guide.style.borderColor = '#ff9eb5';
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

        this.imageInput.setAttribute('accept', 'image/*');
        this.imageInput.setAttribute('capture', 'camera');
    }

    setupFileInputControl() {
        const wrapper = document.createElement('div');
        wrapper.id = 'file-input-wrapper';
        this.imageInput.parentNode.insertBefore(wrapper, this.imageInput);
        wrapper.appendChild(this.imageInput);
    }

    bindEvents() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
    }

    startGame() {
        if (!this.previewImage.src) {
            alert('Please upload an image first!');
            return;
        }
        // ... 其余代码保持不变 ...
    }

    updateTimerDisplay() {
        this.timerDisplay.textContent = `Time: ${this.timer}s`;
    }

    updateMovesDisplay() {
        this.movesDisplay.textContent = `Moves: ${this.moves}`;
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file!');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                // 显示裁剪模态框
                this.showCropModal(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    showIntro() {
        const intro = document.createElement('div');
        intro.className = 'game-intro-modal fade-in';
        intro.innerHTML = `
            <div class="game-intro-content">
                <h2><i class="fas fa-puzzle-piece"></i> How to Play</h2>
                <div class="game-rules">
                    <div class="rules-section">
                        <h3><i class="fas fa-gamepad"></i> Gameplay</h3>
                        <ul>
                            <li>Upload your favorite image</li>
                            <li>Choose difficulty (2x2 to 10x10)</li>
                            <li>Click "Start Game" to shuffle</li>
                            <li>Move pieces to restore the image</li>
                        </ul>
                    </div>
                    
                    <div class="rules-section">
                        <h3><i class="fas fa-mouse-pointer"></i> Controls</h3>
                        <ul>
                            <li>Desktop: Drag and drop pieces</li>
                            <li>Mobile: Tap two pieces to swap</li>
                            <li>Any two pieces can be swapped</li>
                        </ul>
                    </div>

                    <div class="rules-section">
                        <h3><i class="fas fa-trophy"></i> Objectives</h3>
                        <ul>
                            <li>Restore the complete image</li>
                            <li>Minimize number of moves</li>
                            <li>Complete in shortest time</li>
                            <li>Unlock higher difficulty titles</li>
                        </ul>
                    </div>

                    <div class="rules-section privacy-section">
                        <h3><i class="fas fa-shield-alt"></i> Privacy</h3>
                        <ul>
                            <li>All image processing is local</li>
                            <li>No images are uploaded to servers</li>
                            <li>Your image data is completely safe</li>
                        </ul>
                    </div>
                </div>
                <button class="action-btn close-btn">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        `;

        intro.addEventListener('click', (e) => {
            if (e.target === intro || e.target.closest('.close-btn')) {
                intro.remove();
            }
        });

        document.body.appendChild(intro);
    }

    checkWin() {
        // ... 检查逻辑保持不变 ...
        if (isWin) {
            const titles = {
                2: "Beginner",
                3: "Novice",
                4: "Intermediate",
                5: "Advanced",
                6: "Professional",
                7: "Expert",
                8: "Master",
                9: "Grandmaster",
                10: "Puzzle God"
            };

            const completionModal = document.createElement('div');
            completionModal.className = 'completion-modal fade-in';
            completionModal.innerHTML = `
                <div class="completion-content">
                    <h2>🎉 Congratulations!</h2>
                    <h3 style="color: var(--primary-color); margin: 10px 0;">
                        Title Earned: ${titles[this.size]}
                    </h3>
                    <div class="stats">
                        <p><i class="fas fa-th-large"></i> Difficulty: ${this.size}x${this.size}</p>
                        <p><i class="fas fa-clock"></i> Time: ${this.timer}s</p>
                        <p><i class="fas fa-arrows-alt"></i> Moves: ${this.moves}</p>
                        <p><i class="fas fa-tachometer-alt"></i> Speed: ${(this.moves/this.timer).toFixed(2)} moves/s</p>
                    </div>
                    <div class="actions">
                        <button onclick="location.reload()" class="action-btn">
                            <i class="fas fa-redo"></i> Play Again
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(completionModal);
        }
    }

    async shareGame() {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            const toast = document.createElement('div');
            toast.className = 'toast-message fade-in';
            toast.innerHTML = `
                <i class="fas fa-check-circle"></i>
                Link copied to clipboard!
            `;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        } catch (err) {
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            alert('Link copied to clipboard!');
        }
    }

    setupCropModal() {
        this.cropModal = document.getElementById('cropModal');
        this.cropImage = document.getElementById('cropImage');
        
        document.getElementById('cropConfirm').addEventListener('click', () => this.confirmCrop());
        document.getElementById('cropCancel').addEventListener('click', () => this.cancelCrop());
    }

    showCropModal(imageUrl) {
        this.cropModal.style.display = 'flex';
        this.cropImage.src = imageUrl;
        
        // 销毁之前的裁剪实例
        if (this.cropper) {
            this.cropper.destroy();
        }

        // 初始化裁剪器
        this.cropper = new Cropper(this.cropImage, {
            aspectRatio: 1,
            viewMode: 1,
            guides: true,
            center: true,
            highlight: false,
            background: false,
            autoCropArea: 0.8,
            responsive: true,
        });
    }

    confirmCrop() {
        if (this.cropper) {
            // 获取裁剪后的图片数据
            const croppedCanvas = this.cropper.getCroppedCanvas({
                width: 600,  // 设置输出尺寸
                height: 600,
                imageSmoothingQuality: 'high'
            });

            const croppedImage = croppedCanvas.toDataURL('image/jpeg', 0.9);
            
            // 更新预览
            const preview = document.getElementById('preview');
            preview.innerHTML = `
                <h3>Image Preview</h3>
                <img id="preview-image" src="${croppedImage}" alt="preview image">
            `;
            this.previewImage = document.getElementById('preview-image');
            
            // 启用开始按钮
            this.startButton.disabled = false;
            this.startButton.classList.remove('disabled');
            this.startButton.title = 'Click to start game';

            // 清理裁剪器
            this.cropper.destroy();
            this.cropper = null;
            this.cropModal.style.display = 'none';
        }
    }

    cancelCrop() {
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
        this.cropModal.style.display = 'none';
        this.imageInput.value = ''; // 清除文件输入
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PuzzleGame();
}); 