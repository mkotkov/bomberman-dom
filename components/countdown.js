export default function startCountdown(startGame) {
    if (countdownTimer) return; 

    let secondsLeft = 1;

    if (!countdownElement) {
        countdownElement = document.createElement('div');
        countdownElement.className = 'countdown';
        document.body.appendChild(countdownElement);
    }

    countdownElement.textContent = `Game starts in: ${secondsLeft}s`;

    countdownTimer = setInterval(() => {
        secondsLeft--;
        countdownElement.textContent = `Game starts in: ${secondsLeft}s`;

        if (secondsLeft <= 0) {
            clearInterval(countdownTimer);
            countdownTimer = null;
            document.body.removeChild(countdownElement);
            countdownElement = null;
            startGame(); // Запускаем игру, когда таймер достигает 0
        }
    }, 1000);
}

export  default function stopCountdown() {
    if (countdownTimer) {
        clearInterval(countdownTimer); // Останавливаем таймер
        countdownTimer = null;

        // Убираем элемент обратного отсчёта с экрана
        if (countdownElement) {
            countdownElement.textContent = '';
        }
    }
}

export  default function startWaitingPhase(checkUsersReady, startGame) {
    if (waitingTimer) return; // Прерываем, если таймер уже запущен

    let waitingTimeLeft = 2; // Время ожидания двух пользователей
    const waitingElement = document.createElement('div');
    waitingElement.className = 'waiting';
    waitingElement.textContent = `Waiting for players: ${waitingTimeLeft}s`;
    document.body.appendChild(waitingElement);

    waitingTimer = setInterval(() => {
        waitingTimeLeft--;
        waitingElement.textContent = `Waiting for players: ${waitingTimeLeft}s`;

        if (waitingTimeLeft <= 0 || checkUsersReady()) {
            clearInterval(waitingTimer);
            waitingTimer = null;
            document.body.removeChild(waitingElement);
            startCountdown(startGame);
        }
    }, 1000);
}