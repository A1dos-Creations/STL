const audioPlayer = document.getElementById('audio-player');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Offscreen received message:", message);
    // Check if the message is intended for the offscreen document
    if (message.target !== 'offscreen') {
        return false; // Indicate message not handled
    }

    if (message.command === 'play' && message.sound) {
        // Construct the full path within the extension
        const audioPath = `/audio/${message.sound}`;
        audioPlayer.src = chrome.runtime.getURL(audioPath);
        console.log("Setting audio source:", audioPlayer.src);

        // Attempt to play
        audioPlayer.play()
            .then(() => {
                console.log("Audio playback started for:", message.sound);
                sendResponse({ success: true, message: "Playback started" });
            })
            .catch((error) => {
                console.error("Audio playback failed:", error);
                sendResponse({ success: false, message: `Playback failed: ${error.message}` });
            });
         return true; // Indicate async response
    }
     return false; // Indicate message not handled
});

audioPlayer.addEventListener('ended', () => {
    console.log("Audio playback finished.");
});

audioPlayer.addEventListener('error', (e) => {
     console.error('Audio element error:', e);
     if (audioPlayer.error) {
         console.error('MediaError code:', audioPlayer.error.code);
         console.error('MediaError message:', audioPlayer.error.message);
     }
});


console.log("Offscreen script loaded.");