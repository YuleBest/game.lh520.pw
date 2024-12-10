document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const previewImage = document.getElementById('previewImage');
    const base64Output = document.getElementById('base64Output');
    const base64Input = document.getElementById('base64Input');
    const convertedImage = document.getElementById('convertedImage');
    const copyBase64Btn = document.getElementById('copyBase64Btn');
    const convertToImageBtn = document.getElementById('convertToImageBtn');
    const charCount = document.getElementById('charCount');
    const downloadBtn = document.getElementById('downloadBtn');

    // 优化的图片压缩函数
    async function compressImage(file) {
        // 创建一个离屏canvas用于压缩
        const offscreenCanvas = document.createElement('canvas');
        const ctx = offscreenCanvas.getContext('2d');
        
        // 创建图片对象
        const img = await createImage(file);
        
        // 计算压缩后的尺寸
        let { width, height } = calculateDimensions(img.width, img.height);
        
        // 设置canvas尺寸
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);
        
        // 渐进压缩
        return await progressiveCompress(offscreenCanvas);
    }

    // 创建图片对象的Promise包装
    function createImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    // 计算压缩后的尺寸
    function calculateDimensions(width, height) {
        const maxSize = 1200;
        let newWidth = width;
        let newHeight = height;

        if (width > height && width > maxSize) {
            newHeight = Math.round((height * maxSize) / width);
            newWidth = maxSize;
        } else if (height > maxSize) {
            newWidth = Math.round((width * maxSize) / height);
            newHeight = maxSize;
        }

        return { width: newWidth, height: newHeight };
    }

    // 渐进压缩
    async function progressiveCompress(canvas, targetSize = 1024 * 1024) {
        const qualities = [0.8, 0.6, 0.4, 0.2];
        let compressedDataUrl;

        for (let quality of qualities) {
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            if (compressedDataUrl.length <= targetSize) {
                break;
            }
        }

        return compressedDataUrl;
    }

    // 修改文件处理函数，使用防抖
    const handleFileSelect = debounce(async function(file) {
        if (!file.type.match('image.*')) {
            alert('请选择图片文件！');
            return;
        }

        try {
            // 显示加载状态
            previewImage.style.opacity = '0.5';
            base64Output.value = '处理中...';

            if (file.size > 1024 * 1024) {
                if (confirm('图片大于1MB，转换后的Base64字符可能较长。是否要压缩图片？')) {
                    const compressedDataUrl = await compressImage(file);
                    updateUI(compressedDataUrl);
                    return;
                }
            }

            const reader = new FileReader();
            reader.onload = e => updateUI(e.target.result);
            reader.readAsDataURL(file);
        } catch (error) {
            alert('处理图片时发生错误，请重试。');
            console.error(error);
        } finally {
            previewImage.style.opacity = '1';
        }
    }, 300);

    // 更新UI的辅助函数
    function updateUI(dataUrl) {
        previewImage.src = dataUrl;
        previewImage.style.display = 'block';
        base64Output.value = dataUrl;
        updateCharCount(dataUrl.length);
    }

    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // 更新字符计数显示
    function updateCharCount(count) {
        const mb = (count / 1024 / 1024).toFixed(2);
        charCount.textContent = `字符数: ${count.toLocaleString()} (${mb}MB)`;
        
        // 如果大于1MB，添加警告样式
        if (count > 1024 * 1024) {
            charCount.classList.add('text-amber-600', 'dark:text-amber-400');
        } else {
            charCount.classList.remove('text-amber-600', 'dark:text-amber-400');
        }
    }

    // 文件拖放处理
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.borderColor = '#2196f3';
    });

    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.borderColor = '#ccc';
    });

    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.borderColor = '#ccc';
        
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    });

    // 文件选择处理
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        handleFileSelect(file);
    });

    // 复制Base64编码
    copyBase64Btn.addEventListener('click', function() {
        base64Output.select();
        document.execCommand('copy');
        alert('Base64编码已复制到剪贴板！');
    });

    // Base64转图片
    convertToImageBtn.addEventListener('click', function() {
        const base64String = base64Input.value.trim();
        if (!base64String) {
            alert('请输入Base64编码！');
            return;
        }

        try {
            convertedImage.src = base64String;
            convertedImage.style.display = 'block';
            downloadBtn.classList.remove('hidden');
        } catch (error) {
            alert('Base64编码格式错误！');
        }
    });

    // 添加下载功能
    downloadBtn.addEventListener('click', function() {
        const base64String = convertedImage.src;
        // 创建下载链接
        const link = document.createElement('a');
        link.download = 'converted-image.' + getImageExtension(base64String);
        link.href = base64String;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // 获取图片扩展名的辅助函数
    function getImageExtension(base64String) {
        const match = base64String.match(/^data:image\/(\w+);base64,/);
        return match ? match[1] : 'png'; // 默认为png
    }

    // 监听base64Input的输入，实时更新字符计数
    base64Input.addEventListener('input', function() {
        updateCharCount(this.value.length);
    });
}); 