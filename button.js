// Favorite Button - Un-favorite Button \\
// COMING SOON \\

// Custom button scripts: \\

// Get references to elements
const mainBody = document.getElementById('cstmBttnContent');
const textInput = document.getElementById('textInput');
const urlInput = document.getElementById('urlInput');
const updateButton = document.getElementById('updateButton');
const targetButton = document.getElementById('targetButton');
const openButton = document.getElementById('togglebodyButton');
const topBody = document.getElementById('mainBody')

// Show/hide the container
openButton.addEventListener("click", () => {
  mainBody.style.display = mainBody.style.display === "block" || mainBody.style.display === "" ? "none" : "block";
});

// Load saved buttons on extension load
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("clonedButtons", (data) => {
    const savedButtons = data.clonedButtons || [];
    savedButtons.forEach((buttonData) => {
      createClonedButton(buttonData.text, buttonData.url, buttonData.id);
    });
  });
});

// Add event listener to the "Update Button Text and Link" button
updateButton.addEventListener('click', () => {
  const newText = textInput.value.trim(); // Get input value for text
  const newUrl = urlInput.value.trim(); // Get input value for URL

  if (!newText || !newUrl) {
    alert('Please enter both text and a valid URL.');
    return;
  }

  // Generate a unique ID for the cloned button
  const clonedButtonId = `clonedButton-${Date.now()}`;

  // Create the cloned button
  createClonedButton(newText, newUrl, clonedButtonId);

  // Save the cloned button to Chrome Storage
  saveClonedButton(newText, newUrl, clonedButtonId);
});

// Function to create and append a cloned button
// Function to create and append a cloned button with a delete button
function createClonedButton(text, url, id) {
  const container = document.createElement("div"); // Wrapper for the button and delete button
  container.classList.add("button-container");

  const clonedButton = document.createElement("button");
  clonedButton.id = id;
  clonedButton.textContent = text;
  clonedButton.classList.add("cloned");
  clonedButton.classList.add("ButtonL")
  clonedButton.style.display = 'inline-block';

  // Wrap the cloned button in an anchor tag to set href
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank"; // Open in a new tab
  anchor.appendChild(clonedButton);
  topBody.appendChild(anchor);

  // Create a delete button
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "";
  deleteButton.classList.add("deleteButton");
  deleteButton.style.marginLeft = "10px";
  // Add it's image:
  const deleteIcon = document.createElement("img");
  deleteIcon.src = "./images/delete.png";
  deleteIcon.alt = "Delete This Button";
  deleteIcon.style.height = "12px";
  deleteIcon.style.width = "12px";
  deleteIcon.style.pointerEvents = "none";
  // Apend the image to the delete button
  deleteButton.appendChild(deleteIcon);

  const favButton = document.createElement("img");
  favButton.textContent = "";
  favButton.classList.add("favButton");
  favButton.style.marginLeft = "-10px";

  const favIcon = document.createElement("button");
  favIcon.src = "./images/DefaultFavorite.png";
  favIcon.alt = "Add this button to your favorites list";
  favIcon.style.height = "12px";
  favIcon.style.width = "12px";
  favButton.style.pointerEvents = "none";
  favIcon.appendChild(favButton)


  // Append the anchor and delete button to the container
  container.appendChild(anchor);
  container.appendChild(deleteButton);

  // Append the container to your desired parent
  document.getElementById("mainBody").appendChild(container);

  // Attach delete functionality
  deleteButton.addEventListener("click", () => {
    deleteClonedButton(id, container);
  });
}

// Function to delete a cloned button
function deleteClonedButton(id, container) {
  // Remove the container from the DOM
  container.remove();

  // Update Chrome Storage
  chrome.storage.local.get("clonedButtons", (data) => {
    const clonedButtons = data.clonedButtons || [];
    const updatedButtons = clonedButtons.filter((button) => button.id !== id);

    chrome.storage.local.set({ clonedButtons: updatedButtons }, () => {
      console.log(`Button with ID ${id} deleted.`);
    });
  });
}


// Function to save cloned buttons to Chrome Storage
function saveClonedButton(text, url, id) {
  chrome.storage.local.get("clonedButtons", (data) => {
    const clonedButtons = data.clonedButtons || [];
    clonedButtons.push({ text, url, id });

    chrome.storage.local.set({ clonedButtons }, () => {
      console.log(`Cloned button saved: ${text}, ${url}, ${id}`);
    });
  });
}


// Theme toggle Button \\
const themeToggleImg = document.getElementById("themeToggleImg");
const themeToggle = document.getElementById("themeToggle");

const background = document.getElementById("mainBody");

const urlLabel = document.getElementById("URLabel");
const textLabel = document.getElementById("textLabel");

const button1 = document.getElementById("button1");
const button2 = document.getElementById("button2");
const button3 = document.getElementById("button3");

const header = document.getElementById("Heading");

const menuButton = document.getElementById("menuButton");

// ↓↓ Main.html file const values ↓↓
const showTimerBtn = document.getElementById("show-buttons");
const portalBtn = document.getElementById("portal-disc");
const favBtn = document.getElementById("favorite-button");
const favsDesc = document.getElementById("favorites-desc");

// Function to apply the saved theme
function applySavedTheme(theme) {
  if (theme === "darkMode") {

    // ↓↓ main.html file values ↓↓

    showTimerBtn.classList.add("show-buttonsD");
    showTimerBtn.classList.remove("show-buttonsL");

    portalBtn.classList.add("portal-discD");
    portalBtn.classList.remove("portal-discL");

    /*
    favBtn.classList.add("favorite-buttonD");
    favBtn.classList.remove("favorite-buttonL");

    favsDesc.classList.add("favorites-descD");
    favsDesc.classList.remove("favorites-descL");
    */

    // ↑↑ ↑↑ ↑↑ ↑↑ ↑↑

    background.classList.add("darkMode");
    background.classList.remove("lightMode");

    textInput.classList.add("IDark");
    textInput.classList.remove("ILight");

    urlInput.classList.add("IDark");
    urlInput.classList.remove("ILight");

    urlLabel.classList.add("dark");
    urlLabel.classList.remove("light");

    textLabel.classList.add("dark");
    textLabel.classList.remove("light");

    button1.classList.add("buttonD");
    button2.classList.add("buttonD");
    button3.classList.add("buttonD");
    button1.classList.remove("buttonL");
    button2.classList.remove("buttonL");
    button3.classList.remove("buttonL");

    header.classList.add("mainHeaderD")
    header.classList.remove("mainHeaderL")

    updateButton.classList.add("BDark", "BTDark");
    updateButton.classList.remove("BLight", "BTLight");

    openButton.classList.add("customContentD");
    openButton.classList.remove("customContentL");

    menuButton.classList.add("menuButtonDark");
    menuButton.classList.remove("menuButtonLight");

    themeToggleImg.src = "./images/light.png";
  } else {

    // ↓↓ main.html file values ↓↓

    showTimerBtn.classList.add("show-buttonsL");
    showTimerBtn.classList.remove("show-buttonsD");
    
    portalBtn.classList.add("portal-discL");
    portalBtn.classList.remove("portal-discD");
    
    /*
    favBtn.classList.add("favorite-buttonL");
    favBtn.classList.remove("favorite-buttonD");

    favsDesc.classList.add("favorites-descL");
    favsDesc.classList.remove("favorites-descD");
    */
    
    // ↑↑ ↑↑ ↑↑ ↑↑ ↑↑

    background.classList.add("lightMode");
    background.classList.remove("darkMode");

    textInput.classList.add("ILight");
    textInput.classList.remove("IDark");

    urlInput.classList.add("ILight");
    urlInput.classList.remove("IDark");

    urlLabel.classList.add("light");
    urlLabel.classList.remove("dark");
    
    textLabel.classList.add("light");
    textLabel.classList.remove("dark");

    button1.classList.add("buttonL");
    button2.classList.add("buttonL");
    button3.classList.add("buttonL");
    button1.classList.remove("buttonD");
    button2.classList.remove("buttonD");
    button3.classList.remove("buttonD");

    header.classList.add("mainHeaderL");
    header.classList.remove("mainHeaderD");

    openButton.classList.add("customContentL");
    openButton.classList.remove("customContentD");

    updateButton.classList.add("BLight", "BTLight");
    updateButton.classList.remove("BDark", "BTDark");

    menuButton.classList.add("menuButtonLight");
    menuButton.classList.remove("menuButtonDark");

    themeToggleImg.src = "./images/dark.png";
  }
};
// Load the saved theme on extension load
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("theme", (data) => {
    const savedTheme = data.theme || "lightMode"; // Default to lightMode if nothing is saved
    applySavedTheme(savedTheme);
  });
});

// Toggle theme and save it
themeToggle.addEventListener("click", () => {
  let currentTheme;
  if (background.classList.contains("lightMode")) {
    currentTheme = "darkMode";
    applySavedTheme(currentTheme);
  } else {
    currentTheme = "lightMode";
    applySavedTheme(currentTheme);
  }

  // Save the theme to Chrome Storage
  chrome.storage.local.set({ theme: currentTheme }, () => {
    console.log(`Theme saved: ${currentTheme}`);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const element = document.getElementById('mainBody');

  chrome.storage.local.get('savedClass', (data) => {
    if (data.savedClass) {
      element.className = data.savedClass;
    }
  });
});