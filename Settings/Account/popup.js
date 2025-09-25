// Extension/Settings/Account/popup.js

document.addEventListener("DOMContentLoaded", () => {
  if (typeof firebase === 'undefined') {
    console.error("Firebase is not initialized.");
    return;
  }

  // --- Get UI Elements ---
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const messageDiv = document.getElementById("message");
  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginView = document.getElementById("login-view");
  const userView = document.getElementById("user-view");
  const userInfo = document.getElementById("user-info");

  // --- Attach Event Listeners ---
  loginBtn.addEventListener("click", () => handleAuth(false));
  registerBtn.addEventListener("click", () => handleAuth(true));
  logoutBtn.addEventListener("click", () => firebase.auth().signOut());

  // --- Main Auth State Listener ---
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // User is signed in
      loginView.style.display = 'none';
      userView.style.display = 'block';
      userInfo.textContent = user.displayName || user.email;
    } else {
      // User is signed out
      loginView.style.display = 'block';
      userView.style.display = 'none';
    }
  });

  // --- New Compliant Authentication Handler ---
  async function handleAuth(isRegistering) {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (isRegistering && !name) return showMessage("Please enter a name to register.", "red");
    if (!email || !password) return showMessage("Please enter both email and password.", "red");
    
    try {
      showMessage("Connecting...", "grey");
      const createTokenFunction = firebase.functions().httpsCallable("createCustomAuthToken");
      
      const result = await createTokenFunction({
        email,
        password,
        name,
        isRegistering,
      });

      const token = result.data.token;
      if (token) {
        // Use the secure token to sign in on the client side
        await firebase.auth().signInWithCustomToken(token);
        showMessage("Success!", "green");
      } else {
        throw new Error("Failed to get authentication token.");
      }

    } catch (error) {
      console.error("Authentication Error:", error);
      showMessage(`Error: ${error.message}`, "red");
    }
  }

  function showMessage(msg, color) {
    messageDiv.textContent = msg;
    messageDiv.style.color = color;
  }
});