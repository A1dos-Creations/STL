document.addEventListener("DOMContentLoaded", function () {
    chrome.storage.local.get("username", function (data) {
        if (data.username) {
            document.getElementById("desc").textContent = "Hello, " + data.username + "!";
        }
    });
});
