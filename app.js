let currentOperation = '';
let currentLevel = 1;
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let startTime = 0;
let timerInterval = null;
let currentInput = '';
let timeElapsed = 0;

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
    if (currentInput === '') return;
    
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
    if (score === 100) {
        const rewards = [5, 10, 15];
        const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
        document.getElementById('reward-time').textContent = `${randomReward}분`;
        rewardContainer.classList.remove('hidden');
    } else {
        rewardContainer.classList.add('hidden');
    }
    
    let title = '게임 종료!';
    if(score === 100) title = '최고에요! 완벽합니다!';
    else if(score >= 80) title = '참 잘했어요!';
    else if(score >= 60) title = '잘했어요! 조금 더 노력해봐요!';
    else title = '아쉽네요. 다시 도전해봐요!';
    
    document.getElementById('result-title').textContent = title;

    showScreen('screen-result');
}

function resetGame() {
    showScreen('screen-main');
}
