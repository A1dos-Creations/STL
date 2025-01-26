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
          console.error("Error: ", chrome.runtime.lastError);
          return;
        }
  
        if (response) {
          updateDisplay(response.timeRemaining);
          startButton.disabled = response.timerRunning;
          pauseButton.disabled = !response.timerRunning;
          stopButton.disabled = !response.timerRunning && response.timeRemaining === 0;
        }
      });
    }
  
    startButton.addEventListener("click", () => {
      const hours = parseInt(document.getElementById("hours").value, 10) || 0;
      const minutes = parseInt(document.getElementById("minutes").value, 10) || 0;
      const seconds = parseInt(document.getElementById("seconds").value, 10) || 0;
  
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  
      if (totalSeconds > 0) {
        chrome.runtime.sendMessage({ command: "start", timeRemaining: totalSeconds }, syncState);
      }
    });
  
    pauseButton.addEventListener("click", () => {
      chrome.runtime.sendMessage({ command: "pause" }, syncState);
    });
  
    stopButton.addEventListener("click", () => {
      chrome.runtime.sendMessage({ command: "stop" }, syncState);
    });
  
    // Sync state on popup load
    syncState();
  });
  