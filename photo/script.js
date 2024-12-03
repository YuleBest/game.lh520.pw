document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const colorsContainer = document.getElementById('colorsContainer');
    const previewContainer = document.querySelector('.preview-container');

    // 处理点击上传
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });

    // 处理文件选择
    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            processImage(e.target.files[0]);
        }
    });

    // 处理拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#666';
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processImage(file);
        }
    });

    // 在 processImage 函数开始处添加文件检查
    async function processImage(file) {
        // 检查文件格式
        const supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!supportedFormats.includes(file.type)) {
            showConfirmDialog({
                title: '不支持的文件格式',
                message: '目前仅支持 JPG、PNG、WebP 和 GIF 格式的图片',
                confirmText: '我知道了',
                showCancel: false,
                onConfirm: () => {
                    // 重置文件输入
                    document.getElementById('imageInput').value = '';
                }
            });
            return;
        }

        // 检查文件大小
        const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
        if (file.size > MAX_FILE_SIZE) {
            showConfirmDialog({
                title: '文件过大',
                message: '上传的图片大于 3MB，可能会导致处理失败。建议压缩后再上传。',
                confirmText: '继续上传',
                cancelText: '取消',
                onConfirm: () => processImageFile(file),
                onCancel: () => {
                    // 重置文件输入
                    document.getElementById('imageInput').value = '';
                }
            });
            return;
        }

        // 如果检查都通过，处理图片
        processImageFile(file);
    }

    // 将原来 processImage 函数的主体移到这个新函数中
    function processImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // 计算最佳显示尺寸
                const maxWidth = Math.min(window.innerWidth * 0.7, 1000);
                const maxHeight = window.innerHeight * 0.6;
                
                let finalWidth, finalHeight;
                const imgRatio = img.width / img.height;
                
                // 根据图片比例决定显示尺寸
                if (imgRatio > 2) { // 特别宽的图片
                    finalWidth = maxWidth * 0.8;
                    finalHeight = finalWidth / imgRatio;
                } else if (imgRatio < 0.5) { // 特别高的图片
                    finalHeight = maxHeight * 0.8;
                    finalWidth = finalHeight * imgRatio;
                } else if (imgRatio > maxWidth / maxHeight) {
                    // 正常宽图
                    finalWidth = maxWidth;
                    finalHeight = maxWidth / imgRatio;
                } else {
                    // 正常高图
                    finalHeight = maxHeight;
                    finalWidth = maxHeight * imgRatio;
                }
                
                // 设置预览容器的尺寸
                previewContainer.style.width = `${finalWidth}px`;
                imagePreview.style.width = `${finalWidth}px`;
                imagePreview.style.height = `${finalHeight}px`;
                
                // 先显示容器
                previewContainer.style.display = 'block';
                
                // 设置图片源并添加过渡效果
                imagePreview.src = e.target.result;
                imagePreview.setAttribute('data-original-src', e.target.result); // 保存原始图片路径
                
                // 使用 requestAnimationFrame 确保过渡效果正常执行
                requestAnimationFrame(() => {
                    previewContainer.classList.add('visible');
                });
                
                // 存储图片元数据
                imagePreview.dataset.metadata = JSON.stringify({
                    fileName: file.name,
                    fileSize: formatFileSize(file.size),
                    dimensions: `${img.width} × ${img.height}`,
                    lastModified: new Date(file.lastModified).toLocaleString(),
                    type: file.type
                });
                
                // 添加点击事件监听器
                imagePreview.addEventListener('click', showImageDetails);
                
                // 分析颜色
                analyzeColors(img);
                
                // 添加页面转换效果
                document.querySelector('.container').classList.add('image-uploaded');
                uploadArea.style.opacity = '0';
                setTimeout(() => {
                    uploadArea.style.display = 'none';
                }, 800);
                
                // 创建颜色提示器
                const colorTip = document.createElement('div');
                colorTip.className = 'color-tip';
                colorTip.style.display = 'none';
                document.body.appendChild(colorTip);
                
                // 创建用于获取像素颜色的 canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // 添加鼠标移动监听
                imagePreview.addEventListener('mousemove', (e) => {
                    const rect = imagePreview.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    // 计算实际图片上的坐标
                    const scaleX = img.width / rect.width;
                    const scaleY = img.height / rect.height;
                    const imgX = Math.floor(x * scaleX);
                    const imgY = Math.floor(y * scaleY);
                    
                    // 确保坐标在图片范围内
                    if (imgX >= 0 && imgX < img.width && imgY >= 0 && imgY < img.height) {
                        const pixel = ctx.getImageData(imgX, imgY, 1, 1).data;
                        const rgb = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
                        const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`.toUpperCase();
                        
                        // 更新颜色提示器
                        colorTip.innerHTML = `
                            <div class="tip-color" style="background-color: ${rgb}"></div>
                            <div class="tip-values">
                                <span>${hex}</span>
                                <span>${pixel[0]}, ${pixel[1]}, ${pixel[2]}</span>
                            </div>
                        `;
                        
                        // 更新提示器位置和容
                        if (!colorTip.classList.contains('visible')) {
                            colorTip.style.display = 'flex';
                            requestAnimationFrame(() => {
                                colorTip.classList.add('visible');
                            });
                        }
                        
                        // 获取视窗大小
                        const viewportWidth = window.innerWidth;
                        const viewportHeight = window.innerHeight;
                        
                        // 更新位置
                        let tipX = e.clientX + 20;
                        let tipY = e.clientY - 30;
                        
                        // 先设置位置以获取提示框尺寸
                        colorTip.style.left = `${tipX}px`;
                        colorTip.style.top = `${tipY}px`;
                        
                        // 获取提示框尺寸并调整位置
                        const tipRect = colorTip.getBoundingClientRect();
                        
                        // 确保提示框不会超出视窗
                        if (tipX + tipRect.width > viewportWidth) {
                            tipX = e.clientX - tipRect.width - 20;
                        }
                        if (tipY < 0) {
                            tipY = e.clientY + 20;
                        }
                        if (tipY + tipRect.height > viewportHeight) {
                            tipY = e.clientY - tipRect.height - 20;
                        }
                        
                        // 最终设置位置
                        colorTip.style.left = `${tipX}px`;
                        colorTip.style.top = `${tipY}px`;
                    }
                });
                
                // 鼠标离开图片时隐藏提示器
                imagePreview.addEventListener('mouseleave', () => {
                    colorTip.classList.remove('visible');
                    // 等待过渡动画完成后隐藏
                    setTimeout(() => {
                        colorTip.style.display = 'none';
                    }, 150); // 与 CSS 过时间相匹配
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // 新增显示图片详情弹窗的函数
    function showImageDetails(e) {
        const metadata = JSON.parse(e.target.dataset.metadata);
        
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);

        // 创建弹窗
        const modal = document.createElement('div');
        modal.className = 'color-modal image-details-modal';
        
        modal.innerHTML = `
            <button class="modal-close">×</button>
            <h3 class="modal-title">图片信息</h3>
            <ul class="image-details-list modal-list">
                <li class="modal-list-item">
                    <span class="detail-label">文件名</span>
                    <span class="detail-value">${metadata.fileName}</span>
                </li>
                <li class="modal-list-item">
                    <span class="detail-label">尺寸</span>
                    <span class="detail-value">${formatNumbersInText(metadata.dimensions)}</span>
                </li>
                <li class="modal-list-item">
                    <span class="detail-label">文件大小</span>
                    <span class="detail-value">${formatNumbersInText(metadata.fileSize)}</span>
                </li>
                <li class="modal-list-item">
                    <span class="detail-label">文件类型</span>
                    <span class="detail-value">${metadata.type}</span>
                </li>
                <li class="modal-list-item">
                    <span class="detail-label">修改时间</span>
                    <span class="detail-value">${metadata.lastModified}</span>
                </li>
            </ul>
            <div class="modal-actions">
                <button class="action-button change-image">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"/>
                    </svg>
                    更换图片
                </button>
                <button class="action-button crop-image">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z"/>
                    </svg>
                    裁切图片
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 显示遮罩和弹窗
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
            modal.classList.add('visible');
        });

        // 关闭按钮事件
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', closeModal);
        
        // 点击遮罩关闭
        overlay.addEventListener('click', closeModal);

        // 更换图片按钮事件
        const changeImageBtn = modal.querySelector('.change-image');
        changeImageBtn.addEventListener('click', () => {
            closeModal();
            document.getElementById('imageInput').click();
        });

        // 裁切图片按钮事件
        const cropImageBtn = modal.querySelector('.crop-image');
        cropImageBtn.addEventListener('click', () => {
            closeModal();
            showCropperModal(imagePreview.src);
        });

        function closeModal() {
            overlay.classList.remove('visible');
            modal.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
                modal.remove();
            }, 300);
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 颜色值转换和复制功能
    function setupColorInteractions() {
        document.querySelectorAll('.color-item').forEach(item => {
            const colorPreview = item.querySelector('.color-preview');
            const color = colorPreview.style.backgroundColor;
            
            item.addEventListener('click', () => {
                showColorModal(color);
            });
        });
    }

    function showColorModal(color) {
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);

        // 创建弹窗
        const modal = document.createElement('div');
        modal.className = 'color-modal';
        
        // 获取不同格式的颜色值
        const rgb = color.match(/\d+/g).join(', '); // 只保留数字部分
        const hex = rgbToHex(color);
        const hsl = rgbToHSL(color).match(/\d+%?/g).join(', '); // 只保留数字和百分号部分

        modal.innerHTML = `
            <button class="modal-close">×</button>
            <div class="modal-color-preview" style="background-color: ${color}"></div>
            <ul class="color-values-list">
                <li class="color-value-item" data-color="${hex}">
                    <span class="color-value-label">HEX</span>
                    <span class="value"><span class="number">${hex}</span></span>
                </li>
                <li class="color-value-item" data-color="rgb(${rgb})">
                    <span class="color-value-label">RGB</span>
                    <span class="value"><span class="number">${rgb}</span></span>
                </li>
                <li class="color-value-item" data-color="hsl(${hsl})">
                    <span class="color-value-label">HSL</span>
                    <span class="value"><span class="number">${hsl}</span></span>
                </li>
            </ul>
        `;
        
        document.body.appendChild(modal);
        
        // 显示遮罩和弹窗
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
            modal.classList.add('visible');
        });

        // 关闭按件
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', closeModal);
        
        // 点击遮罩关闭
        overlay.addEventListener('click', closeModal);

        // 复制颜色值
        modal.querySelectorAll('.color-value-item').forEach(item => {
            item.addEventListener('click', () => {
                const colorValue = item.dataset.color;
                navigator.clipboard.writeText(colorValue);
                showCopyTooltip(item, '已复制');
            });
        });

        function closeModal() {
            overlay.classList.remove('visible');
            modal.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
                modal.remove();
            }, 300);
        }
    }

    function showCopyTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'copy-tooltip';
        tooltip.textContent = text;
        
        const rect = element.getBoundingClientRect();
        tooltip.style.top = `${rect.top - 30}px`;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.transform = 'translate(-50%, -50%)';
        
        document.body.appendChild(tooltip);
        requestAnimationFrame(() => tooltip.style.opacity = '1');
        
        setTimeout(() => {
            tooltip.style.opacity = '0';
            setTimeout(() => tooltip.remove(), 200);
        }, 1500);
    }

    function rgbToHSL(rgb) {
        const values = rgb.match(/\d+/g).map(Number);
        const [r, g, b] = values.map(x => x / 255);
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }

    function rgbToHex(rgb) {
        const values = rgb.match(/\d+/g);
        return '#' + values.map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
    }

    function analyzeColors(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { 
            willReadFrequently: true,
            alpha: false
        });
        
        // 设置最大分析尺寸
        const MAX_ANALYSIS_SIZE = 800; // 最分析尺寸
        const MAX_TOTAL_PIXELS = 640000; // 800x800 像素
        
        let width = img.width;
        let height = img.height;
        
        // 计算总像素数
        const totalImagePixels = width * height;
        
        // 如果图片总像素数超过限制，计算缩放比例
        if (totalImagePixels > MAX_TOTAL_PIXELS) {
            const scale = Math.sqrt(MAX_TOTAL_PIXELS / totalImagePixels);
            width = Math.floor(width * scale);
            height = Math.floor(height * scale);
        } else {
            // 如果单边超过最大尺寸，等比例缩放
            const maxDimension = Math.max(width, height);
            if (maxDimension > MAX_ANALYSIS_SIZE) {
                const scale = MAX_ANALYSIS_SIZE / maxDimension;
                width = Math.floor(width * scale);
                height = Math.floor(height * scale);
            }
        }
        
        // 设置canvas尺寸为压缩后的尺寸
        canvas.width = width;
        canvas.height = height;
        
        // 使用双线性插值进行缩放，以获得更好的颜色平均效果
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height);
        
        // 取像素数据
        const imageData = ctx.getImageData(0, 0, width, height).data;
        const totalPixels = imageData.length / 4;
        
        // 使用 Map 存储颜色计数
        const colorCounts = new Map();
        
        // 分析颜色
        for (let i = 0; i < imageData.length; i += 4) {
            // 将 RGB 值向下取整到最接近的 16 的倍数，减少颜色数量
            const r = imageData[i] & 0xf0;
            const g = imageData[i + 1] & 0xf0;
            const b = imageData[i + 2] & 0xf0;
            
            // 计算颜色的亮度
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            
            // 根据亮度对颜色进行分组
            let colorKey;
            if (brightness < 32) { // 非常暗的颜色
                colorKey = `rgb(0,0,0)`;
            } else if (brightness > 224) { // 非常亮的颜色
                colorKey = `rgb(255,255,255)`;
            } else {
                // 计算主导颜色通道
                if (Math.abs(r - g) < 32 && Math.abs(g - b) < 32 && Math.abs(r - b) < 32) {
                    // 如果个通道接近，认为是灰色
                    const gray = Math.round((r + g + b) / 3);
                    colorKey = `rgb(${gray},${gray},${gray})`;
                } else {
                    // 保持原始颜色
                    colorKey = `rgb(${r},${g},${b})`;
                }
            }
            
            colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
        }
        
        // 合并相似颜色的逻辑保持不变
        const mergedColors = new Map();
        for (const [color, count] of colorCounts.entries()) {
            const [r, g, b] = color.match(/\d+/g).map(Number);
            let merged = false;
            
            for (const [existingColor, existingCount] of mergedColors.entries()) {
                const [er, eg, eb] = existingColor.match(/\d+/g).map(Number);
                
                // 使用欧几里得距离判断颜色相似度
                const distance = Math.sqrt(
                    Math.pow(r - er, 2) +
                    Math.pow(g - eg, 2) +
                    Math.pow(b - eb, 2)
                );
                
                if (distance < 48) {
                    // 合并颜色，使用加权平均
                    const totalCount = count + existingCount;
                    const newR = Math.round((r * count + er * existingCount) / totalCount);
                    const newG = Math.round((g * count + eg * existingCount) / totalCount);
                    const newB = Math.round((b * count + eb * existingCount) / totalCount);
                    
                    mergedColors.delete(existingColor);
                    mergedColors.set(`rgb(${newR},${newG},${newB})`, totalCount);
                    merged = true;
                    break;
                }
            }
            
            if (!merged) {
                mergedColors.set(color, count);
            }
        }
        
        // 其余显示逻辑保持不变...
        const sortedColors = Array.from(mergedColors.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        // 获取主要颜色并设置为背景
        const mainColor = sortedColors[0][0];
        const mainRgb = mainColor.match(/\d+/g);
        const darkenedColor = `rgb(${mainRgb.map(x => Math.floor(x * 0.7)).join(',')})`;
        
        // 移除原有的渐变背景
        const existingBefore = document.querySelector('.background-overlay');
        if (existingBefore) {
            existingBefore.remove();
        }
        
        // 创建新的背景层
        const backgroundOverlay = document.createElement('div');
        backgroundOverlay.className = 'background-overlay';
        backgroundOverlay.style.backgroundColor = darkenedColor;
        document.body.appendChild(backgroundOverlay);

        // 示结果
        colorsContainer.innerHTML = '';
        sortedColors.forEach(([color, count]) => {
            const percentage = ((count / totalPixels) * 100).toFixed(1);
            const colorItem = document.createElement('div');
            colorItem.className = 'color-item';
            
            // 将 RGB 转换为十六进制
            const rgb = color.match(/\d+/g);
            const hex = '#' + rgb.map(x => {
                const hex = parseInt(x).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('').toUpperCase();

            colorItem.innerHTML = `
                <div class="color-preview" style="background-color: ${color}"></div>
                <div class="color-info">
                    <div class="color-code"><span>${hex}</span></div>
                    <div class="color-percentage"><span>${percentage}</span>%</div>
                </div>
            `;
            colorsContainer.appendChild(colorItem);
        });

        // 设置颜色交互
        setupColorInteractions();
        
        // 显示颜色容器
        colorsContainer.style.opacity = '1';
    }

    function formatNumbersInText(text) {
        return text.replace(/(\d+(\.\d+)?)/g, '<span class="number">$1</span>');
    }

    // 添加裁切能相关代码
    function showCropperModal(imageSrc) {
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);

        // 创建裁切弹窗
        const modal = document.createElement('div');
        modal.className = 'color-modal cropper-modal';
        
        modal.innerHTML = `
            <button class="modal-close">×</button>
            <h3 class="modal-title">裁切图片</h3>
            <div class="cropper-container">
                <img id="cropperImage" src="${imageSrc}" style="max-width: 100%;">
            </div>
            <div class="modal-actions">
                <button class="action-button" id="cropRotateLeft">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M7.11 8.53L5.7 7.11C4.8 8.27 4.24 9.61 4.07 11h2.02c.14-.87.49-1.72 1.02-2.47zM6.09 13H4.07c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.87-1.59-1.01-2.47zm1.01 5.32c1.16.9 2.51 1.44 3.9 1.61V17.9c-.87-.15-1.71-.49-2.46-1.03L7.1 18.32zM13 4.07V1L8.45 5.55 13 10V6.09c2.84.48 5 2.94 5 5.91s-2.16 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93s-3.05-7.44-7-7.93z"/>
                    </svg>
                    向左旋转
                </button>
                <button class="action-button" id="cropRotateRight">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z"/>
                    </svg>
                    向右旋转
                </button>
                <button class="action-button" id="cropConfirm">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                    </svg>
                    确认裁切
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 显示遮罩和弹窗
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
            modal.classList.add('visible');
        });

        // 初始化 Cropper
        const image = document.getElementById('cropperImage');
        const cropper = new Cropper(image, {
            aspectRatio: NaN,
            viewMode: 1,
            dragMode: 'move',
            background: false,
            autoCropArea: 0.8,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: true,
            responsive: true,
            restore: false,
            modal: true,
            guides: true,
            highlight: false,
            zoomOnWheel: true,
            wheelZoomRatio: 0.1,
            // 添加触摸支持
            touchDragZoom: true,     // 允许触摸拖动时进行缩放
            minContainerWidth: 200,  // 设置最小容器宽度
            minContainerHeight: 200, // 设置最小容器高度
            minCropBoxWidth: 50,     // 设置最小裁切框宽度
            minCropBoxHeight: 50,    // 设置最小裁切框高度
        });

        // 旋转按钮事件
        document.getElementById('cropRotateLeft').addEventListener('click', () => {
            cropper.rotate(-90);
        });

        document.getElementById('cropRotateRight').addEventListener('click', () => {
            cropper.rotate(90);
        });

        // 确认裁切按钮事件
        document.getElementById('cropConfirm').addEventListener('click', () => {
            const canvas = cropper.getCroppedCanvas();
            canvas.toBlob((blob) => {
                const file = new File([blob], 'cropped-image.png', { type: 'image/png' });
                processImage(file);
                closeModal();
            }, 'image/png');
        });

        // 关闭按钮事件
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', closeModal);
        
        // 点击遮罩关闭
        overlay.addEventListener('click', closeModal);

        function closeModal() {
            cropper.destroy();
            overlay.classList.remove('visible');
            modal.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
                modal.remove();
            }, 300);
        }
    }

    // 优化颜色展示
    function showColorResults(sortedColors, totalPixels) {
        // 使用文档片段减少重排
        const fragment = document.createDocumentFragment();
        
        sortedColors.forEach(([color, count]) => {
            const percentage = ((count / totalPixels) * 100).toFixed(1);
            const colorItem = document.createElement('div');
            colorItem.className = 'color-item';
            
            const rgb = color.match(/\d+/g);
            const hex = rgb.map(x => {
                const hex = parseInt(x).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('').toUpperCase();
            
            colorItem.innerHTML = `
                <div class="color-preview" style="background-color: ${color}"></div>
                <div class="color-info">
                    <div class="color-code"><span>#${hex}</span></div>
                    <div class="color-percentage"><span>${percentage}</span>%</div>
                </div>
            `;
            fragment.appendChild(colorItem);
        });
        
        colorsContainer.innerHTML = '';
        colorsContainer.appendChild(fragment);
    }

    // 添加图片压缩函数
    function compressImage(file, options) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;
                    
                    // 计算缩放比例
                    if (width > options.maxWidth) {
                        height = height * (options.maxWidth / width);
                        width = options.maxWidth;
                    }
                    if (height > options.maxHeight) {
                        width = width * (options.maxHeight / height);
                        height = options.maxHeight;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(
                        (blob) => {
                            resolve(new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            }));
                        },
                        'image/jpeg',
                        options.quality
                    );
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // 添加分享按钮事件监听
    const shareButton = document.getElementById('shareButton');
    shareButton.addEventListener('click', handleShare);
    
    // 处理分享功能
    async function handleShare() {
        const imagePreview = document.getElementById('imagePreview');
        
        if (!imagePreview.src || imagePreview.src === '') {
            // 如果没有上传图片，复制链接
            const url = window.location.href;
            try {
                await navigator.clipboard.writeText(url);
                showToast('链接已复制，快去分享给朋友吧！');
            } catch (err) {
                showToast('复制链接失败，请手动复制浏览器地址');
            }
            return;
        }
        
        // 创建分享图片
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置画布尺寸和参数
        const padding = 40;
        const colorItemSize = 50; // 颜色块尺寸
        const colorResultHeight = 100; // 颜色结果区域高度
        const colorSpacingY = 25; // 减小颜色区域和图片的间距（从40改为25）
        
        // 加载原始图片
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imagePreview.getAttribute('data-original-src') || imagePreview.src;
        });
        
        // 计算合适的显示尺寸，稍微缩小一点图片
        const maxWidth = Math.min(1000, window.screen.width * 1.8); // 减小最大宽度
        const maxHeight = Math.min(1400, window.screen.height * 1.8); // 减小最大高度
        
        let displayWidth = img.width;
        let displayHeight = img.height;
        
        // 保持宽高比的同时确保图片不会太大
        const aspectRatio = displayWidth / displayHeight;
        if (displayWidth > maxWidth) {
            displayWidth = maxWidth;
            displayHeight = displayWidth / aspectRatio;
        }
        if (displayHeight > maxHeight) {
            displayHeight = maxHeight;
            displayWidth = displayHeight * aspectRatio;
        }
        
        // 额外缩小 10%
        displayWidth *= 0.9;
        displayHeight *= 0.9;
        
        // 设置画布尺寸，确保足够容纳所有内容
        const canvasWidth = Math.max(displayWidth + (padding * 2), 800);
        canvas.width = canvasWidth;
        canvas.height = displayHeight + colorResultHeight + colorSpacingY + (padding * 2);
        
        // 设置高质量渲染
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 绘制背景
        const background = document.querySelector('.background-overlay');
        const backgroundColor = background ? background.style.backgroundColor : 'rgb(35, 35, 35)';
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 居中绘制图片，添加圆角
        const imageX = (canvas.width - displayWidth) / 2;
        const imageY = padding;
        const radius = 16; // 圆角大小
        
        // 创建圆角矩形路径
        ctx.beginPath();
        ctx.moveTo(imageX + radius, imageY);
        ctx.lineTo(imageX + displayWidth - radius, imageY);
        ctx.quadraticCurveTo(imageX + displayWidth, imageY, imageX + displayWidth, imageY + radius);
        ctx.lineTo(imageX + displayWidth, imageY + displayHeight - radius);
        ctx.quadraticCurveTo(imageX + displayWidth, imageY + displayHeight, imageX + displayWidth - radius, imageY + displayHeight);
        ctx.lineTo(imageX + radius, imageY + displayHeight);
        ctx.quadraticCurveTo(imageX, imageY + displayHeight, imageX, imageY + displayHeight - radius);
        ctx.lineTo(imageX, imageY + radius);
        ctx.quadraticCurveTo(imageX, imageY, imageX + radius, imageY);
        ctx.closePath();
        
        // 创建裁剪区域
        ctx.save();
        ctx.clip();
        
        // 绘制图片
        ctx.drawImage(img, imageX, imageY, displayWidth, displayHeight);
        
        // 恢复裁剪区域
        ctx.restore();
        
        // 绘制颜色结果
        const colors = Array.from(document.querySelectorAll('.color-item'));
        
        // 计算颜色块的布局，使其与图片对齐
        const colorAreaWidth = displayWidth; // 使用与图片相同的宽度
        const spacing = (colorAreaWidth - (colorItemSize * colors.length)) / (colors.length - 1);
        let x = imageX; // 从图片的左边缘开始
        const y = displayHeight + colorSpacingY + padding; // 调整y坐标计算，移除额外的padding
        
        // 设置文字样式
        ctx.font = 'bold 16px Montserrat';
        ctx.textAlign = 'center';
        
        colors.forEach((item) => {
            const colorPreview = item.querySelector('.color-preview');
            const colorCode = item.querySelector('.color-code span').textContent;
            
            // 绘制圆形颜色预览
            ctx.beginPath();
            ctx.arc(x + (colorItemSize / 2), y + (colorItemSize / 2), colorItemSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = colorPreview.style.backgroundColor;
            ctx.fill();
            
            // 添加圆形边框
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 绘制颜色代码
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2;
            
            ctx.fillText(colorCode, x + (colorItemSize / 2), y + colorItemSize + 30);
            
            // 重置阴影
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // 移动到下一个位置
            x += colorItemSize + spacing;
        });
        
        // 创建弹窗
        showShareModal(canvas);
    }
    
    // 显示分享弹窗
    function showShareModal(canvas) {
        const modal = document.createElement('div');
        modal.className = 'color-modal share-modal visible';
        
        // 检测是否支持系统分享
        const canShare = navigator.share && navigator.canShare;
        
        modal.innerHTML = `
            <button class="modal-close">×</button>
            <h3 class="modal-title">分享</h3>
            <div class="share-preview">
                <img src="${canvas.toDataURL('image/png', 1.0)}" alt="分享预览">
            </div>
            <div class="modal-actions">
                <button class="action-button save-local">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
                    </svg>
                    保存到相册
                </button>
                    <button class="action-button share-friends">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                        </svg>
                        分享给朋友
                    </button>
            </div>
        `;
        
        // 创建遮罩
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay visible';
        
        document.body.appendChild(overlay);
        document.body.appendChild(modal);
        
        // 绑定事件
        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        // 保存本地
        modal.querySelector('.save-local').addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = '芙图分享.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
        
        // 分享给朋友
        modal.querySelector('.share-friends').addEventListener('click', async () => {
            try {
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
                const file = new File([blob], '芙图分享.png', { type: 'image/png' });
                
                if (canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: '芙图 - 图片配色分析',
                        text: '我用芙图分析了这张图片的配色，快来看看吧！'
                    });
                } else {
                    // 如果不支持文件分享，尝试复制链接
                    await navigator.clipboard.writeText(window.location.href);
                    showToast('链接已复制，快去分享给朋友吧！');
                }
            } catch (err) {
                showToast('分享失败，请尝试保存图片后手动分享');
            }
        });
        
        function closeModal() {
            modal.classList.remove('visible');
            overlay.classList.remove('visible');
            setTimeout(() => {
                modal.remove();
                overlay.remove();
            }, 300);
        }
    }
    
    // 显示提示消息
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });
        
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // 添加确认对话框组件
    function showConfirmDialog({ title, message, confirmText = '确定', cancelText = '取消', showCancel = true, onConfirm, onCancel }) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        
        dialog.innerHTML = `
            <div class="confirm-dialog-content">
                <h3 class="confirm-dialog-title">${title}</h3>
                <p class="confirm-dialog-message">${message}</p>
                <div class="confirm-dialog-actions">
                    ${showCancel ? `
                        <button class="action-button cancel-button">
                            ${cancelText}
                        </button>
                    ` : ''}
                    <button class="action-button confirm-button">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        document.body.appendChild(dialog);
        
        // 显示动画
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
            dialog.classList.add('visible');
        });
        
        // 绑定事件
        const confirmBtn = dialog.querySelector('.confirm-button');
        const cancelBtn = dialog.querySelector('.cancel-button');
        
        function closeDialog() {
            overlay.classList.remove('visible');
            dialog.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
                dialog.remove();
            }, 300);
        }
        
        confirmBtn.addEventListener('click', () => {
            closeDialog();
            onConfirm?.();
        });
        
        if (showCancel) {
            cancelBtn.addEventListener('click', () => {
                closeDialog();
                onCancel?.();
            });
        }
    }
});
