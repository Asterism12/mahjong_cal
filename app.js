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
    const playerCards = document.querySelectorAll('.player-card');

    // 初始化状态
    updateWinnerState();

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

        // 2. 计算筋数分
        // 规则：每有1个“筋数”，自己从其他三名玩家各获取1分。
        // 即：自己 +3分，其他人各 -1分。
        
        const jinValues = [];
        for (let i = 0; i < 4; i++) {
            const jinInput = document.querySelector(`.jin-input[data-index="${i}"]`);
            jinValues[i] = parseInt(jinInput.value) || 0;
        }

        // 计算筋数对每个人的影响
        for (let i = 0; i < 4; i++) {
            const myJin = jinValues[i];
            if (myJin > 0) {
                // 自己加分 (3 * 筋数)
                scores[i] += (3 * myJin);
                
                // 其他人减分 (1 * 筋数)
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
});