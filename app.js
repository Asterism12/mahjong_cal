// 注册 Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const winnerRadios = document.querySelectorAll('input[name="winner"]');
    const loseInputs = document.querySelectorAll('.lose-input');
    const jinInputs = document.querySelectorAll('.jin-input');
    const resetBtn = document.getElementById('reset-btn');
    const saveNextBtn = document.getElementById('save-next-btn');
    const deleteLastBtn = document.getElementById('delete-last-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const viewHistoryBtn = document.getElementById('view-history-btn');
    const historyOutput = document.getElementById('history-output');
    const historySection = document.getElementById('history-section');
    const playerCards = document.querySelectorAll('.player-card');

    // 历史对局数据
    let gameHistory = [];
    
    // 初始化：从 localStorage 加载历史数据
    loadGameHistory();
    
    // 初始化状态
    updateWinnerState();
    updateTotalScores();

    // 监听赢家选择变化
    winnerRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            updateWinnerState();
            calculateScores();
        });
    });

    // 监听输入变化
    loseInputs.forEach(input => {
        input.addEventListener('input', calculateScores);
    });

    jinInputs.forEach(input => {
        input.addEventListener('input', calculateScores);
    });

    // 重置按钮
    resetBtn.addEventListener('click', () => {
        loseInputs.forEach(input => input.value = '');
        jinInputs.forEach(input => input.value = '');
        calculateScores();
    });
    
    // 保存并下一局按钮
    saveNextBtn.addEventListener('click', () => {
        saveCurrentGame();
    });
    
    // 删除最后一局按钮
    deleteLastBtn.addEventListener('click', () => {
        deleteLastGame();
    });
    
    // 清除历史对局按钮
    clearHistoryBtn.addEventListener('click', () => {
        clearGameHistory();
    });

    // 查看历史记录按钮
    viewHistoryBtn.addEventListener('click', () => {
        if (!historySection) return;
        if (historySection.hasAttribute('hidden')) {
            historySection.removeAttribute('hidden');
            renderHistory();
        } else {
            historySection.setAttribute('hidden', '');
        }
    });

    function updateWinnerState() {
        const winnerIndex = getWinnerIndex();
        playerCards.forEach((card, index) => {
            if (index === winnerIndex) {
                card.classList.add('is-winner');
                // 清空赢家的输分输入框（虽然隐藏了，但为了逻辑清晰）
                const loseInput = card.querySelector('.lose-input');
                if (loseInput) loseInput.value = '';
            } else {
                card.classList.remove('is-winner');
            }
        });
    }

    function getWinnerIndex() {
        let winnerIndex = 0;
        winnerRadios.forEach(radio => {
            if (radio.checked) {
                winnerIndex = parseInt(radio.value);
            }
        });
        return winnerIndex;
    }

    function calculateScores() {
        const winnerIndex = getWinnerIndex();
        const scores = [0, 0, 0, 0];
        
        // 1. 计算基础分（输赢分）
        let totalLost = 0;
        
        // 遍历所有输家
        for (let i = 0; i < 4; i++) {
            if (i !== winnerIndex) {
                const loseInput = document.querySelector(`.lose-input[data-index="${i}"]`);
                const lostScore = parseInt(loseInput.value) || 0;
                
                // 输家扣分
                scores[i] -= lostScore;
                // 累计输分给赢家
                totalLost += lostScore;
            }
        }
        
        // 赢家得分
        scores[winnerIndex] += totalLost;

        // 2. 计算精数分
        // 规则：每有1个“精数”，自己从其他三名玩家各获取1分。
        // 即：自己 +3分，其他人各 -1分。
        
        const jinValues = [];
        for (let i = 0; i < 4; i++) {
            const jinInput = document.querySelector(`.jin-input[data-index="${i}"]`);
            jinValues[i] = parseInt(jinInput.value) || 0;
        }

        // 计算精数对每个人的影响
        for (let i = 0; i < 4; i++) {
            const myJin = jinValues[i];
            if (myJin > 0) {
                // 自己加分 (3 * 精数)
                scores[i] += (3 * myJin);
                
                // 其他人减分 (1 * 精数)
                for (let j = 0; j < 4; j++) {
                    if (i !== j) {
                        scores[j] -= myJin;
                    }
                }
            }
        }

        // 3. 更新 UI
        updateScoreDisplay(scores);
    }

    function updateScoreDisplay(scores) {
        for (let i = 0; i < 4; i++) {
            const scoreSpan = document.getElementById(`score-${i}`);
            const score = scores[i];
            
            scoreSpan.textContent = score > 0 ? `+${score}` : score;
            
            // 颜色样式
            scoreSpan.className = 'current-score';
            if (score > 0) {
                scoreSpan.classList.add('positive');
            } else if (score < 0) {
                scoreSpan.classList.add('negative');
            }
        }
    }
    
    // 加载历史对局数据
    function loadGameHistory() {
        const saved = localStorage.getItem('mahjongGameHistory');
        if (saved) {
            try {
                gameHistory = JSON.parse(saved);
            } catch (e) {
                console.error('加载历史数据失败:', e);
                gameHistory = [];
            }
        }
    }
    
    // 保存历史对局数据到 localStorage
    function saveGameHistory() {
        localStorage.setItem('mahjongGameHistory', JSON.stringify(gameHistory));
    }
    
    // 更新累计得分显示
    function updateTotalScores() {
        const totalScores = [0, 0, 0, 0];
        
        // 累加历史对局的得分
        gameHistory.forEach(game => {
            for (let i = 0; i < 4; i++) {
                totalScores[i] += game.scores[i];
            }
        });
        
        // 更新UI显示
        for (let i = 0; i < 4; i++) {
            const totalScoreSpan = document.getElementById(`total-score-${i}`);
            const score = totalScores[i];
            
            totalScoreSpan.textContent = score > 0 ? `+${score}` : score;
            
            // 颜色样式
            totalScoreSpan.className = 'total-score';
            if (score > 0) {
                totalScoreSpan.classList.add('positive');
            } else if (score < 0) {
                totalScoreSpan.classList.add('negative');
            }
        }
    }
    
    // 保存当前对局并开始下一局
    function saveCurrentGame() {
        const winnerIndex = getWinnerIndex();
        const scores = [0, 0, 0, 0];
        
        // 重新计算当前得分（复制calculateScores的逻辑）
        let totalLost = 0;
        for (let i = 0; i < 4; i++) {
            if (i !== winnerIndex) {
                const loseInput = document.querySelector(`.lose-input[data-index="${i}"]`);
                const lostScore = parseInt(loseInput.value) || 0;
                scores[i] -= lostScore;
                totalLost += lostScore;
            }
        }
        scores[winnerIndex] += totalLost;
        
        const jinValues = [];
        for (let i = 0; i < 4; i++) {
            const jinInput = document.querySelector(`.jin-input[data-index="${i}"]`);
            jinValues[i] = parseInt(jinInput.value) || 0;
        }
        
        for (let i = 0; i < 4; i++) {
            const myJin = jinValues[i];
            if (myJin > 0) {
                scores[i] += (3 * myJin);
                for (let j = 0; j < 4; j++) {
                    if (i !== j) {
                        scores[j] -= myJin;
                    }
                }
            }
        }
        
        // 检查是否所有得分都是0（没有输入任何数据）
        const hasData = scores.some(score => score !== 0);
        if (!hasData) {
            alert('请先输入得分数据');
            return;
        }
        
        // 保存当前对局到历史记录
        gameHistory.push({
            scores: scores,
            timestamp: new Date().toISOString()
        });
        
        // 保存到 localStorage
        saveGameHistory();
        
        // 更新累计得分
        updateTotalScores();
        refreshHistoryIfVisible();
        
        // 重置当前输入
        loseInputs.forEach(input => input.value = '');
        jinInputs.forEach(input => input.value = '');
        calculateScores();
        
        alert(`已保存第 ${gameHistory.length} 局`);
    }
    
    // 删除最后一局
    function deleteLastGame() {
        if (gameHistory.length === 0) {
            alert('没有历史对局可以删除');
            return;
        }
        
        if (confirm(`确定要删除第 ${gameHistory.length} 局吗？`)) {
            gameHistory.pop();
            saveGameHistory();
            updateTotalScores();
            refreshHistoryIfVisible();
            alert('已删除最后一局');
        }
    }
    
    // 清除所有历史对局
    function clearGameHistory() {
        if (gameHistory.length === 0) {
            alert('没有历史对局');
            return;
        }
        
        if (confirm(`确定要清除所有 ${gameHistory.length} 局历史记录吗？`)) {
            gameHistory = [];
            saveGameHistory();
            updateTotalScores();
            refreshHistoryIfVisible();
            alert('已清除所有历史对局');
        }
    }

    // 根据可见性刷新历史输出
    function refreshHistoryIfVisible() {
        if (isHistoryVisible()) {
            renderHistory();
        }
    }

    // 判断历史区域是否可见
    function isHistoryVisible() {
        return historySection && !historySection.hasAttribute('hidden');
    }

    // 渲染历史记录 JSON
    function renderHistory() {
        if (!historyOutput) return;
        if (gameHistory.length === 0) {
            historyOutput.textContent = '暂无历史记录';
            return;
        }

        const historyView = gameHistory.map((game, index) => ({
            index: index + 1,
            timestamp: game.timestamp,
            scores: game.scores
        }));

        const prettyJson = JSON.stringify(historyView, null, 2);
        historyOutput.innerHTML = syntaxHighlight(prettyJson);
    }

    // 简易 JSON 语法高亮（保持 JSON 纯文本结构）
    function syntaxHighlight(jsonString) {
        const escaped = jsonString
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        return escaped.replace(/("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"\s*:?)|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g, match => {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                cls = /:$/.test(match) ? 'json-key' : 'json-string';
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return `<span class="${cls}">${match}</span>`;
        });
    }
});