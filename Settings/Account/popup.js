document.addEventListener("DOMContentLoaded", () => {
  const auth = firebase.auth();

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const messageDiv = document.getElementById("message");
  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");

  loginBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) return showMessage("Please enter email and password.", "red");
    auth.signInWithEmailAndPassword(email, password)
        .catch((error) => showMessage(`Login Error: ${error.message}`, "red"));
  });

  registerBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!name || !email || !password) return showMessage("Please fill all fields.", "red");
    auth.createUserWithEmailAndPassword(email, password)
        .then((cred) => cred.user.updateProfile({displayName: name}))
        .catch((error) => showMessage(`Registration Error: ${error.message}`, "red"));
  });

  auth.onAuthStateChanged((user) => {
    if (user) {
      showMessage(`Logged in as ${user.displayName || user.email}`, "green");
      chrome.storage.local.set({username: user.displayName});
    } else {
      showMessage("Please login or register", "blue");
    }
  });

  function showMessage(msg, color) {
    messageDiv.textContent = msg;
    messageDiv.style.color = color;
  }
});