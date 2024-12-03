function submitFeedback() {
    const feedback = document.getElementById('feedback').value.trim();
    
    if (!feedback) {
        showToast('请输入反馈内容', 'error');
        return;
    }

    // 这里可以添加发送到服务器的逻辑
    
    document.getElementById('feedback').value = '';
    showToast('感谢你的反馈！', 'success');
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