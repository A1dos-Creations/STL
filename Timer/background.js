let timerState = {
    timeRemaining: 0,
    running: false,
    paused: false,
    alarmSound: "alarm1.mp3",
    endTime: null
  };
  
  chrome.runtime.onMessage.addListener((message, sender) => {
    return new Promise(async (resolve) => {
      if (message.command === "getState") {
        let remaining = timerState.running ? Math.max(0, Math.ceil((timerState.endTime - Date.now()) / 1000)) : timerState.timeRemaining;
        resolve({ timeRemaining: remaining, timerRunning: timerState.running, paused: timerState.paused, alarmSound: timerState.alarmSound });
      } else if (message.command === "start") {
        timerState.timeRemaining = message.timeRemaining;
        timerState.running = true;
        timerState.paused = false;
        timerState.endTime = Date.now() + timerState.timeRemaining * 1000;
        chrome.alarms.create("timerAlarm", { when: timerState.endTime });
        resolve({ success: true });
      } else if (message.command === "pause") {
        if (timerState.running && !timerState.paused) {
          timerState.timeRemaining = Math.max(0, Math.ceil((timerState.endTime - Date.now()) / 1000));
          timerState.paused = true;
          timerState.running = false;
          chrome.alarms.clear("timerAlarm");
          resolve({ success: true });
        } else {
          resolve({ success: false, message: "Timer is not running." });
        }
      } else if (message.command === "resume") {
        if (timerState.paused) {
          timerState.running = true;
          timerState.paused = false;
          timerState.endTime = Date.now() + timerState.timeRemaining * 1000;
          chrome.alarms.create("timerAlarm", { when: timerState.endTime });
          resolve({ success: true });
        } else {
          resolve({ success: false, message: "Timer is not paused." });
        }
      } else if (message.command === "stop") {
        timerState.running = false;
        timerState.paused = false;
        timerState.timeRemaining = 0;
        timerState.endTime = null;
        chrome.alarms.clear("timerAlarm");
        resolve({ success: true });
      } else if (message.command === "setAlarmSound") {
        timerState.alarmSound = message.soundFile;
        resolve({ success: true });
      } else if (message.command === "stopAlarm") {
        stopAlarmSound();
        resolve({ success: true });
      } else {
        resolve({ success: false, message: "Unknown command" });
      }
    });
  });
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "timerAlarm") {
      timerState.running = false;
      timerState.paused = false;
      timerState.timeRemaining = 0;
      timerState.endTime = null;
      playAlarm(timerState.alarmSound);
    }
  });
  
  async function playAlarm(soundFile) {
    await ensureOffscreenDocument();
    chrome.runtime.sendMessage({ command: "playAlarm", soundFile });
    chrome.storage.local.set({ alarmActive: true });
  }
  
  function stopAlarmSound() {
    chrome.runtime.sendMessage({ command: "stopAlarm" });
    chrome.storage.local.set({ alarmActive: false });
  }
  
  async function ensureOffscreenDocument() {
    const contexts = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] });
    if (contexts.length === 0) {
      await chrome.offscreen.createDocument({
        url: "offscreen.html",
        reasons: ["AUDIO_PLAYBACK"],
        justification: "Needed to play alarm sound"
      });
    }
  }
  