// --- popup.js ---
const BACKEND_API_URL = 'https://api.a1dos-creations.com/'; // Or your production URL

const productCodeInput = document.getElementById('productCode');
const claimButton = document.getElementById('claimButton');
const messageArea = document.getElementById('messageArea');
const displayUserId = document.getElementById('displayUserId'); // You might display email or username instead
const premiumStatusEl = document.getElementById('premiumStatus');
const claimSection = document.getElementById('claimSection');
const statusSection = document.getElementById('statusSection');

let currentAuthToken = null;
let currentUserIdFromToken = null; // Store the user ID obtained from the token or status check

// Function to show messages in the popup
function showMessage(text, type) {
    messageArea.innerHTML = `<div class="message ${type}">${text}</div>`;
    setTimeout(() => { messageArea.innerHTML = ''; }, 5000);
}

// Function to load authToken and potentially initial user status
async function initializePopup() {
    chrome.storage.local.get(['authToken'], async (result) => {
        if (result.authToken) {
            currentAuthToken = result.authToken;
            console.log('AuthToken loaded from storage.');
            // If you also stored userId previously, you can use it.
            // Otherwise, rely on /api/me/status to confirm user and get details.
            await checkUserPremiumStatus(); // Check status using the loaded token
        } else {
            displayUserId.textContent = "Not logged in.";
            premiumStatusEl.textContent = 'Status: Please log in.';
            premiumStatusEl.className = 'not-premium';
            claimSection.style.display = 'none'; // Hide claim if not logged in
            statusSection.style.display = 'block';
            // Here you would typically show a login button or prompt.
            showMessage('Please log in to access premium features or claim codes.', 'error');
        }
    });
}

async function checkUserPremiumStatus() {
    if (!currentAuthToken) {
        premiumStatusEl.textContent = 'Status: Not Authenticated.';
        premiumStatusEl.className = 'not-premium';
        statusSection.style.display = 'block';
        claimSection.style.display = 'block';
        return false;
    }

    statusSection.style.display = 'block';
    premiumStatusEl.textContent = 'Status: Checking...';

    try {
        const response = await fetch(`${BACKEND_API_URL}/api/me/status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentAuthToken}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            premiumStatusEl.textContent = 'Status: Session expired or invalid. Please log in again.';
            premiumStatusEl.className = 'not-premium';
            claimSection.style.display = 'none';
            // Optionally clear the invalid token from storage
            // chrome.storage.local.remove(['authToken', 'userId']);
            // currentAuthToken = null;
            // currentUserIdFromToken = null;
            // displayUserId.textContent = "Not logged in.";
            return false;
        }

        const data = await response.json();

        if (response.ok && data.success) {
            currentUserIdFromToken = data.userId; // Update user ID from verified token
            displayUserId.textContent = data.email ? `User: ${data.email}` : `User ID: ${data.userId}`; // Display email if available
            chrome.storage.local.set({ userId: data.userId }); // Save verified userId

            if (data.is_premium) {
                premiumStatusEl.textContent = 'Status: Premium Active ✨';
                premiumStatusEl.className = 'premium';
                claimSection.style.display = 'none';
                chrome.storage.local.set({ isUserPremium: true });
                return true;
            } else {
                premiumStatusEl.textContent = 'Status: Not Premium';
                premiumStatusEl.className = 'not-premium';
                claimSection.style.display = 'block';
                chrome.storage.local.set({ isUserPremium: false });
                return false;
            }
        } else {
            premiumStatusEl.textContent = `Status: Error (${data.message || response.statusText})`;
            premiumStatusEl.className = 'not-premium';
            claimSection.style.display = 'block';
            return false;
        }
    } catch (error) {
        console.error('Error fetching user status:', error);
        premiumStatusEl.textContent = 'Status: Network error while checking status.';
        premiumStatusEl.className = 'not-premium';
        claimSection.style.display = 'block';
        return false;
    }
}

claimButton.addEventListener('click', async () => {
    const code = productCodeInput.value.trim().toUpperCase();

    if (!code) {
        showMessage('Please enter a product code.', 'error');
        return;
    }
    if (!currentAuthToken) {
        showMessage('You must be logged in to claim a code.', 'error');
        // Consider prompting login
        return;
    }

    claimButton.disabled = true;
    claimButton.textContent = 'Claiming...';

    try {
        const response = await fetch(`${BACKEND_API_URL}/api/claim-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentAuthToken}` // Send the token
            },
            body: JSON.stringify({
                code: code
                // No need to send userId, backend gets it from the token
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showMessage(data.message, 'success');
            productCodeInput.value = '';
            await checkUserPremiumStatus(); // Re-check status and update UI
        } else {
            showMessage(data.message || 'An error occurred while claiming the code.', 'error');
        }
    } catch (error) {
        console.error('Claim code error:', error);
        showMessage('Failed to connect to the server. Please try again.', 'error');
    } finally {
        claimButton.disabled = false;
        claimButton.textContent = 'Claim Code';
    }
});

// Initialize popup when it's opened
document.addEventListener('DOMContentLoaded', initializePopup);