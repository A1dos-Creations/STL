// background.js - Chrome Extension Service Worker

const API_BASE_URL_EXTENSION = 'https://api.a1dos-creations.com'; // Keep consistent or use a shared config
let extensionAuthToken = null; // Store token in memory or chrome.storage.local

// Function to get auth token for the extension
// This is a critical part: how does the extension get authenticated?
// 1. User logs in via an options page in the extension (most secure for extension-specific auth)
// 2. Using chrome.identity.getAuthToken if your backend supports Google Sign-In.
// 3. (Less Ideal) Website passes a token (security risks if not handled carefully).
async function ensureAuthenticated() {
    if (extensionAuthToken) return true;

    const storedToken = await chrome.storage.local.get(['extensionAuthToken']);
    if (storedToken.extensionAuthToken) {
        extensionAuthToken = storedToken.extensionAuthToken;
        // Optional: Validate token with a lightweight backend endpoint here
        // to ensure it's not expired before proceeding.
        // For simplicity, we assume if it exists, it's good for now.
        return true;
    }
    // If no token, the user might need to log in via the extension's options page
    // or popup.
    console.warn("Extension: Not authenticated. User needs to log in via extension options/popup.");
    // Optionally, open the options page:
    // chrome.runtime.openOptionsPage();
    return false;
}

// Listener for messages from your website
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    console.log("Extension: Message received from external source.");
    if (sender.origin === "https://manage.a1dos-creations.com") {
      if (request.action === "REQUEST_SYNC_FROM_WEBSITE") {
        console.log("Extension: Sync request received from website.");
        performSync()
          .then(() => sendResponse({ status: "sync_initiated", message: "Sync process started in extension." }))
          .catch(error => {
            console.error("Extension: Sync initiation failed.", error);
            sendResponse({ status: "sync_failed", message: error.message });
          });
        return true; // Indicates you wish to send a response asynchronously
      }
    } else {
        console.warn(`Extension: Message from untrusted origin ignored: ${sender.origin}`);
    }
    return false; // No async response planned for other messages
  }
);

async function performSync() {
    console.log("Extension: Starting sync process...");
    if (!await ensureAuthenticated()) {
        console.error("Extension: Cannot sync, authentication required.");
        // Notify user through popup or badge text if needed
        chrome.action.setBadgeText({ text: 'Auth!' });
        chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL_EXTENSION}/buttons/my`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${extensionAuthToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.error("Extension: Authentication failed during sync. Token might be invalid.");
                extensionAuthToken = null; // Clear potentially bad token
                await chrome.storage.local.remove('extensionAuthToken');
                chrome.action.setBadgeText({ text: 'Auth!' });
                chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
            }
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const buttons = await response.json();
        await chrome.storage.local.set({ userButtons: buttons });
        console.log("Extension: Buttons synced and stored locally.", buttons);
        chrome.action.setBadgeText({ text: 'OK' }); // Indicate successful sync
        chrome.action.setBadgeBackgroundColor({ color: '#00FF00' });
        setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000); // Clear badge after a few seconds

        // Optional: Send message to popup if it's open to update UI
        chrome.runtime.sendMessage({ action: "SYNC_COMPLETED", data: buttons });

    } catch (error) {
        console.error("Extension: Error during sync:", error);
        chrome.action.setBadgeText({ text: 'Err' });
        chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    }
}

// --- Optional: Periodic Sync using Alarms API ---
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "periodic-sync") {
    console.log("Extension: Periodic sync alarm triggered.");
    performSync();
  }
});

// Create an alarm for periodic sync (e.g., every hour)
// This will only be set once when the extension starts or is updated.
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.get("periodic-sync", (alarm) => {
    if (!alarm) {
        chrome.alarms.create("periodic-sync", {
            delayInMinutes: 5, // First sync after 5 minutes
            periodInMinutes: 60 // Then sync every 60 minutes
        });
        console.log("Extension: Periodic sync alarm created.");
    }
  });
  // Perform an initial sync on install/update
  // ensureAuthenticated().then(isAuthenticated => { if(isAuthenticated) performSync(); });
});

// --- Optional: Listener for when user logs in via extension options/popup ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "USER_LOGGED_IN_EXTENSION") {
        extensionAuthToken = request.token;
        chrome.storage.local.set({ extensionAuthToken: request.token }).then(() => {
            console.log("Extension: Auth token updated from internal message.");
            performSync(); // Sync after login
            sendResponse({status: "token_received"});
        });
        return true;
    }
});


// Initial check/load of token when service worker starts
(async () => {
    await ensureAuthenticated();
    // If authenticated, maybe do an initial sync if not done by onInstalled
    // console.log("Extension background script initialized.");
    // if (extensionAuthToken) {
    //    performSync(); // Sync if already logged in
    // }
})();

