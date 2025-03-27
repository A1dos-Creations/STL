document.addEventListener("DOMContentLoaded", () => {
    const hoursInput = document.getElementById("hours");
    const minutesInput = document.getElementById("minutes");
    const secondsInput = document.getElementById("seconds");
    const startButton = document.getElementById("start");
    const pauseButton = document.getElementById("pause");
    const stopButton = document.getElementById("stop");
    const timerDisplay = document.getElementById("timer-display");
    const stopAlarmButton = document.getElementById("stopAlarm");
    const soundSelector = document.getElementById("alarm-sound");
  
    // Update timer display
    function updateDisplay(time) {
      const hours = Math.floor(time / 3600);
      const minutes = Math.floor((time % 3600) / 60);
      const seconds = time % 60;
      timerDisplay.textContent = `${hours.toString().padStart(2, "0")}:` +
                                 `${minutes.toString().padStart(2, "0")}:` +
                                 `${seconds.toString().padStart(2, "0")}`;
    }
  
    // Sync the state from background
    function syncState() {
      chrome.runtime.sendMessage({ command: "getState" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Failed to get timer state:", chrome.runtime.lastError);
          return;
        }
        updateDisplay(response.timeRemaining);
        // Enable/disable buttons based on state
        startButton.disabled = response.timerRunning || response.paused;
        pauseButton.disabled = !response.timerRunning && !response.paused;
        stopButton.disabled = (!response.timerRunning && !response.paused) || response.timeRemaining === 0;
      });
    }
  
    // Start timer button click handler
    startButton.addEventListener("click", () => {
      const hours = parseInt(hoursInput.value, 10) || 0;
      const minutes = parseInt(minutesInput.value, 10) || 0;
      const seconds = parseInt(secondsInput.value, 10) || 0;
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      if (totalSeconds > 0) {
        // Update alarm sound (if not changed by user, this reaffirms the default)
        const selectedSound = soundSelector.value;
        chrome.runtime.sendMessage({
          command: "setAlarmSound",
          soundFile: selectedSound
        });
        chrome.runtime.sendMessage({ command: "start", timeRemaining: totalSeconds }, (response) => {
          if (response.success) {
            syncState();
          }
        });
      }
    });
  
    // Pause/Resume toggle on pauseButton click
    pauseButton.addEventListener("click", () => {
      // Check current state to decide whether to pause or resume
      chrome.runtime.sendMessage({ command: "getState" }, (response) => {
        if (response.timerRunning) {
          // Pause the timer
          chrome.runtime.sendMessage({ command: "pause" }, (res) => {
            if (res.success) {
              syncState();
            }
          });
        } else if (response.paused) {
          // Resume the timer
          chrome.runtime.sendMessage({ command: "resume" }, (res) => {
            if (res.success) {
              syncState();
            }
          });
        }
      });
    });
  
    // Stop timer button click handler
    stopButton.addEventListener("click", () => {
      chrome.runtime.sendMessage({ command: "stop" }, (response) => {
        if (response.success) {
          updateDisplay(0);
          syncState();
        }
      });
    });
  
    // Stop alarm button click handler
    stopAlarmButton.addEventListener("click", () => {
      chrome.runtime.sendMessage({ command: "stopAlarm" }, (response) => {
        if (response.success) {
          stopAlarmButton.disabled = true;
        }
      });
    });
  
    // Periodically update the display while the timer is running
    setInterval(syncState, 1000);
    syncState();
  });
  