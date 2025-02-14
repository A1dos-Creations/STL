// chrome-extension/popup/popup.js
document.getElementById('extension-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
  
    try {
      const response = await fetch('https://a1dos-creations.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (response.ok) {
        // Save the token using chrome.storage.local
        chrome.storage.local.set({ authToken: result.token }, () => {
          alert('Login successful!');
        });
      } else {
        alert(result.error || 'Login failed.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('An error occurred during login.');
    }
  });
  