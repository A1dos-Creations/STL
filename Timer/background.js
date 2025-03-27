// Background script for managing the timer and alarm

async function ensureOffscreenDocument() {
  try {
      const contexts = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] });
      if (contexts.length === 0) {
          console.log("📄 Creating offscreen document...");
          await chrome.offscreen.createDocument({
              url: "offscreen.html",
              reasons: ["AUDIO_PLAYBACK"],
              justification: "Needed to play alarm sound"
          });
          console.log("✅ Offscreen document created successfully.");
      } else {
          console.log("ℹ️ Offscreen document already exists.");
      }
  } catch (err) {
      console.error("❌ Failed to create offscreen document:", err);
  }
}

async function playAlarm(soundFile) {
  try {
      await ensureOffscreenDocument();
      console.log("✅ Sending play command to offscreen.");
      chrome.runtime.sendMessage({ command: "playAlarm", soundFile });
      await chrome.storage.local.set({ alarmActive: true });
  } catch (err) {
      console.error("❌ playAlarm() failed:", err);
  }
}

chrome.runtime.onMessage.addListener(async (message) => {
  try {
      console.log("📩 Background received message:", message);
      
      if (message.command === "stopAlarm") {
          console.log("🛑 stopAlarm received. Stopping audio...");
          chrome.runtime.sendMessage({ command: "stopAlarm" });
          await chrome.storage.local.set({ alarmActive: false });
          console.log("✅ alarmActive set to FALSE.");
      }
  } catch (err) {
      console.error("❌ Error handling message:", err);
  }
});