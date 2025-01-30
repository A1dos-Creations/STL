let timerInterval = null;
let timeRemaining = 0;
let timerStartTime = null;
let pausedTime = null;
let timerStarted = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message:", message);

    if (!message.command) {
        console.error("Invalid message format: missing 'command'");
        return;
    }

    if (message.command === "start") {
        if (timerStarted && pausedTime === null) {
            sendResponse({ success: false, error: "Timer is already running." });
            return;
        }
    if (timeRemaining > 2880) {
        timeRemaining = 2880;
    }

        const currentTime = Date.now();

        if (message.timeRemaining) {
            if (pausedTime !== null) {
                // Calculate pause duration and adjust timeRemaining accordingly
                const pauseDuration = Math.floor((currentTime - pausedTime) / 1000);
                timeRemaining -= pauseDuration;
                pausedTime = null; // Clear pausedTime after resuming
            } else {
                timeRemaining = message.timeRemaining;
                timerStartTime = currentTime; // Set the start time for a new session
            }
        }

        timerStarted = true;

        if (timerInterval) clearInterval(timerInterval);  // Ensure to clear any previous interval

        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
            const remaining = Math.max(timeRemaining - elapsed, 0);

            if (remaining > 0) {
                chrome.storage.local.set({ timeRemaining: remaining, timerRunning: true, controlsEnabled: true });
            } else {
                clearInterval(timerInterval);
                timerInterval = null;
                timerStarted = false;
                chrome.storage.local.set({ timeRemaining: 0, timerRunning: false, controlsEnabled: false });
                playAlarm();
            }
        }, 1000);

        const alarmTime = new Date(timerStartTime + timeRemaining * 1000);
        const alarmHours = alarmTime.getHours() % 12 || 12;
        const alarmMinutes = alarmTime.getMinutes().toString().padStart(2, "0");
        const period = alarmTime.getHours() >= 12 ? "PM" : "AM";
        const alarmDisplay = `${alarmHours}:${alarmMinutes} ${period}`;

        chrome.storage.local.set({ timerRunning: true, controlsEnabled: true, alarmTime: alarmDisplay });
        sendResponse({ success: true, alarmTime: alarmDisplay });
    } else if (message.command === "pause") {
        if (timerStarted) {
            clearInterval(timerInterval);  // Ensure the interval is fully cleared
            timerInterval = null;
            pausedTime = Date.now();  // Record the time when paused
            timeRemaining -= Math.floor((pausedTime - timerStartTime) / 1000);  // Adjust remaining time
            chrome.storage.local.set({ timeRemaining, timerRunning: false, controlsEnabled: true });
        }
        sendResponse({ success: true });
    } else if (message.command === "stop") {
        clearInterval(timerInterval);
        timerInterval = null;
        timeRemaining = 0;
        pausedTime = null;
        timerStarted = false;

        chrome.storage.local.set({ timeRemaining: 0, timerRunning: false, controlsEnabled: false, alarmTime: null });
        sendResponse({ success: true });
    } else if (message.command === "getState") {
        chrome.storage.local.get(["timeRemaining", "timerRunning", "controlsEnabled", "alarmTime"], (data) => {
            sendResponse({
                timeRemaining: data.timeRemaining || 0,
                timerRunning: data.timerRunning || false,
                controlsEnabled: data.controlsEnabled || false,
                alarmTime: data.alarmTime || ""
            });
        });
        return true;
    } else {
        console.error("Unknown command received:", message.command);
    }
    return true;  // Ensure async sendResponse works properly
});

function playAlarm() {
    const alarm = new Audio(chrome.runtime.getURL("audio/alarm1.mp3"));
    alarm.play();
}

// MainPage Timer:
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ timer: { timeRemaining: 0, isPaused: false } });
  });
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateTimer') {
      chrome.storage.local.set({ timer: message.timer });
    }
  });
  