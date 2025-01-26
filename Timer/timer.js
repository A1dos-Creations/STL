document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("start");
  const pauseButton = document.getElementById("pause");
  const stopButton = document.getElementById("stop");
  const timerDisplay = document.getElementById("timer-display");

  function updateDisplay(remainingSeconds) {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    timerDisplay.textContent = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  function syncState() {
    chrome.runtime.sendMessage({ command: "getState" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting timer state:", chrome.runtime.lastError.message);
        return;
      }

      if (response) {
        updateDisplay(response.timeRemaining || 0);
        startButton.disabled = response.timerRunning;
        pauseButton.disabled = !response.timerRunning;
        stopButton.disabled = !response.timerRunning && response.timeRemaining === 0;
      } else {
        console.error("Invalid response:", response);
      }
    });
  }

  startButton.addEventListener("click", () => {
    const hours = parseInt(document.getElementById("hours").value, 10) || 0;
    const minutes = parseInt(document.getElementById("minutes").value, 10) || 0;
    const seconds = parseInt(document.getElementById("seconds").value, 10) || 0;

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (totalSeconds > 0) {
      chrome.runtime.sendMessage({ command: "start", timeRemaining: totalSeconds }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error starting timer:", chrome.runtime.lastError.message);
        } else {
          console.log("Timer started:", response);
        }
        syncState();
      });
    }
  });

  pauseButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ command: "pause" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error pausing timer:", chrome.runtime.lastError.message);
      } else {
        console.log("Timer paused:", response);
      }
      syncState();
    });
  });

  stopButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ command: "stop" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error stopping timer:", chrome.runtime.lastError.message);
      } else {
        console.log("Timer stopped:", response);
      }
      syncState();
    });
  });

  // Sync state on popup load
  syncState();
});
