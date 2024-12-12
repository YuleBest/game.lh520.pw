
// 随机跳转功能
function randomJump() {
    const links = [
        '/QR/',
        '/snake/',
        '/puzzle/',
        '/photo/',
        '/gobang/',
        '/linux/',
        '/minesweeper/',
        '/draw/',
        '/img2base64/'
    ];
    const randomIndex = Math.floor(Math.random() * links.length);
    window.location.href = links[randomIndex];
}

// 分享功能
function share() {
    if (navigator.share) {
        navigator.share({
            title: '六花我爱你',
            url: window.location.href
        })
        .catch(console.error);
    } else {
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                alert('链接已复制到剪贴板！');
            })
            .catch(console.error);
    }
}

// 深色模式切换
document.querySelector('.theme-controller')?.addEventListener('change', function(e) {
    document.documentElement.setAttribute('data-theme', e.target.checked ? 'dark' : 'light');
});