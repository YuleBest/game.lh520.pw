// 主题切换功能
document.addEventListener('DOMContentLoaded', function() {
    const themeController = document.querySelector('.theme-controller');
    if (!themeController) return;

    // 从本地存储加载主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeController.checked = savedTheme === 'dark';
    }

    // 监听主题切换
    themeController.addEventListener('change', function() {
        const theme = this.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });
}); 