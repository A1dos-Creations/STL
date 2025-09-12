// Extension/License/licenseHandler.js

document.addEventListener("DOMContentLoaded", () => {
    // Assuming firebase is initialized in license.html before this script
    const auth = firebase.auth();
    const functions = firebase.functions();

    const licenseKeyInput = document.getElementById("license-key");
    const claimBtn = document.getElementById("claim-btn");
    const statusDiv = document.getElementById("status");

    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is logged in, check their premium status
            const getPremiumStatus = functions.httpsCallable("getPremiumStatus");
            getPremiumStatus().then((result) => {
                if (result.data.is_premium) {
                    statusDiv.textContent = "Status: Premium Active ✨";
                    statusDiv.style.color = "green";
                    claimBtn.disabled = true;
                    licenseKeyInput.disabled = true;
                } else {
                    statusDiv.textContent = "Status: Free Account";
                    statusDiv.style.color = "orange";
                }
            });
        } else {
            // User is not logged in
            statusDiv.textContent = "Please log in to manage your license.";
            statusDiv.style.color = "red";
            claimBtn.disabled = true;
            licenseKeyInput.disabled = true;
        }
    });

    claimBtn.addEventListener("click", () => {
        const licenseCode = licenseKeyInput.value.trim();
        if (!licenseCode) {
            alert("Please enter a license code.");
            return;
        }
        const claimLicense = functions.httpsCallable("claimLicense");
        claimLicense({ licenseCode: licenseCode }).then((result) => {
            alert(result.data.message);
            // Reload status
            auth.currentUser?.reload().then(() => auth.onAuthStateChanged(auth.currentUser));
            window.location.reload(); // Simple way to refresh status
        }).catch((error) => {
            alert("Error: " + error.message);
        });
    });
});