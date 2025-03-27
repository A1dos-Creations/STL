document.addEventListener("DOMContentLoaded", () => {
document.getElementById('claimBtn').addEventListener('click', async () => {
    const code = document.getElementById('upgradeCode').value.trim();
    const messageDiv = document.getElementById('messageL');
    const LLI = document.getElementById("licenseImg");

    if (!code) {
      messageDiv.textContent = "Please enter a code.";
      messageDiv.style.color = "red";
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) {
      messageDiv.textContent = "User not signed in!";
      messageDiv.style.color = "red";
      return;
    }
    try {
      const response = await fetch('https://api.a1dos-creations.com/claim-upgrade-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, code })
      });
      const data = await response.json();
      if (data.success) {
        messageDiv.textContent = "Your account has been upgraded to Premium! 🎉";
        messageDiv.style.color = "green";
        document.getElementById('licenseImg').src = "./images/premium.png"
      } else {
        messageDiv.textContent = data.message || "Failed to claim upgrade code.";      
        messageDiv.style.color = "red";
      }
    } catch (error) {
      console.error("Error claiming code:", error);
      messageDiv.textContent = "An error occurred.";
      messageDiv.style.color = "red";
    }
  });
});