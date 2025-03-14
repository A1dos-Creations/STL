document.addEventListener('DOMContentLoaded', function() {

    const apiBaseUrl = 'https://a1dos-login.onrender.com';

    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageDiv = document.getElementById('message');

    document.getElementById('login-btn').addEventListener('click', loginUser);
    document.getElementById('register-btn').addEventListener('click', registerUser);

    function loginUser() {
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email || !password) {
        showMessage('Please enter email and password for login.', 'red');
        return;
      }
      
      fetch(`${apiBaseUrl}/login-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
        .then(res => res.json())
        .then(data => {
          if (data.token) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showMessage(`Login successful! Welcome, ${data.user.name}`, 'green');
            chrome.storage.local.set({ username: data.user.name }, () => {
                if(name !== null) {
                    console.log("Name is set to: " + name);
                }
            });
          } else {
            showMessage(data, 'red');
          }
        })
        .catch(err => showMessage(`Login error: ${err.message}`, 'red'));
    }

    function registerUser() {
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!name || !email || !password) {
        showMessage('Please fill in name, email, and password to register.', 'red');
        return;
      }

      fetch(`${apiBaseUrl}/register-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
        .then(res => res.json())
        .then(data => {
          if (data.token) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showMessage(`Registration successful! Welcome, ${data.user.name}`, 'green');
            chrome.storage.local.set({ username: data.user.name })
          } else {
            showMessage(data, 'red');
          }
        })
        .catch(err => showMessage(`Registration error: ${err.message}`, 'red'));
    }

    function showMessage(msg, color) {
      messageDiv.textContent = msg;
      messageDiv.style.color = color;
    }

    window.onload = () => {
      const token = localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (token) {
        fetch(`${apiBaseUrl}/verify-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
          .then(res => res.json())
          .then(data => {
            if (data.valid) {
              showMessage(`Welcome back, ${user.name || user.email}`, 'green');
              chrome.storage.local.set({ username: user.name })
            } else {
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              showMessage('Session expired. Please login again.', 'red');
            }
          })
          .catch(err => {
            showMessage(`Error verifying token: ${err.message}`, 'red');
          });
      } else {
        showMessage('Please login or register', 'blue');
      }
    };

    const schoolDistrictSelect = document.getElementById("schoolDistrict");
    const schoolSelect = document.getElementById("school");
    const saveSchoolBtn = document.getElementById("saveSchoolBtn");
    const token = localStorage.getItem("authToken");

    fetch("https://a1dos-login.onrender.com/get-schools")
        .then(res => res.json())
        .then(data => {
            Object.keys(data).forEach(district => {
                const option = document.createElement("option");
                option.value = district;
                option.textContent = district;
                schoolDistrictSelect.appendChild(option);
            });

            schoolDistrictSelect.addEventListener("change", () => {
                const selectedDistrict = schoolDistrictSelect.value;
                schoolSelect.innerHTML = "";
                data[selectedDistrict].forEach(school => {
                    const option = document.createElement("option");
                    option.value = school;
                    option.textContent = school;
                    schoolSelect.appendChild(option);
                });
            });
        });

    saveSchoolBtn.addEventListener("click", () => {
        const schoolDistrict = schoolDistrictSelect.value;
        const schoolName = schoolSelect.value;

        fetch("https://a1dos-login.onrender.com/save-school", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, schoolDistrict, schoolName })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("School selection saved!");
            } else {
                alert("Error saving school.");
            }
        })
        .catch(err => console.error("Error:", err));
    });

    fetch("https://a1dos-login.onrender.com/get-user-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.school) {
            schoolDistrictSelect.value = data.school.school_district;
            schoolSelect.innerHTML = `<option selected>${data.school.school_name}</option>`;
        }
    });
});