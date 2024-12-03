document.addEventListener('DOMContentLoaded', function() {
    // 搜索功能
    const searchInput = document.getElementById('navSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                handleSearch();
            }
        });
    }
});

// 搜索处理函数
function handleSearch() {
    const searchInput = document.getElementById('navSearchInput');
    const searchText = searchInput.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
        const description = card.querySelector('.text-base-content\\/70')?.textContent.toLowerCase() || '';
        
        const isMatch = title.includes(searchText) || description.includes(searchText);
        
        if (isMatch) {
            card.style.display = '';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
            card.classList.add('card-matched');
        } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.classList.remove('card-matched');
            setTimeout(() => {
                if (!searchInput.value.toLowerCase().trim().includes(searchText)) {
                    card.style.display = 'none';
                }
            }, 300);
        }
    });

    // 如果搜索框为空，移除所有匹配标记
    if (!searchText) {
        cards.forEach(card => {
            card.classList.remove('card-matched');
        });
    }
}

// 随机跳转功能
function randomJump() {
    const links = [
        '/QR/',
        '/snake/',
        '/puzzle/',
        '/photo/',
        '/gobang/',
        '/linux/'
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