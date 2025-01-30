
// timer.js
document.addEventListener("DOMContentLoaded", () => {
    const hoursInput = document.getElementById("hours");
    const minutesInput = document.getElementById("minutes");
    const secondsInput = document.getElementById("seconds");
    const startButton = document.getElementById("start");
    const pauseButton = document.getElementById("pause");
    const stopButton = document.getElementById("stop");
    const timerDisplay = document.getElementById("timer-display");
    const alarmDisplay = document.getElementById("alarm-time");

    function updateDisplay(time) {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = time % 60;
        timerDisplay.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    function syncState() {
        chrome.runtime.sendMessage({ command: "getState" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Failed to get timer state:", chrome.runtime.lastError);
                return;
            }

            if (response) {
                updateDisplay(response.timeRemaining);
                startButton.disabled = response.timerRunning;
                pauseButton.disabled = !response.timerRunning;
                stopButton.disabled = !response.timerRunning && response.timeRemaining === 0;
                alarmDisplay.textContent = response.alarmTime || "";
            }
        });
    }

    startButton.addEventListener("click", () => {
        const hours = parseInt(hoursInput.value, 10) || 0;
        const minutes = parseInt(minutesInput.value, 10) || 0;
        const seconds = parseInt(secondsInput.value, 10) || 0;
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;

        if (totalSeconds > 0) {
            chrome.runtime.sendMessage({ command: "start", timeRemaining: totalSeconds }, (response) => {
                if (response.success) {
                    syncState();
                }
            });
        }
    });

    pauseButton.addEventListener("click", () => {
        chrome.runtime.sendMessage({ command: "pause" }, (response) => {
            if (response.success) {
                syncState();
            }
        });
    });

    stopButton.addEventListener("click", () => {
        chrome.runtime.sendMessage({ command: "stop" }, (response) => {
            if (response.success) {
                updateDisplay(0);
                syncState();
            }
        });
    });

    chrome.storage.onChanged.addListener(() => {
        syncState();
    });
    
    syncState();
});
