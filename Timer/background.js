let timerInterval = null;
let timeRemaining = 0;

// Handle messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "start") {
    timeRemaining = message.timeRemaining;

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
      if (timeRemaining > 0) {
        timeRemaining--;
        chrome.storage.local.set({ timeRemaining, timerRunning: true });
      } else {
        clearInterval(timerInterval);
        chrome.storage.local.set({ timeRemaining: 0, timerRunning: false });
        playAlarm();
      }
    }, 1000);

    chrome.storage.local.set({ timerRunning: true });
    sendResponse({ success: true });
  } else if (message.command === "pause") {
    if (timerInterval) clearInterval(timerInterval);
    chrome.storage.local.set({ timerRunning: false });
    sendResponse({ success: true });
  } else if (message.command === "stop") {
    if (timerInterval) clearInterval(timerInterval);
    timeRemaining = 0;
    chrome.storage.local.set({ timeRemaining: 0, timerRunning: false });
    sendResponse({ success: true });
  } else if (message.command === "getState") {
    // Handling asynchronous operations
    chrome.storage.local.get(["timeRemaining", "timerRunning"], (data) => {
      sendResponse({ timeRemaining: data.timeRemaining || 0, timerRunning: data.timerRunning || false });
    });
    return true; // Keep the message channel open for the async response
  }
});

// Play alarm when the timer finishes
function playAlarm() {
  const alarm = new Audio(chrome.runtime.getURL("audio/alarm1.mp3"));
  alarm.play();
}
