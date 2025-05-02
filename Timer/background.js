const ALARM_NAME = 'pomodoroTimerAlarm';
const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';

let timerEndTime = null;
let isRunning = false;
let selectedAlarmSound = 'alarm1.mp3'; // Default

// --- Offscreen Document Management ---
async function hasOffscreenDocument(path) {
  // Await the promise returned by chrome.runtime.getContexts
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(path)] // Ensure URL is correctly formed
  });
  return existingContexts.length > 0;
}

async function setupOffscreenDocument(path) {
    // Check if the document exists before trying to create it.
    if (!(await hasOffscreenDocument(path))) {
        console.log("Attempting to create offscreen document.");
        await chrome.offscreen.createDocument({
            url: path,
            reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
            justification: 'Play alarm sound for timer',
        }).catch(error => { // Add error handling for createDocument
             console.error("Error creating offscreen document:", error);
        });
        console.log("Offscreen document creation initiated or skipped if already exists.");
    } else {
      console.log("Offscreen document already exists.");
    }
}

async function closeOffscreenDocument() {
    if (await hasOffscreenDocument(OFFSCREEN_DOCUMENT_PATH)) {
        console.log("Attempting to close offscreen document.");
        await chrome.offscreen.closeDocument().catch(error => { // Add error handling
             console.error("Error closing offscreen document:", error);
        });
        console.log("Offscreen document closed or closure attempted.");
    } else {
         console.log("No active offscreen document to close.");
    }
}


// --- Timer Logic ---

function startTimer(durationSeconds, alarmSound) {
    console.log(`Background: Starting timer for ${durationSeconds} seconds with sound ${alarmSound}`);
    const now = Date.now();
    timerEndTime = now + (durationSeconds * 1000);
    isRunning = true;
    selectedAlarmSound = alarmSound;

    // Use chrome.alarms API for reliable scheduling
    // Ensure any previous alarm is cleared before creating a new one
    chrome.alarms.clear(ALARM_NAME, (wasCleared) => {
         console.log(`Previous alarm cleared: ${wasCleared}`);
         chrome.alarms.create(ALARM_NAME, {
             when: timerEndTime
         });
         console.log(`Background: Alarm '${ALARM_NAME}' created for ${new Date(timerEndTime).toLocaleTimeString()}`);
    });


    // Save state
    chrome.storage.local.set({
        timerEndTime: timerEndTime,
        isRunning: true,
        selectedAlarm: alarmSound
    }).then(() => {
         console.log("Background: Timer state saved.");
    }).catch(error => {
         console.error("Background: Error saving timer state:", error);
    });

    // Optionally update badge text (example)
    chrome.action.setBadgeText({ text: 'ON' }).catch(e => console.error("Error setting badge:", e));
    chrome.action.setBadgeBackgroundColor({ color: '#63f27b' }).catch(e => console.error("Error setting badge color:", e));; // Green

    return timerEndTime; // Return endTime for popup to sync display
}

function stopTimer(triggeredByAlarm = false) {
    console.log("Background: Stopping timer.");
    chrome.alarms.clear(ALARM_NAME, (wasCleared) => {
         console.log(`Alarm '${ALARM_NAME}' cleared on stop: ${wasCleared}`);
    });
    timerEndTime = null;
    isRunning = false;

    // Clear saved state only for timer run status, keep preferences
    chrome.storage.local.set({
        timerEndTime: null,
        isRunning: false
        // Keep selectedAlarm and custom time inputs saved
    }).then(() => {
         console.log("Background: Timer running state cleared in storage.");
    }).catch(error => {
         console.error("Background: Error clearing timer state:", error);
    });

     // Reset badge
    chrome.action.setBadgeText({ text: '' }).catch(e => console.error("Error clearing badge:", e));;

    // Close offscreen document IF it wasn't the alarm itself that triggered the stop
    // (because the alarm needs the offscreen document to finish playing)
    if (!triggeredByAlarm) {
        closeOffscreenDocument(); // No need to await here for immediate stop
    }
}

async function playAlarmSound() {
    console.log("Background: Timer finished, attempting to play alarm:", selectedAlarmSound);
    try {
        await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);
        console.log("Background: Sending play command to offscreen document.");
        // It's crucial that the offscreen document is ready before sending the message.
        // A small delay might sometimes help ensure the context is ready after creation.
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay

        const response = await chrome.runtime.sendMessage({
            target: 'offscreen', // Ensure the offscreen script checks this target
            command: 'play',
            sound: selectedAlarmSound // Send the correct sound file name
        });
        console.log("Background: Play command response from offscreen:", response);
    } catch (error) {
        console.error("Background: Error sending message or playing sound via offscreen:", error);
        // If offscreen fails, maybe try a notification as fallback?
        // chrome.notifications.create(...);
    } finally {
        // Clean up timer state *after* attempting to play sound
        stopTimer(true); // Pass true to indicate stop was triggered by alarm finish

         // Notify popup if open
        chrome.runtime.sendMessage({ command: 'updateState', isRunning: false, endTime: null })
          .catch(e => console.log("Background: Popup not open or error sending timer finish update:", e.message)); // Ignore error if popup closed
    }
}

// --- Event Listeners ---

// Listener for chrome.alarms
chrome.alarms.onAlarm.addListener((alarm) => {
    console.log(`Background: Alarm listener fired for: ${alarm.name}`);
    if (alarm.name === ALARM_NAME) {
        // Get the latest selected alarm from storage *before* playing
        chrome.storage.local.get(['selectedAlarm'], (result) => {
            selectedAlarmSound = result.selectedAlarm || 'Alarm1.mp3'; // Use stored or default
             console.log(`Background: Retrieved alarm sound for playback: ${selectedAlarmSound}`);
            playAlarmSound(); // This function now handles stopping the timer internally
        });
    }
});

// Listener for messages from popup or other extension contexts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`Background received message:`, message); // Log the whole message object

    if (message.command === 'start' && message.duration > 0) {
        // stopTimer(); // Stop is implicitly handled by startTimer clearing the old alarm
        const endTime = startTimer(message.duration, message.alarmSound);
        sendResponse({ status: "Timer started", endTime: endTime });
        // Although synchronous response is sent, returning true is safer
        // in case any part of startTimer becomes async in the future.
        return true;
    } else if (message.command === 'stop') {
        stopTimer();
        sendResponse({ status: "Timer stopped" });
        return true; // Signify response may be sent (even if sync here)
    } else if (message.command === 'getState') {
        // Retrieve state from storage to ensure consistency
        chrome.storage.local.get(['isRunning', 'timerEndTime'], (result) => {
            if (chrome.runtime.lastError) {
                 console.error("Background: Error getting state from storage:", chrome.runtime.lastError);
                 sendResponse({ isRunning: false, endTime: null, error: chrome.runtime.lastError.message });
                 return;
            }

            // Update local variables if storage has valid data
            let currentIsRunning = result.isRunning || false;
            let currentTimerEndTime = result.timerEndTime || null;

            // Check if the timer should have ended already but didn't for some reason
            if (currentIsRunning && currentTimerEndTime && Date.now() >= currentTimerEndTime) {
                 console.log("Background: getState detected timer expired while inactive.");
                 // The alarm *should* have fired. Treat it as stopped now.
                 // The alarm listener is the primary mechanism for sound.
                 stopTimer(); // Clear state and alarm
                 sendResponse({ isRunning: false, endTime: null }); // Respond with stopped state
            } else {
                 console.log(`Background: Responding to getState with: isRunning=${currentIsRunning}, endTime=${currentTimerEndTime ? new Date(currentTimerEndTime) : null}`);
                 sendResponse({ isRunning: currentIsRunning, endTime: currentIsRunning ? currentTimerEndTime : null });
            }
        });
        // ** Crucial Fix Here: ** Return true IMMEDIATELY after starting the async storage call.
        return true; // Indicate that sendResponse will be called asynchronously
    }

    // If the message command is not handled, return false or undefined (implicitly)
    console.log(`Background: Unhandled message command: ${message.command}`);
    return false; // Explicitly indicate no response will be sent for unhandled commands
});

// --- Initialization and Lifecycle ---
chrome.runtime.onStartup.addListener(() => {
    console.log("Background: Extension starting up (browser startup).");
    // Check storage on startup in case the browser was closed mid-timer
    chrome.storage.local.get(['isRunning', 'timerEndTime', 'selectedAlarm'], (result) => {
         if (chrome.runtime.lastError) {
             console.error("Background: Error getting state on startup:", chrome.runtime.lastError);
             return;
         }
        if (result.isRunning && result.timerEndTime) {
            const now = Date.now();
            if (now >= result.timerEndTime) {
                console.log("Background: Timer expired while browser was closed.");
                // Attempt to play alarm - might require user interaction if browser just started.
                selectedAlarmSound = result.selectedAlarm || 'Alarm1.mp3';
                playAlarmSound(); // This will also call stopTimer to clear state
            } else {
                // Timer is still valid and running, re-arm the chrome.alarms API
                isRunning = true;
                timerEndTime = result.timerEndTime;
                selectedAlarmSound = result.selectedAlarm || 'Alarm1.mp3';
                // Recreate the alarm reliably
                 chrome.alarms.clear(ALARM_NAME, () => { // Clear first ensure no duplicates
                      chrome.alarms.create(ALARM_NAME, { when: timerEndTime });
                      console.log(`Background: Timer restored on startup, alarm re-armed for ${new Date(timerEndTime)}.`);
                      chrome.action.setBadgeText({ text: 'ON' }).catch(e => console.error("Error setting badge:", e));;
                      chrome.action.setBadgeBackgroundColor({ color: '#28a745' }).catch(e => console.error("Error setting badge color:", e));;
                 });

            }
        } else {
            // Ensure state is clean if storage indicates not running
            console.log("Background: No active timer found on startup.");
            isRunning = false;
            timerEndTime = null;
            // Ensure storage reflects this clean state
            chrome.storage.local.set({ isRunning: false, timerEndTime: null });
            chrome.action.setBadgeText({ text: '' }).catch(e => console.error("Error clearing badge:", e));;
        }
    });
});

// Log when the service worker starts (for debugging)
console.log(`Background service worker started at ${new Date().toLocaleTimeString()}.`);
// Initial state check when the service worker wakes up (not just browser startup)
chrome.storage.local.get(['isRunning', 'timerEndTime', 'selectedAlarm'], (result) => {
    isRunning = result.isRunning || false;
    timerEndTime = result.timerEndTime || null;
    selectedAlarmSound = result.selectedAlarm || 'Alarm1.mp3';
     if (isRunning) {
         chrome.action.setBadgeText({ text: 'ON' }).catch(e => console.error("Error setting badge:", e));;
         chrome.action.setBadgeBackgroundColor({ color: '#28a745' }).catch(e => console.error("Error setting badge color:", e));;
     } else {
          chrome.action.setBadgeText({ text: '' }).catch(e => console.error("Error clearing badge:", e));;
     }
    console.log(`Background: Initial state check complete. isRunning=${isRunning}`);
});