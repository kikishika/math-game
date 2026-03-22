let currentOperation = '';
let currentLevel = 1;
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let startTime = 0;
let timerInterval = null;
let currentInput = '';
let timeElapsed = 0;
let isSubmitting = false;

let gameHistory = [];
let myRewards = [];

function loadFromLocal() {
    try {
        const savedHistory = localStorage.getItem('mathGameHistory');
        if(savedHistory) {
            gameHistory = JSON.parse(savedHistory);
        }
        const savedRewards = localStorage.getItem('mathGameRewards');
        if(savedRewards) {
            myRewards = JSON.parse(savedRewards);
        }
    } catch(e) {
        console.error("데이터 로드 오류:", e);
        gameHistory = [];
        myRewards = [];
    }
}
loadFromLocal();

function saveToLocal() {
    try {
        localStorage.setItem('mathGameHistory', JSON.stringify(gameHistory));
        localStorage.setItem('mathGameRewards', JSON.stringify(myRewards));
    } catch(e) {
        console.error("데이터 저장 오류:", e);
    }
}

function goToHome() {
    clearInterval(timerInterval);
    showScreen('screen-main');
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('active');
    });
    const target = document.getElementById(screenId);
    target.classList.remove('hidden');
    // 약간의 지연을 주어 CSS transisiton 애니메이션이 적용되도록 함
    setTimeout(() => {
        target.classList.add('active');
    }, 10);
}

function selectOperation(op) {
    currentOperation = op;
    let opName = '';
    if(op === '+') opName = '더하기';
    if(op === '-') opName = '빼기';
    if(op === '*') opName = '곱하기';
    if(op === '/') opName = '나누기';
    
    document.getElementById('selected-op-text').textContent = `선택한 연산: ${opName}`;
    showScreen('screen-difficulty');
}

function selectDifficulty(level) {
    currentLevel = level;
    startGame();
}

function startGame() {
    questions = [];
    currentQuestionIndex = 0;
    score = 0;
    timeElapsed = 0;
    currentInput = '';
    
    generateQuestions();
    
    document.getElementById('time-elapsed').textContent = '0';
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    
    showScreen('screen-game');
    renderQuestion();
}

function updateTimer() {
    const now = Date.now();
    timeElapsed = Math.floor((now - startTime) / 1000);
    document.getElementById('time-elapsed').textContent = timeElapsed;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestions() {
    for (let i = 0; i < 5; i++) {
        let num1, num2, answer;
        
        let min = currentLevel === 1 ? 1 : 10;
        let max = currentLevel === 1 ? 9 : 99;

        if (currentOperation === '+') {
            num1 = getRandomInt(min, max);
            num2 = getRandomInt(min, max);
            answer = num1 + num2;
        } else if (currentOperation === '-') {
            num1 = getRandomInt(min, max);
            num2 = getRandomInt(min, max);
            // 초등학생 난이도에 맞게 큰 수에서 작은 수를 빼도록 설정
            if (num1 < num2) {
                let temp = num1;
                num1 = num2;
                num2 = temp;
            }
            answer = num1 - num2;
        } else if (currentOperation === '*') {
            // 2자리 수 곱하기는 (10~19) * (2~9) 수준으로 조정
            let m1_min = currentLevel === 1 ? 2 : 10;
            let m1_max = currentLevel === 1 ? 9 : 19; 
            let m2_min = currentLevel === 1 ? 2 : 2;
            let m2_max = currentLevel === 1 ? 9 : 9;
            num1 = getRandomInt(m1_min, m1_max);
            num2 = getRandomInt(m2_min, m2_max);
            
            // 순서 섞기
            if (Math.random() > 0.5) {
                let temp = num1; num1 = num2; num2 = temp;
            }
            answer = num1 * num2;
        } else if (currentOperation === '/') {
            // 나누어 떨어지는 문제로 출제
            let div2 = currentLevel === 1 ? getRandomInt(2, 9) : getRandomInt(2, 9);
            let ans = currentLevel === 1 ? getRandomInt(1, 9) : getRandomInt(10, 20);
            num1 = div2 * ans;
            num2 = div2;
            answer = ans;
        }

        let opSymbol = currentOperation;
        if(opSymbol === '*') opSymbol = '×';
        if(opSymbol === '/') opSymbol = '÷';

        questions.push({
            text: `${num1} ${opSymbol} ${num2} = ?`,
            answer: answer
        });
    }
}

function renderQuestion() {
    document.getElementById('current-q').textContent = currentQuestionIndex + 1;
    document.getElementById('question-text').textContent = questions[currentQuestionIndex].text;
    currentInput = '';
    updateInputDisplay();
}

function inputNumber(num) {
    if (currentInput.length < 5) {
        currentInput += num;
        updateInputDisplay();
    }
}

function clearInput() {
    currentInput = '';
    updateInputDisplay();
}

function updateInputDisplay() {
    document.getElementById('answer-input').textContent = currentInput;
}

function submitAnswer() {
    if (currentInput === '' || isSubmitting) return;
    
    isSubmitting = true;
    
    const isCorrect = parseInt(currentInput) === questions[currentQuestionIndex].answer;
    const inputDisplay = document.getElementById('answer-input');
    
    if (isCorrect) {
        score += 20; // 5문제 * 20점 = 100점
        inputDisplay.classList.add('correct-answer');
    } else {
        inputDisplay.classList.add('wrong-answer');
    }

    // 약간의 딜레이 후 다음 문제로
    setTimeout(() => {
        isSubmitting = false;
        inputDisplay.classList.remove('correct-answer', 'wrong-answer');
        currentQuestionIndex++;
        if (currentQuestionIndex < 5) {
            renderQuestion();
        } else {
            endGame();
        }
    }, 500);
}

function endGame() {
    clearInterval(timerInterval);
    
    document.getElementById('final-score').textContent = score;
    document.getElementById('correct-count').textContent = score / 20;
    document.getElementById('final-time').textContent = timeElapsed;
    
    const rewardContainer = document.getElementById('reward-container');
    
    let isRewardEarned = false;
    let earnedReward = 0;
    
    // 조건: 100점이고, (1자리수 && 15초 이하) 또는 (2자리수 && 60초 이하)
    if (score === 100) {
        if ((currentLevel === 1 && timeElapsed <= 15) || (currentLevel === 2 && timeElapsed <= 60)) {
            isRewardEarned = true;
            const rewards = [5, 10, 15];
            earnedReward = rewards[Math.floor(Math.random() * rewards.length)];
            myRewards.push(earnedReward);
        }
    }
    
    if (isRewardEarned) {
        document.getElementById('reward-time').textContent = `${earnedReward}분`;
        rewardContainer.classList.remove('hidden');
    } else {
        rewardContainer.classList.add('hidden');
    }
    
    // 기록 저장
    let opName = '';
    if(currentOperation === '+') opName = '더하기';
    if(currentOperation === '-') opName = '빼기';
    if(currentOperation === '*') opName = '곱하기';
    if(currentOperation === '/') opName = '나누기';

    gameHistory.unshift({
        op: opName,
        level: currentLevel,
        score: score,
        time: timeElapsed,
        reward: earnedReward,
        date: new Date().toLocaleString('ko-KR')
    });
    
    // 최대 50개만 보관 (사용 기록 포함)
    if(gameHistory.length > 50) gameHistory.pop();
    
    saveToLocal();
    
    let title = '게임 종료!';
    if(score === 100) {
        if(isRewardEarned) {
             title = '💯 완벽해요! 시간 안에도 통과해서 보너스 시간 획득! 🎁';
        } else {
             title = '💯 백점이에요! (시간 제한을 아쉽게 넘겨서 보너스는 없어요 😢)';
        }
    }
    else if(score === 80) title = '👏 대단해요! 딱 한 개 실수해버렸네, 다음엔 백점 도전!';
    else if(score === 60) title = '👍 잘했어요! 절반 이상 맞췄어요, 멋져요!';
    else if(score === 40) title = '💪 아쉬워요! 조금만 더 신중하게 풀어볼까요?';
    else if(score === 20) title = '🌟 괜찮아요! 처음엔 다 어려운 법이니까 계속 연습해봐요!';
    else title = '🚀 헉, 하나도 못 맞췄어요! 천천히 하나씩 다시 같이 풀어봐요!';
    
    document.getElementById('result-title').textContent = title;

    showScreen('screen-result');
}

function resetGame() {
    showScreen('screen-main');
}

function showHistory() {
    updateHistoryUI();
    showScreen('screen-history');
}

function updateHistoryUI() {
    const rewardUl = document.getElementById('reward-ul');
    const historyUl = document.getElementById('history-ul');
    const totalTimeSpan = document.getElementById('total-reward-time');
    
    // 선물 리스트 렌더링
    rewardUl.innerHTML = '';
    let totalTime = 0;
    
    if (myRewards.length === 0) {
        rewardUl.innerHTML = '<li style="justify-content:center; color:#999;">보유한 선물이 없습니다.</li>';
    } else {
        myRewards.forEach((req, index) => {
            totalTime += req;
            const li = document.createElement('li');
            li.innerHTML = `
                <span>🎁 보너스 <strong>${req}분</strong></span>
                <button class="use-btn" onclick="useReward(${index})">사용</button>
            `;
            rewardUl.appendChild(li);
        });
    }
    totalTimeSpan.textContent = totalTime;
    
    // 기록 리스트 렌더링
    historyUl.innerHTML = '';
    if (gameHistory.length === 0) {
        historyUl.innerHTML = '<li style="justify-content:center; color:#999;">게임 기록이 없습니다.</li>';
    } else {
        gameHistory.forEach(h => {
            const li = document.createElement('li');
            if (h.type === 'use_coupon') {
                li.innerHTML = `
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-size:0.9rem; color:#888;">${h.date}</span>
                        <span style="color:#4CAF50; font-weight:bold;">✅ 보너스 시간 사용 완료</span>
                    </div>
                    <span style="color:#F44336; font-weight:bold;">-${h.usedAmount}분</span>
                `;
            } else {
                li.innerHTML = `
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-size:0.9rem; color:#888;">${h.date}</span>
                        <span>${h.op} ${h.level}자리 - <strong>${h.score}점</strong> (${h.time}초)</span>
                    </div>
                    <span style="color:#E65100; font-weight:bold;">${h.reward > 0 ? '+' + h.reward + '분' : ''}</span>
                `;
            }
            historyUl.appendChild(li);
        });
    }
}

function useReward(index) {
    const usedAmount = myRewards[index];
    if(confirm(`이 선물(${usedAmount}분)을 사용하시겠습니까? (사용 후에는 사라집니다!)`)) {
        myRewards.splice(index, 1);
        
        gameHistory.unshift({
            type: 'use_coupon',
            usedAmount: usedAmount,
            date: new Date().toLocaleString('ko-KR')
        });
        if(gameHistory.length > 50) gameHistory.pop();
        
        saveToLocal();
        updateHistoryUI();
    }
}

function resetHistory() {
    if(confirm('모든 기록과 선물이 삭제됩니다. 초기화하시겠습니까?')) {
        gameHistory = [];
        myRewards = [];
        saveToLocal();
        updateHistoryUI();
    }
}
