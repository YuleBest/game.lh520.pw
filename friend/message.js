function submitMessage() {
    const name = document.getElementById('name').value.trim();
    const message = document.getElementById('message').value.trim();
    
    if (!name || !message) {
        showToast('请填写昵称和留言内容', 'error');
        return;
    }

    // 创建新留言元素
    const messageElement = document.createElement('div');
    messageElement.className = 'chat chat-start';
    messageElement.innerHTML = `
        <div class="chat-header opacity-50">
            ${name}
            <time class="text-xs opacity-50 ml-1">${new Date().toLocaleString()}</time>
        </div>
        <div class="chat-bubble">${message}</div>
    `;

    // 添加到留言列表
    const messageList = document.getElementById('messageList');
    messageList.insertBefore(messageElement, messageList.firstChild);

    // 清空输入框
    document.getElementById('name').value = '';
    document.getElementById('message').value = '';

    showToast('留言成功！', 'success');
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