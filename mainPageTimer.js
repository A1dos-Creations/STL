const showButtons = document.getElementById('show-buttons');
const timerButtons = document.getElementById('timer-buttons');
const timerDisplay = document.getElementById('timer-display');
const countdownDisplay = document.getElementById('countdown');
const pauseButton = document.getElementById('pause');
const stopButton = document.getElementById('stop');

let countdownTimer;
let timeRemaining = 0;
let isPaused = false;

showButtons.addEventListener('click', () => {
  timerButtons.style.display = 'block';
  showButtons.style.display = 'none';
});

document.querySelectorAll('#timer-buttons button').forEach(button => {
  button.addEventListener('click', (e) => {
    const time = e.target.id;
    timeRemaining = parseTime(time);
    startCountdown();
    timerButtons.style.display = 'none';
    timerDisplay.style.display = 'block';
  });
});

pauseButton.addEventListener('click', togglePause);
stopButton.addEventListener('click', stopTimer);

function parseTime(time) {
  switch (time) {
    case '10s': return 10;
    case '30s': return 30;
    case '1m': return 60;
    case '5m': return 300;
    default: return 0;
  }
}

function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);

  countdownTimer = setInterval(() => {
    if (!isPaused) {
      if (timeRemaining > 0) {
        timeRemaining--;
        countdownDisplay.textContent = formatTime(timeRemaining);
      } else {
        clearInterval(countdownTimer);
        countdownDisplay.textContent = 'Time’s up!';
      }
    }
  }, 1000);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' + secs : secs}`;
}

function togglePause() {
  isPaused = !isPaused;
  pauseButton.querySelector('img').src = isPaused ? '/images/start.png' : '/images/pause.png';
}

function stopTimer() {
  clearInterval(countdownTimer);
  countdownDisplay.textContent = 'Timer stopped';
  timerDisplay.style.display = 'none';
  showButtons.style.display = 'block';
}
