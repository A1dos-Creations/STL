// popup/popup.js
document.addEventListener('DOMContentLoaded', () => {
    const syncButton = document.getElementById('syncButton');
    const statusDiv = document.getElementById('status');
    const buttonsListUl = document.getElementById('buttons-list');
    // const optionsButton = document.getElementById('optionsButton'); // Keep if you use it

    function updateButtonList(buttons) {
        buttonsListUl.innerHTML = '';
        if (buttons && buttons.length > 0) {
            buttons.forEach(btn => {
                const li = document.createElement('li');
                // Ensure text is not too long for the popup
                li.textContent = btn.text.length > 30 ? btn.text.substring(0, 27) + "..." : btn.text;
                li.title = `${btn.text} (${btn.url})`; // Full text on hover
                buttonsListUl.appendChild(li);
            });
        } else {
            buttonsListUl.innerHTML = '<li>No buttons synced yet.</li>';
        }
    }

    syncButton.addEventListener('click', () => {
        statusDiv.textContent = 'Syncing...';
        // For Manifest V3, always use sendMessage to communicate with the service worker
        if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action: "TRIGGER_SYNC_FROM_POPUP" }, response => {
                if (chrome.runtime.lastError) {
                    statusDiv.textContent = `Error: ${chrome.runtime.lastError.message}`;
                    console.error("Popup sync trigger error:", chrome.runtime.lastError.message);
                } else if (response) {
                    if (response.status === "sync_started_or_completed") {
                        statusDiv.textContent = "Sync successful!";
                        // Assuming response.data contains the array of buttons
                        updateButtonList(response.data || []);
                    } else if (response.status === "error_during_sync") {
                        statusDiv.textContent = `Sync Error: ${response.message}`;
                    } else {
                         statusDiv.textContent = `Sync status: ${response.status || 'Unknown response from background.'}`;
                    }
                } else {
                     // This case might occur if the background script doesn't send a response
                     // or if there's an issue before a response can be formed.
                     statusDiv.textContent = "No definitive response from background. Sync might be in progress.";
                     console.warn("Popup: No response or undefined response from background script for TRIGGER_SYNC_FROM_POPUP.");
                     // Attempt to load from storage as a fallback after a short delay
                     setTimeout(loadStoredButtons, 1500);
                }
            });
        } else {
            statusDiv.textContent = 'Error: Chrome runtime not available for sending messages.';
            console.error("Popup: chrome.runtime.sendMessage is not available.");
        }
    });

    function loadStoredButtons() {
        chrome.storage.local.get('userButtons', (result) => {
            if (chrome.runtime.lastError) {
                statusDiv.textContent = 'Error loading stored buttons.';
                console.error("Error loading buttons from storage:", chrome.runtime.lastError.message);
                buttonsListUl.innerHTML = '<li>Error loading buttons.</li>';
                return;
            }
            if (result.userButtons && Array.isArray(result.userButtons)) {
                statusDiv.textContent = `Last sync data: ${result.userButtons.length} button(s).`;
                updateButtonList(result.userButtons);
            } else {
                statusDiv.textContent = 'No buttons found in local storage. Try syncing.';
                buttonsListUl.innerHTML = '<li>Sync to see your buttons.</li>';
            }
        });
    }

    // Initial load of buttons when popup opens
    loadStoredButtons();

    // Listen for messages from background script (e.g., after an automatic sync completion)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        // Check if the message is from the service worker (background script) itself.
        // In Manifest V3, sender.id will be the extension's own ID for messages from the service worker.
        // There's no `sender.tab` for messages from the service worker.
        if (!sender.tab && request.action === "SYNC_COMPLETED") {
            statusDiv.textContent = `Background Sync completed! ${request.data ? request.data.length : 0} button(s).`;
            if (request.data) {
                updateButtonList(request.data);
            }
        }
        // If you need to send a response back for some reason from this listener:
        // sendResponse({received: true});
        // return false; // Or true if sending async response
    });

    // If you have an options button:
    // const optionsButton = document.getElementById('optionsButton');
    // if (optionsButton) {
    //     optionsButton.addEventListener('click', () => {
    //         if (chrome.runtime.openOptionsPage) {
    //             chrome.runtime.openOptionsPage();
    //         } else {
    //             // Fallback for older versions or if the function isn't available
    //             window.open(chrome.runtime.getURL('options/options.html'));
    //         }
    //     });
    // }
});