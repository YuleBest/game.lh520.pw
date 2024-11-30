document.getElementById('searchInput').addEventListener('input', function() {
    const filter = this.value.toLowerCase();
    const items = document.querySelectorAll('#functionList li');

    items.forEach((item, index) => {
        const textContent = item.textContent.toLowerCase();
        const itemNumber = (index + 1).toString(); // 获取序号并转换为字符串

        // 检查搜索关键词是否匹配文本内容或序号
        if (textContent.includes(filter) || itemNumber.includes(filter)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
});