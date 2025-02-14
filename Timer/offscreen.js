let currentAudio = null; // Store currently playing audio

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.command === "playAlarm") {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0; // Reset previous sound if one is already playing
        }

        currentAudio = new Audio(chrome.runtime.getURL(`audio/${message.soundFile}`));
        currentAudio.volume = 1.0; // Ensure volume is at max
        currentAudio.play().catch(err => console.error("Error playing alarm:", err));
    }

    if (message.command === "stopAlarm" && currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null; // Clear reference
    }
});
