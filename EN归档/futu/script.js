document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const colorsContainer = document.getElementById('colorsContainer');
    const previewContainer = document.querySelector('.preview-container');

    // Handle click upload
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });

    // Handle file selection
    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            processImage(e.target.files[0]);
        }
    });

    // Handle drag and drop
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

    function processImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Calculate optimal display size
                const maxWidth = Math.min(window.innerWidth * 0.7, 1000);
                const maxHeight = window.innerHeight * 0.6;
                
                let finalWidth, finalHeight;
                const imgRatio = img.width / img.height;
                
                // Determine display size based on image ratio
                if (imgRatio > 2) { // Extra wide images
                    finalWidth = maxWidth * 0.8;
                    finalHeight = finalWidth / imgRatio;
                } else if (imgRatio < 0.5) { // Extra tall images
                    finalHeight = maxHeight * 0.8;
                    finalWidth = finalHeight * imgRatio;
                } else if (imgRatio > maxWidth / maxHeight) {
                    // Normal wide images
                    finalWidth = maxWidth;
                    finalHeight = maxWidth / imgRatio;
                } else {
                    // Normal tall images
                    finalHeight = maxHeight;
                    finalWidth = maxHeight * imgRatio;
                }
                
                // Set preview container dimensions
                previewContainer.style.width = `${finalWidth}px`;
                imagePreview.style.width = `${finalWidth}px`;
                imagePreview.style.height = `${finalHeight}px`;
                
                // Show container first
                previewContainer.style.display = 'block';
                
                // Set image source and add transition effect
                imagePreview.src = e.target.result;
                
                // Ensure transition effect executes properly
                requestAnimationFrame(() => {
                    previewContainer.classList.add('visible');
                });
                
                // Store image metadata
                imagePreview.dataset.metadata = JSON.stringify({
                    fileName: file.name,
                    fileSize: formatFileSize(file.size),
                    dimensions: `${img.width} × ${img.height}`,
                    lastModified: new Date(file.lastModified).toLocaleString(),
                    type: file.type
                });
                
                // Add click event listener
                imagePreview.addEventListener('click', showImageDetails);
                
                // Analyze colors
                analyzeColors(img);
                
                // Add page transition effect
                document.querySelector('.container').classList.add('image-uploaded');
                uploadArea.style.opacity = '0';
                setTimeout(() => {
                    uploadArea.style.display = 'none';
                }, 800);
                
                // Create color tip
                const colorTip = document.createElement('div');
                colorTip.className = 'color-tip';
                colorTip.style.display = 'none';
                document.body.appendChild(colorTip);
                
                // Create canvas for pixel color detection
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Add mousemove listener
                imagePreview.addEventListener('mousemove', (e) => {
                    const rect = imagePreview.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    // Calculate actual image coordinates
                    const scaleX = img.width / rect.width;
                    const scaleY = img.height / rect.height;
                    const imgX = Math.floor(x * scaleX);
                    const imgY = Math.floor(y * scaleY);
                    
                    // Ensure coordinates are within image bounds
                    if (imgX >= 0 && imgX < img.width && imgY >= 0 && imgY < img.height) {
                        const pixel = ctx.getImageData(imgX, imgY, 1, 1).data;
                        const rgb = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
                        const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`.toUpperCase();
                        
                        // Update color tip
                        colorTip.innerHTML = `
                            <div class="tip-color" style="background-color: ${rgb}"></div>
                            <div class="tip-values">
                                <span>${hex}</span>
                                <span>${pixel[0]}, ${pixel[1]}, ${pixel[2]}</span>
                            </div>
                        `;
                        
                        // Update tip position and visibility
                        if (!colorTip.classList.contains('visible')) {
                            colorTip.style.display = 'flex';
                            requestAnimationFrame(() => {
                                colorTip.classList.add('visible');
                            });
                        }
                        
                        // Get viewport dimensions
                        const viewportWidth = window.innerWidth;
                        const viewportHeight = window.innerHeight;
                        
                        // Update position
                        let tipX = e.clientX + 20;
                        let tipY = e.clientY - 30;
                        
                        // Set initial position to get tip dimensions
                        colorTip.style.left = `${tipX}px`;
                        colorTip.style.top = `${tipY}px`;
                        
                        // Get tip dimensions and adjust position
                        const tipRect = colorTip.getBoundingClientRect();
                        
                        // Ensure tip stays within viewport
                        if (tipX + tipRect.width > viewportWidth) {
                            tipX = e.clientX - tipRect.width - 20;
                        }
                        if (tipY < 0) {
                            tipY = e.clientY + 20;
                        }
                        if (tipY + tipRect.height > viewportHeight) {
                            tipY = e.clientY - tipRect.height - 20;
                        }
                        
                        // Set final position
                        colorTip.style.left = `${tipX}px`;
                        colorTip.style.top = `${tipY}px`;
                    }
                });
                
                // Hide tip when mouse leaves image
                imagePreview.addEventListener('mouseleave', () => {
                    colorTip.classList.remove('visible');
                    setTimeout(() => {
                        colorTip.style.display = 'none';
                    }, 150);
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function showImageDetails(e) {
        const metadata = JSON.parse(e.target.dataset.metadata);
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);

        const modal = document.createElement('div');
        modal.className = 'color-modal image-details-modal';
        
        modal.innerHTML = `
            <button class="modal-close">×</button>
            <h3 class="modal-title">Image Details</h3>
            <ul class="image-details-list modal-list">
                <li class="modal-list-item">
                    <span class="detail-label">File Name</span>
                    <span class="detail-value">${metadata.fileName}</span>
                </li>
                <li class="modal-list-item">
                    <span class="detail-label">Dimensions</span>
                    <span class="detail-value">${formatNumbersInText(metadata.dimensions)}</span>
                </li>
                <li class="modal-list-item">
                    <span class="detail-label">File Size</span>
                    <span class="detail-value">${formatNumbersInText(metadata.fileSize)}</span>
                </li>
                <li class="modal-list-item">
                    <span class="detail-label">File Type</span>
                    <span class="detail-value">${metadata.type}</span>
                </li>
                <li class="modal-list-item">
                    <span class="detail-label">Modified</span>
                    <span class="detail-value">${metadata.lastModified}</span>
                </li>
            </ul>
            <div class="modal-actions">
                <button class="action-button change-image">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"/>
                    </svg>
                    Change Image
                </button>
                <button class="action-button crop-image">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z"/>
                    </svg>
                    Crop Image
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
            modal.classList.add('visible');
        });

        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', closeModal);
        
        overlay.addEventListener('click', closeModal);

        const changeImageBtn = modal.querySelector('.change-image');
        changeImageBtn.addEventListener('click', () => {
            closeModal();
            document.getElementById('imageInput').click();
        });

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
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);

        const modal = document.createElement('div');
        modal.className = 'color-modal';
        
        const rgb = color.match(/\d+/g).join(', ');
        const hex = rgbToHex(color);
        const hsl = rgbToHSL(color).match(/\d+%?/g).join(', ');

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
            <button class="hide-color">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                </svg>
                Hide this color
            </button>
        `;
        
        document.body.appendChild(modal);
        
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
            modal.classList.add('visible');
        });

        // Close button event
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', closeModal);
        
        // Click overlay to close
        overlay.addEventListener('click', closeModal);

        // Hide color button event
        const hideColorBtn = modal.querySelector('.hide-color');
        hideColorBtn.addEventListener('click', () => {
            hiddenColors.add(hex);
            updateColorsDisplay();
            closeModal();
        });

        // Copy color values
        modal.querySelectorAll('.color-value-item').forEach(item => {
            item.addEventListener('click', () => {
                const colorValue = item.dataset.color;
                navigator.clipboard.writeText(colorValue);
                showCopyTooltip(item, 'Copied!');
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
        const ctx = canvas.getContext('2d');

        const maxSize = 400;
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
        } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height).data;
        const colorMap = new Map();
        const totalPixels = imageData.length / 4;

        const step = 4;
        const mask = 0xFC;

        // 第一步：收集所有颜色
        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i] & mask;
            const g = imageData[i + 1] & mask;
            const b = imageData[i + 2] & mask;
            const a = imageData[i + 3];
            
            if (a < 128 || 
                (r > 252 && g > 252 && b > 252) ||  // 接近纯白
                (r < 3 && g < 3 && b < 3) ||        // 接近纯黑
                (Math.abs(r - g) < 3 && Math.abs(g - b) < 3 && Math.abs(r - b) < 3)) { // 接近灰度
                continue;
            }

            const key = (r << 16) | (g << 8) | b;
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }

        // 第二步：合并相似颜色
        const mergedColors = new Map();
        const processedKeys = new Set();

        // 检查两个颜色是否应该合并
        function shouldMergeColors(hex1, hex2) {
            // 提取前三位和后三位
            const front1 = hex1.substring(1, 4);
            const back1 = hex1.substring(4, 7);
            const front2 = hex2.substring(1, 4);
            const back2 = hex2.substring(4, 7);

            // 计算差值
            const frontDiff = Math.abs(parseInt(front1, 16) - parseInt(front2, 16));
            const backDiff = Math.abs(parseInt(back1, 16) - parseInt(back2, 16));

            // 如果前三位或后三位的差值小于阈值，则合并
            const threshold = 100; // 可以调整这个阈值
            return frontDiff < threshold || backDiff < threshold;
        }

        // 合并颜色
        for (const [key, count] of colorMap.entries()) {
            if (processedKeys.has(key)) continue;

            let totalCount = count;
            let weightedR = ((key >> 16) & 0xFF) * count;
            let weightedG = ((key >> 8) & 0xFF) * count;
            let weightedB = (key & 0xFF) * count;
            
            processedKeys.add(key);

            // 查找并合并相似颜色
            for (const [otherKey, otherCount] of colorMap.entries()) {
                if (key === otherKey || processedKeys.has(otherKey)) continue;

                if (shouldMergeColors(key, otherKey)) {
                    weightedR += ((otherKey >> 16) & 0xFF) * otherCount;
                    weightedG += ((otherKey >> 8) & 0xFF) * otherCount;
                    weightedB += (otherKey & 0xFF) * otherCount;
                    totalCount += otherCount;
                    processedKeys.add(otherKey);
                }
            }

            const avgR = Math.round(weightedR / totalCount);
            const avgG = Math.round(weightedG / totalCount);
            const avgB = Math.round(weightedB / totalCount);
            
            mergedColors.set((avgR << 16) | (avgG << 8) | avgB, totalCount);
        }

        // 存储所有排序后的颜色
        allSortedColors = Array.from(mergedColors.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([key, count]) => {
                const r = (key >> 16) & 0xFF;
                const g = (key >> 8) & 0xFF;
                const b = key & 0xFF;
                return [`rgb(${r},${g},${b})`, count];
            });

        // 更新显示
        updateColorsDisplay();
    }

    function formatNumbersInText(text) {
        return text.replace(/(\d+(\.\d+)?)/g, '<span class="number">$1</span>');
    }

    function showCropperModal(imageSrc) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);

        const modal = document.createElement('div');
        modal.className = 'color-modal cropper-modal';
        
        modal.innerHTML = `
            <button class="modal-close">×</button>
            <h3 class="modal-title">Crop Image</h3>
            <div class="cropper-container">
                <img id="cropperImage" src="${imageSrc}" style="max-width: 100%;">
            </div>
            <div class="modal-actions">
                <button class="action-button" id="cropRotateLeft">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M7.11 8.53L5.7 7.11C4.8 8.27 4.24 9.61 4.07 11h2.02c.14-.87.49-1.72 1.02-2.47zM6.09 13H4.07c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.87-1.59-1.01-2.47zm1.01 5.32c1.16.9 2.51 1.44 3.9 1.61V17.9c-.87-.15-1.71-.49-2.46-1.03L7.1 18.32zM13 4.07V1L8.45 5.55 13 10V6.09c2.84.48 5 2.94 5 5.91s-2.16 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93s-3.05-7.44-7-7.93z"/>
                    </svg>
                    Rotate Left
                </button>
                <button class="action-button" id="cropRotateRight">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z"/>
                    </svg>
                    Rotate Right
                </button>
                <button class="action-button" id="cropConfirm">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                    </svg>
                    Confirm
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
            modal.classList.add('visible');
        });

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
            touchDragZoom: true,
            minContainerWidth: 200,
            minContainerHeight: 200,
            minCropBoxWidth: 50,
            minCropBoxHeight: 50,
        });

        document.getElementById('cropRotateLeft').addEventListener('click', () => {
            cropper.rotate(-90);
        });

        document.getElementById('cropRotateRight').addEventListener('click', () => {
            cropper.rotate(90);
        });

        document.getElementById('cropConfirm').addEventListener('click', () => {
            const canvas = cropper.getCroppedCanvas();
            canvas.toBlob((blob) => {
                const file = new File([blob], 'cropped-image.png', { type: 'image/png' });
                processImage(file);
                closeModal();
            }, 'image/png');
        });

        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', closeModal);
        
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

    // 首先添加一个存储被隐藏颜色的集合
    let hiddenColors = new Set();
    let allSortedColors = []; // 存储所有排序后的颜色，用于补充显示

    // 添加更新颜色显示的函数
    function updateColorsDisplay() {
        const colorsContainer = document.getElementById('colorsContainer');
        colorsContainer.innerHTML = '';
        
        let displayedCount = 0;
        const totalPixels = allSortedColors.reduce((sum, [_, count]) => sum + count, 0);

        for (const [color, count] of allSortedColors) {
            if (displayedCount >= 5) break;
            
            const hex = rgbToHex(color);
            if (hiddenColors.has(hex)) continue;

            const percentage = ((count / totalPixels) * 100).toFixed(1);
            const colorItem = document.createElement('div');
            colorItem.className = 'color-item';
            
            colorItem.innerHTML = `
                <div class="color-preview" style="background-color: ${color}"></div>
                <div class="color-info">
                    <div class="color-code"><span>${hex}</span></div>
                    <div class="color-percentage"><span>${percentage}</span>%</div>
                </div>
            `;
            colorsContainer.appendChild(colorItem);
            displayedCount++;
        }

        setupColorInteractions();
    }
});