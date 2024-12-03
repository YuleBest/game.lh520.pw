// 通用的错误提示函数
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast toast-top toast-center z-50';
    toast.style.position = 'fixed';
    toast.innerHTML = `
        <div class="alert alert-${type}">
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// 通用的加载提示
function showLoading(message = '加载中...') {
    const loading = document.createElement('div');
    loading.className = 'fixed inset-0 flex items-center justify-center bg-base-200/50 z-50';
    loading.id = 'loadingOverlay';
    loading.innerHTML = `
        <div class="loading loading-spinner loading-lg text-primary"></div>
        <span class="ml-4">${message}</span>
    `;
    document.body.appendChild(loading);
}

function hideLoading() {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
        loading.remove();
    }
}

// 通用的确认对话框
function showConfirm(message, onConfirm, onCancel) {
    const dialog = document.createElement('div');
    dialog.className = 'modal modal-open';
    dialog.innerHTML = `
        <div class="modal-box">
            <h3 class="font-bold text-lg">确认</h3>
            <p class="py-4">${message}</p>
            <div class="modal-action">
                <button class="btn btn-primary" id="confirmBtn">确定</button>
                <button class="btn" id="cancelBtn">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);

    document.getElementById('confirmBtn').onclick = () => {
        dialog.remove();
        onConfirm?.();
    };

    document.getElementById('cancelBtn').onclick = () => {
        dialog.remove();
        onCancel?.();
    };
} 