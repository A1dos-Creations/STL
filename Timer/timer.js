document.addEventListener("DOMContentLoaded", () => {
    const hoursInput = document.getElementById("hours");
    const minutesInput = document.getElementById("minutes");
    const secondsInput = document.getElementById("seconds");
    const startButton = document.getElementById("start");
    const pauseButton = document.getElementById("pause");
    const stopButton = document.getElementById("stop");
    const timerDisplay = document.getElementById("timer-display");
    const alarmDisplay = document.getElementById("alarm-time");
    const soundSelector = document.getElementById("alarm-sound"); // New dropdown element

    // When the user changes the alarm sound selection,
    // send the new value to the background script.
    soundSelector.addEventListener("change", () => {
        const selectedSound = soundSelector.value;
        chrome.runtime.sendMessage({
            command: "setAlarmSound",
            soundFile: selectedSound
        });
    });

    function updateDisplay(time) {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = time % 60;
        timerDisplay.textContent = `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
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
            // Before starting the timer, update the alarm sound
            // in case the user hasn't changed the dropdown.
            const selectedSound = soundSelector.value;
            chrome.runtime.sendMessage({
                command: "setAlarmSound",
                soundFile: selectedSound
            });
            // Start the timer.
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

document.addEventListener("DOMContentLoaded", () => {
    const stopAlarmButton = document.getElementById("stopAlarm");

    function updateButtonState(alarmActive) {
        console.log("🔍 Timer.js: alarmActive changed to:", alarmActive);
        if (alarmActive) {
            stopAlarmButton.disabled = true;
            return;
        } else {
            stopAlarmButton.disabled = false;
        }
        
    }

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.alarmActive) {
            updateButtonState(changes.alarmActive.newValue);
        }
    });

    // Sync state when popup opens
    chrome.storage.local.get("alarmActive", (data) => {
        updateButtonState(data.alarmActive || false);
    });

    // Stop button click event
    stopAlarmButton.addEventListener("click", () => {
        chrome.runtime.sendMessage({ command: "stopAlarm" });
    });
});