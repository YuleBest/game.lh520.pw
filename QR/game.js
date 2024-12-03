// 添加回车键生成二维码的功能
document.getElementById('text').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        generateQRCode();
    }
});

function generateQRCode() {
    const text = document.getElementById('text').value;
    const qrContainer = document.getElementById('qrcode');
    const downloadBtn = document.getElementById('download');
    
    // 清空容器
    qrContainer.innerHTML = '';
    downloadBtn.style.display = 'none';

    if (text.trim() !== '') {
        try {
            // 使用 qrcodejs 库生成二维码
            new QRCode(qrContainer, {
                text: text,
                width: 300,
                height: 300,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });

            // 显示下载按钮
            downloadBtn.style.display = 'inline-flex';
            
            // 下载功能
            downloadBtn.onclick = function() {
                const img = qrContainer.querySelector('img');
                if (img) {
                    const link = document.createElement('a');
                    link.href = img.src;
                    link.download = 'qrcode.png';
                    link.click();
                }
            };
        } catch (error) {
            console.error('生成二维码失败:', error);
            showToast('生成二维码失败，请重试', 'error');
        }
    } else {
        showToast('请输入文本或网页链接', 'error');
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast toast-top toast-center';
    toast.innerHTML = `
        <div class="alert alert-${type}">
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
} 