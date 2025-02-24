let timerInterval = null;
let timeRemaining = 0;
let timerStartTime = null;
let pausedTime = null;
let timerStarted = false;
// Holds the user-selected alarm sound filename (e.g., "alarm1.mp3")
let selectedValue = null;

// Main message listener for timer commands and settings.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Expect messages to have a "command" property.
  if (!message.command) {
    console.error("Invalid message format: missing 'command'");
    return;
  }

  // Handle timer start
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
    if (timerInterval) clearInterval(timerInterval); // Clear any previous interval

    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
      const remaining = Math.max(timeRemaining - elapsed, 0);

      if (remaining > 0) {
        chrome.storage.local.set({
          timeRemaining: remaining,
          timerRunning: true,
          controlsEnabled: true
        });
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
        timerStarted = false;
        chrome.storage.local.set({
          timeRemaining: 0,
          timerRunning: false,
          controlsEnabled: false
        });
        // Use the selectedValue if set, or default to "alarm1.mp3"
        const soundToPlay = selectedValue || "alarm1.mp3";
        playAlarm(soundToPlay);
      }
    }, 1000);

    const alarmTime = new Date(timerStartTime + timeRemaining * 1000);
    const alarmHours = alarmTime.getHours() % 12 || 12;
    const alarmMinutes = alarmTime.getMinutes().toString().padStart(2, "0");
    const period = alarmTime.getHours() >= 12 ? "PM" : "AM";
    const alarmDisplay = `${alarmHours}:${alarmMinutes} ${period}`;

    chrome.storage.local.set({
      timerRunning: true,
      controlsEnabled: true,
      alarmTime: alarmDisplay
    });
    sendResponse({ success: true, alarmTime: alarmDisplay });
  }
  // Handle timer pause
  else if (message.command === "pause") {
    if (timerStarted) {
      clearInterval(timerInterval);
      timerInterval = null;
      pausedTime = Date.now();
      timeRemaining -= Math.floor((pausedTime - timerStartTime) / 1000);
      chrome.storage.local.set({
        timeRemaining,
        timerRunning: false,
        controlsEnabled: true
      });
    }
    sendResponse({ success: true });
  }
  // Handle timer stop
  else if (message.command === "stop") {
    clearInterval(timerInterval);
    timerInterval = null;
    timeRemaining = 0;
    pausedTime = null;
    timerStarted = false;
    chrome.storage.local.set({
      timeRemaining: 0,
      timerRunning: false,
      controlsEnabled: false,
      alarmTime: null
    });
    sendResponse({ success: true });
  }
  // Handle a request to get the current state
  else if (message.command === "getState") {
    chrome.storage.local.get(
      ["timeRemaining", "timerRunning", "controlsEnabled", "alarmTime"],
      (data) => {
        sendResponse({
          timeRemaining: data.timeRemaining || 0,
          timerRunning: data.timerRunning || false,
          controlsEnabled: data.controlsEnabled || false,
          alarmTime: data.alarmTime || ""
        });
      }
    );
    return true; // Indicates asynchronous sendResponse
  }
  // Handle updating the selected alarm sound
    else if (message.command === "setAlarmSound") {
        // This is where you add the new command handler.
        if (message.soundFile) {
            selectedValue = message.soundFile;
            console.log("Updated selected alarm sound to:", selectedValue);
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: "No soundFile provided." });
        }
        return true;
    } else {
        console.error("Unknown command received:", message.command);
    }
return true;  // Ensure async sendResponse works properly
});

// --- Offscreen Handling ---

async function ensureOffscreenDocument() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"]
  });
  if (contexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: "Timer/offscreen.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Needed to play alarm sound"
    });
  }
}

// playAlarm(soundFile)
// Ensures the offscreen document exists and then sends a message to it to play the alarm.
function playAlarm(soundFile) {
    ensureOffscreenDocument().then(() => {
        chrome.runtime.sendMessage({ command: "playAlarm", soundFile: soundFile });

        // Update storage to enable button
        chrome.storage.local.set({ alarmActive: true });
    });
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.command === "stopAlarm") {
        chrome.runtime.sendMessage({ command: "stopAlarm" });

        // Update storage to disable button
        chrome.storage.local.set({ alarmActive: false });
    }
});



// --- Additional (legacy) message listener for updateTimer (if used elsewhere) ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ timer: { timeRemaining: 0, isPaused: false } });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateTimer") {
    chrome.storage.local.set({ timer: message.timer });
  }
});

// --- End of TIMER Section ---


// --- Start of GOOGLE SYNCING Section ---

import { syncGoogleTasks } from './sync.js';
// Import or define other modules or functions as needed
import { otherBackgroundFunction } from './otherBackgroundModule.js';

// Existing background functionality
function initializeOtherBackgroundFeatures() {
  // Your existing background code here
  console.log("Initializing other background features...");
  // For example, you might have other listeners or initialization routines:
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'doSomethingElse') {
      // Handle your other message
      otherBackgroundFunction(message.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Indicates async response
    }
  });
}

// Add message listener for Google sync tasks
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'syncGoogleTasks') {
    syncGoogleTasks()
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keeps the messaging channel open for async response
  }
});

// Initialize your other background functionalities
initializeOtherBackgroundFeatures();

// You can also add additional listeners or initialization code below as needed
console.log("Background service worker initialized.");

// --- End of GOOGLE SYNCING Section ---