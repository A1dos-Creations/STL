const timerDisplay = document.getElementById('timer-display');
const hoursInput = document.getElementById('hours');
const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');
const alarmSelect = document.getElementById('alarm-sound');
const startButton = document.getElementById('start-timer');
const stopButton = document.getElementById('stop-timer');
const resetButton = document.getElementById('reset-timer');
const presetButtons = document.querySelectorAll('.preset-btn');
const themeSliderInput = document.getElementById('theme-slider-input');

let displayInterval = null; // To hold the interval ID for updating the display
let initialHours = 0;
let initialMinutes = 25; // Default Pomodoro time
let initialSeconds = 0;

const THEME_STORAGE_KEY = 'timerTheme';

// --- Helper Functions ---

function formatTime(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds < 0) {
        return "00:00:00";
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getTotalSecondsFromInputs() {
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    return (hours * 3600) + (minutes * 60) + seconds;
}

function saveInputs() {
    chrome.storage.local.set({
        customHours: hoursInput.value,
        customMinutes: minutesInput.value,
        customSeconds: secondsInput.value,
        selectedAlarm: alarmSelect.value
    });
}

function loadInputs() {
    chrome.storage.local.get(['customHours', 'customMinutes', 'customSeconds', 'selectedAlarm'], (result) => {
        hoursInput.value = result.customHours || initialHours;
        minutesInput.value = result.customMinutes !== undefined ? result.customMinutes : initialMinutes; // Use default if undefined
        secondsInput.value = result.customSeconds || initialSeconds;
        if (result.selectedAlarm) {
            alarmSelect.value = result.selectedAlarm;
        }
    });
}

function updateDisplay(endTime) {
    clearInterval(displayInterval); // Clear any existing interval

    if (endTime) {
        displayInterval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.round((endTime - now) / 1000));
            timerDisplay.textContent = formatTime(remaining);

            if (remaining <= 0) {
                clearInterval(displayInterval);
                timerDisplay.textContent = "00:00:00"; // Or "Time's up!"
                updateUI(false); // Update button states
            }
        }, 250); // Update display frequently for smoothness
    } else {
        // If no endTime, reset display to initial based on inputs
        const totalSeconds = getTotalSecondsFromInputs();
        timerDisplay.textContent = formatTime(totalSeconds);
    }
}

function updateUI(isRunning) {
    startButton.disabled = isRunning;
    stopButton.disabled = !isRunning;
    resetButton.disabled = isRunning; // Disable reset while running
    hoursInput.disabled = isRunning;
    minutesInput.disabled = isRunning;
    secondsInput.disabled = isRunning;
    alarmSelect.disabled = isRunning;
    presetButtons.forEach(button => button.disabled = isRunning);
}

// --- Theme Handling ---
function applyTheme(themeValue) {
    const currentTheme = themeValue === 'dark' ? 'dark' : 'light';

    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        if (themeSliderInput) { // Ensure element exists before setting property
            themeSliderInput.checked = true;
        }
    } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        if (themeSliderInput) {
            themeSliderInput.checked = false;
        }
    }
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    // Save using the new key
    chrome.storage.local.set({ [THEME_STORAGE_KEY]: newTheme }, () => {
         if(chrome.runtime.lastError) {
             console.error("Error saving theme:", chrome.runtime.lastError);
         } else {
             console.log("Theme saved:", newTheme);
         }
    });
}

// --- Event Listeners ---

startButton.addEventListener('click', () => {
    const totalSeconds = getTotalSecondsFromInputs();
    if (totalSeconds > 0) {
        const alarmSound = alarmSelect.value;
        saveInputs(); // Save current inputs before starting
        chrome.runtime.sendMessage(
            { command: 'start', duration: totalSeconds, alarmSound: alarmSound },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error sending start message:", chrome.runtime.lastError);
                    return;
                }
                 if (response && response.endTime) {
                    updateUI(true);
                    updateDisplay(response.endTime);
                 } else {
                     console.error("Background script did not return endTime.");
                 }
            }
        );
    } else {
        console.log("Please set a duration greater than 0.");
    }
});

stopButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'stop' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error sending stop message:", chrome.runtime.lastError);
        } else {
            clearInterval(displayInterval);
            loadInputs(); // Reload to get the values timer was started with
            setTimeout(() => { // Small delay to allow loadInputs to finish
                 const totalSeconds = getTotalSecondsFromInputs();
                 timerDisplay.textContent = formatTime(totalSeconds);
                 updateUI(false);
            }, 50);
        }
    });
});

resetButton.addEventListener('click', () => {
     chrome.runtime.sendMessage({ command: 'stop' }, () => {
        clearInterval(displayInterval);
        hoursInput.value = initialHours;
        minutesInput.value = initialMinutes;
        secondsInput.value = initialSeconds;
        alarmSelect.selectedIndex = 0; // Reset to first alarm
        saveInputs();
        timerDisplay.textContent = formatTime(initialMinutes * 60); // Display default time
        updateUI(false);
    });
});


presetButtons.forEach(button => {
    button.addEventListener('click', () => {
        const seconds = parseInt(button.getAttribute('data-seconds'));
        if (seconds > 0) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            hoursInput.value = hours;
            minutesInput.value = minutes;
            secondsInput.value = secs;

            const alarmSound = alarmSelect.value;
            saveInputs();
            chrome.runtime.sendMessage(
                { command: 'start', duration: seconds, alarmSound: alarmSound },
                (response) => {
                   if (chrome.runtime.lastError) {
                        console.error("Error sending start message:", chrome.runtime.lastError);
                        return;
                    }
                    if (response && response.endTime) {
                        updateUI(true);
                        updateDisplay(response.endTime);
                    } else {
                         console.error("Background script did not return endTime for preset.");
                    }
                }
            );
        }
    });
});

hoursInput.addEventListener('change', saveInputs);
minutesInput.addEventListener('change', saveInputs);
secondsInput.addEventListener('change', saveInputs);
alarmSelect.addEventListener('change', saveInputs);

if (themeSliderInput) {
    themeSliderInput.addEventListener('change', toggleTheme);
} else {
    console.error("Theme slider input not found!");
}
// --- Initialization ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === 'updateState') {
        updateUI(message.isRunning);
        updateDisplay(message.endTime); // Update display based on potentially finished timer
        if (!message.isRunning && message.endTime) {
             loadInputs();
              setTimeout(() => { // Small delay
                 const totalSeconds = getTotalSecondsFromInputs();
                 timerDisplay.textContent = formatTime(totalSeconds);
             }, 50);
        }
    }
});


document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get([THEME_STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) {
            console.error("Error loading theme:", chrome.runtime.lastError);
            applyTheme('light'); // Default to light on error
        } else {
           // Use the new key here
           applyTheme(result[THEME_STORAGE_KEY] || 'light'); // Default to light if not set
        }
    });

    loadInputs();

    chrome.runtime.sendMessage({ command: 'getState' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error getting state:", chrome.runtime.lastError);
             updateUI(false);
             const totalSeconds = getTotalSecondsFromInputs();
             timerDisplay.textContent = formatTime(totalSeconds);
            return;
        }
        if (response) {
            updateUI(response.isRunning);
            updateDisplay(response.endTime); // Start interval if running, otherwise display initial time

             if (!response.isRunning) {
                 loadInputs(); // Re-load inputs in case they weren't ready yet
                 setTimeout(() => { // Delay to ensure inputs loaded
                     const totalSeconds = getTotalSecondsFromInputs();
                     timerDisplay.textContent = formatTime(totalSeconds);
                 }, 50);
             }
        } else {
             console.warn("No response received for getState command.");
             updateUI(false); // Assume not running
             const totalSeconds = getTotalSecondsFromInputs();
             timerDisplay.textContent = formatTime(totalSeconds);
        }
    });
});