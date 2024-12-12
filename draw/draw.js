document.addEventListener('DOMContentLoaded', function() {
    // 数字抽取相关元素
    const minNum = document.getElementById('minNum');
    const maxNum = document.getElementById('maxNum');
    const decimal = document.getElementById('decimal');
    const numberType = document.getElementById('numberType');
    const drawTimes = document.getElementById('drawTimes');
    const toggleWeight = document.getElementById('toggleWeight');
    const weightSettings = document.getElementById('weightSettings');
    const weightList = document.getElementById('weightList');
    const addWeight = document.getElementById('addWeight');
    const drawNumber = document.getElementById('drawNumber');
    const numberResult = document.getElementById('numberResult');

    // 自定义抽取相关元素
    const customItems = document.getElementById('customItems');
    const customDrawTimes = document.getElementById('customDrawTimes');
    const toggleCustomWeight = document.getElementById('toggleCustomWeight');
    const customWeightSettings = document.getElementById('customWeightSettings');
    const customWeightList = document.getElementById('customWeightList');
    const drawCustom = document.getElementById('drawCustom');
    const customResult = document.getElementById('customResult');

    // 权重设置显示切换
    toggleWeight.addEventListener('click', () => {
        weightSettings.classList.toggle('hidden');
        if (!weightSettings.classList.contains('hidden')) {
            updateWeightTips();
        }
    });

    toggleCustomWeight.addEventListener('click', () => {
        customWeightSettings.classList.toggle('hidden');
        if (!customWeightSettings.classList.contains('hidden')) {
            updateCustomWeightTips();
        }
    });

    // 添加数字权重
    addWeight.addEventListener('click', () => {
        const weightItem = document.createElement('div');
        weightItem.className = 'flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg transform transition-all duration-300 opacity-0 translate-y-4';
        weightItem.innerHTML = `
            <input type="number" placeholder="数字" class="weight-number w-24 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <input type="number" placeholder="权重" class="weight-value w-24 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" min="0" step="1" value="100">
            <button class="remove-weight px-2 py-1 text-red-600 hover:text-red-700 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        `;
        weightList.appendChild(weightItem);

        // 添加进入动画
        requestAnimationFrame(() => {
            weightItem.style.opacity = '1';
            weightItem.style.transform = 'translateY(0)';
        });

        // 添加删除动画
        weightItem.querySelector('.remove-weight').addEventListener('click', () => {
            weightItem.style.transform = 'translateX(100px)';
            weightItem.style.opacity = '0';
            setTimeout(() => weightItem.remove(), 300);
        });

        // 添加权重变化监听
        weightItem.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', onWeightChange);
        });
    });

    // 更新权重列表
    function updateWeightList() {
        if (weightSettings.classList.contains('hidden')) return;
        
        const min = parseInt(minNum.value) || 0;
        const max = parseInt(maxNum.value) || 100;
        weightList.innerHTML = '';
    }

    // 更新自定义项权重列表
    function updateCustomWeightList() {
        if (customWeightSettings.classList.contains('hidden')) return;
        
        const items = customItems.value.split('\n').filter(item => item.trim());
        customWeightList.innerHTML = items.map(item => `
            <div class="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                <span class="w-32 truncate">${item}</span>
                <input type="number" class="custom-weight w-24 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" min="0" step="1" value="100">
            </div>
        `).join('');

        // 添加权重变化监听
        customWeightList.querySelectorAll('.custom-weight').forEach(input => {
            input.addEventListener('input', updateCustomWeightTips);
        });
    }

    // 数字抽取逻辑
    drawNumber.addEventListener('click', () => {
        const min = parseFloat(minNum.value) || 0;
        const max = parseFloat(maxNum.value) || 100;
        const times = parseInt(drawTimes.value) || 1;
        const decimals = parseInt(decimal.value) || 0;
        
        let results = new Set();
        let weights = getNumberWeights();
        
        while (results.size < times) {
            let number;
            do {
                number = generateRandomNumber(min, max, decimals, weights);
            } while (
                results.has(number) || 
                !matchesNumberType(number, numberType.value)
            );
            results.add(number);
        }
        
        const resultsArray = Array.from(results);
        updateResultDisplay(resultsArray, 'number');
    });

    // 自定义项抽取逻辑
    drawCustom.addEventListener('click', () => {
        const items = customItems.value.split('\n').filter(item => item.trim());
        if (items.length === 0) {
            alert('请输入待抽取项目');
            return;
        }

        const times = Math.min(parseInt(customDrawTimes.value) || 1, items.length);
        let weights = getCustomWeights(items);
        let results = new Set();
        let attempts = 0;
        const maxAttempts = items.length * 3; // 防止无限循环
        
        // 创建可用项目池
        let availableItems = [...items];
        let availableWeights = [...weights];
        
        while (results.size < times && attempts < maxAttempts) {
            const index = drawWeightedIndex(availableWeights);
            if (index !== -1) {
                results.add(availableItems[index]);
                // 从可用池中移除已抽取的项目
                availableItems.splice(index, 1);
                availableWeights.splice(index, 1);
            }
            attempts++;
        }
        
        const resultsArray = Array.from(results);
        updateResultDisplay(resultsArray, 'custom');
    });

    // 生成随机数
    function generateRandomNumber(min, max, decimals, weights = null) {
        if (weights && weights.has(Math.floor(min))) {
            // 使用权重进行抽取
            return weightedRandomNumber(min, max, weights);
        }
        
        const range = max - min;
        const random = Math.random() * range + min;
        return parseFloat(random.toFixed(decimals));
    }

    // 权重随机数生成
    function weightedRandomNumber(min, max, weights) {
        const numbers = Array.from(weights.keys());
        const weightValues = Array.from(weights.values());
        const totalWeight = weightValues.reduce((a, b) => a + b, 0);
        
        let random = Math.random() * totalWeight;
        for (let i = 0; i < numbers.length; i++) {
            random -= weightValues[i];
            if (random <= 0) return numbers[i];
        }
        return generateRandomNumber(min, max, 0);
    }

    // 获取数字权重设置
    function getNumberWeights() {
        if (weightSettings.classList.contains('hidden')) return null;
        
        const weights = new Map();
        weightList.querySelectorAll('.weight-number').forEach((input, index) => {
            const number = parseInt(input.value);
            const weight = parseFloat(weightList.querySelectorAll('.weight-value')[index].value) || 1;
            if (!isNaN(number) && !isNaN(weight)) {
                weights.set(number, weight);
            }
        });
        return weights.size > 0 ? weights : null;
    }

    // 获取自定义项权重设置
    function getCustomWeights(items) {
        if (customWeightSettings.classList.contains('hidden')) {
            return items.map(() => 1);
        }
        
        return Array.from(customWeightList.querySelectorAll('.custom-weight'))
            .map(input => parseFloat(input.value) || 1);
    }

    // 抽取带权重的项目
    function drawWeightedItem(items, weights) {
        const index = drawWeightedIndex(weights);
        return index !== -1 ? items[index] : items[0];
    }

    // 添加新的权重索引抽取函数
    function drawWeightedIndex(weights) {
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        if (totalWeight <= 0) return -1;
        
        let random = Math.random() * totalWeight;
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) return i;
        }
        return weights.length - 1;
    }

    // 检查数字类型是否匹配
    function matchesNumberType(number, type) {
        switch (type) {
            case 'odd': return Math.floor(number) % 2 === 1;
            case 'even': return Math.floor(number) % 2 === 0;
            default: return true;
        }
    }

    // 初始化默认值
    minNum.value = 1;
    maxNum.value = 100;
    
    // 监听输入变化以更新权重列表
    customItems.addEventListener('input', updateCustomWeightList);

    // 修改权重提示相关函数
    function updateWeightTips() {
        const min = parseInt(minNum.value) || 0;
        const max = parseInt(maxNum.value) || 100;
        const times = parseInt(drawTimes.value) || 1;
        const range = max - min + 1;
        
        const weightTip = weightSettings.querySelector('.text-blue-700');
        weightTip.classList.add('whitespace-pre-line');
        
        let tipText = '权重说明：\n\n';
        
        if (times === 1) {
            tipText += '• 默认权重为 100\n';
            tipText += '• 权重值越大，被抽中的概率越高\n';
            tipText += '• 例如：权重 200 的数字比权重 100 的数字抽中概率高一倍\n';
            tipText += '• 建议权重范围：1-1000';
        } else if (times >= range) {
            tipText += '当前抽取次数已覆盖所有可能的数字，权重设置将不会生效。';
        } else {
            tipText += `• 需要抽取 ${times} 个不重复的数字\n`;
            tipText += '• 权重值越大的数字越优先被抽中\n';
            tipText += '• 默认权重为 100\n';
            tipText += '• 建议权重范围：1-1000';
        }

        // 添加具体示例
        if (times < range && !weightSettings.classList.contains('hidden')) {
            const weights = getNumberWeights();
            if (weights && weights.size > 0) {
                const totalWeight = Array.from(weights.values()).reduce((a, b) => a + b, 0);
                const normalWeight = 100; // 修改默认权重为100
                const totalNumbers = range - weights.size;
                
                tipText += '\n\n当前概率分布：';
                weights.forEach((weight, number) => {
                    const probability = (weight / (totalWeight + totalNumbers * normalWeight) * 100).toFixed(1);
                    tipText += `\n• 数字 ${number}（权重${weight}）≈ ${probability}%`;
                });
                
                if (totalNumbers > 0) {
                    const defaultProb = (normalWeight / (totalWeight + totalNumbers * normalWeight) * 100).toFixed(1);
                    tipText += `\n• 其他数字（默认权重${normalWeight}）≈ ${defaultProb}%`;
                }
            }
        }

        weightTip.textContent = tipText;
    }

    // 修改自定义项权重提示
    function updateCustomWeightTips() {
        const items = customItems.value.split('\n').filter(item => item.trim());
        const times = parseInt(customDrawTimes.value) || 1;
        
        const customWeightTip = customWeightSettings.querySelector('.text-blue-700');
        customWeightTip.classList.add('whitespace-pre-line');
        
        let tipText = '权重说明：\n\n';
        
        if (items.length === 0) {
            tipText += '请先输入待抽取项目。';
        } else if (times >= items.length) {
            tipText += '当前抽取次数将获取所有项目，权重设置将不会生效。';
        } else {
            tipText += `• 需要从 ${items.length} 个项目中抽取 ${times} 个\n`;
            tipText += '• 默认权重为 100\n';
            tipText += '• 权重值越大，被抽中的概率越高\n';
            tipText += '• 建议权重范围：1-1000\n';
            
            if (!customWeightSettings.classList.contains('hidden')) {
                const weights = getCustomWeights(items);
                const totalWeight = weights.reduce((a, b) => a + b, 0);
                
                if (totalWeight > 0) {
                    tipText += '\n当前概率分布：';
                    items.forEach((item, index) => {
                        const probability = (weights[index] / totalWeight * 100).toFixed(1);
                        if (index < 3 || index === items.length - 1) {
                            tipText += `\n• ${item}：${probability}%`;
                        } else if (index === 3) {
                            tipText += '\n• ...';
                        }
                    });
                }
            }
        }

        customWeightTip.textContent = tipText;
    }

    // 添加事件监听
    minNum.addEventListener('input', updateWeightTips);
    maxNum.addEventListener('input', updateWeightTips);
    drawTimes.addEventListener('input', updateWeightTips);
    customDrawTimes.addEventListener('input', updateCustomWeightTips);
    customItems.addEventListener('input', updateCustomWeightTips);

    // 修改权重输入监听
    function onWeightChange() {
        if (!weightSettings.classList.contains('hidden')) {
            updateWeightTips();
        }
    }

    // 添加常量定义
    const VISIBLE_CARDS = 6; // 默认显示的卡片数量

    // 添加结果显示相关函数
    function createResultCard(result, type = 'number') {
        const card = document.createElement('div');
        card.className = `transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
            type === 'number' 
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'
                : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
        } rounded-lg p-4 text-center cursor-pointer`;
        
        card.innerHTML = `
            <p class="text-2xl font-bold text-gray-900 dark:text-white transform transition-all duration-300 group-hover:scale-105">${result}</p>
        `;

        // 添加点击效果
        card.addEventListener('click', () => {
            card.classList.add('scale-95');
            setTimeout(() => card.classList.remove('scale-95'), 150);
        });

        return card;
    }

    function updateResultDisplay(results, type = 'number') {
        const container = document.getElementById(`${type}ResultCards`);
        const cardsContainer = container.querySelector('.grid');
        const expandBtn = document.getElementById(`${type}ExpandBtn`);
        const initialTip = document.getElementById(`${type}InitialTip`);
        
        // 隐藏初始提示，显示结果容器
        initialTip.classList.add('hidden');
        container.classList.remove('hidden');
        cardsContainer.innerHTML = '';
        
        // 创建所有卡片
        results.forEach((result, index) => {
            const card = createResultCard(result, type);
            if (index >= VISIBLE_CARDS) {
                card.classList.add('hidden');
            }
            cardsContainer.appendChild(card);
        });
        
        // 处理展开按钮
        if (results.length > VISIBLE_CARDS) {
            expandBtn.classList.remove('hidden');
            expandBtn.style.display = 'block';
            expandBtn.textContent = `展开更多结果 (${results.length - VISIBLE_CARDS}+)`;
            expandBtn.onclick = () => toggleResults(type, results.length);
        } else {
            expandBtn.classList.add('hidden');
            expandBtn.style.display = 'none';
        }
        
        // 添加进入动画
        requestAnimationFrame(() => {
            cardsContainer.querySelectorAll('div').forEach((card, index) => {
                if (index < VISIBLE_CARDS) {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(-20px)';
                    
                    setTimeout(() => {
                        card.style.transition = 'all 0.3s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, index * 100);
                }
            });
        });
    }

    function toggleResults(type, totalCount) {
        const container = document.getElementById(`${type}ResultCards`);
        const cards = container.querySelectorAll('.grid > div');
        const expandBtn = document.getElementById(`${type}ExpandBtn`);
        const isExpanded = expandBtn.textContent.includes('收起');
        
        cards.forEach((card, index) => {
            if (index >= VISIBLE_CARDS) {
                if (isExpanded) {
                    // 收起动画
                    card.style.transition = 'all 0.3s ease';
                    card.style.transform = 'translateY(0) scale(1)';
                    card.style.opacity = '1';
                    
                    setTimeout(() => {
                        card.style.transform = 'translateY(-20px) scale(0.95)';
                        card.style.opacity = '0';
                        setTimeout(() => card.classList.add('hidden'), 300);
                    }, index * 50);
                } else {
                    // 展开动画
                    card.classList.remove('hidden');
                    card.style.transform = 'translateY(20px) scale(0.95)';
                    card.style.opacity = '0';
                    
                    setTimeout(() => {
                        card.style.transition = 'all 0.3s ease';
                        card.style.transform = 'translateY(0) scale(1)';
                        card.style.opacity = '1';
                    }, index * 50);
                }
            }
        });
        
        // 添加按钮动画和状态更新
        expandBtn.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
        expandBtn.textContent = isExpanded 
            ? `展开更多结果 (${totalCount - VISIBLE_CARDS}+)`
            : '收起结果';
        expandBtn.style.display = 'block';
    }
});
