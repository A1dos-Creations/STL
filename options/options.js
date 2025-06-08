// options.js
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const statusEl = document.getElementById('loginStatus');
    statusEl.textContent = 'Logging in...';

    try {
        // IMPORTANT: Your main auth server (a1dos-creations.com/account/auth)
        // or a dedicated API endpoint (api.a1dos-creations.com/auth/login-extension)
        // needs to handle this login and return a JWT token.
        const response = await fetch('https://api.a1dos-creations.com/auth/login-for-extension', { // EXAMPLE ENDPOINT
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw new Error(`Login failed: ${response.statusText}`);
        const data = await response.json();

        if (data.token) {
            // Send token to background script to store and initiate sync
            chrome.runtime.sendMessage({ action: "USER_LOGGED_IN_EXTENSION", token: data.token }, (response) => {
                if (chrome.runtime.lastError) {
                     statusEl.textContent = `Error communicating with background: ${chrome.runtime.lastError.message}`;
                } else if (response && response.status === 'token_received') {
                    statusEl.textContent = 'Login successful! Sync initiated.';
                    // Optionally close options page or show more info
                } else {
                     statusEl.textContent = 'Login successful, but background script did not confirm token receipt.';
                }
            });
        } else {
            throw new Error('Token not found in response.');
        }
    } catch (error) {
        statusEl.textContent = `Login error: ${error.message}`;
    }
});