// Extension/ai_helper/popup.js

document.addEventListener("DOMContentLoaded", function () {
  // --- Get UI Elements ---
  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const sendButton = document.getElementById("send-button");
  const loadingIndicator = document.getElementById("loading-indicator");
  const chatError = document.getElementById("chat-error");
  const conversationListElement = document.getElementById("conversation-list");
  const newChatButton = document.getElementById("new-chat-button");
  const screenshotBtn = document.getElementById("screenshot-btn");
  const imagePreviewContainer = document.getElementById("image-preview-container");
  const chatInputContainer = document.getElementById("chat-input-container");
  const expandBtn = document.getElementById("expand-btn");
  const conversationToggleButton = document.getElementById("conversation-toggle-button");
  const collapsibleContent = document.getElementById("collapsible-content");
  const premiumStatusDiv = document.getElementById("premium-status");
  const licenseInput = document.getElementById("license-input");
  const claimButton = document.getElementById("claim-button");

  let currentUser = null;
  let currentConversationId = null;
  let pendingScreenshotBlob = null;
  let isCreatingConversation = false;

  auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
      initializeApp();
    } else {
      showLoginMessage();
    }
  });

  function initializeApp() {
    loadAndApplyTheme();
    newChatButton.addEventListener("click", startNewConversation);
    sendButton.addEventListener("click", sendMessage);
    screenshotBtn.addEventListener("click", takeScreenshot);
    claimButton.addEventListener("click", claimLicense);
    expandBtn.addEventListener("click", () => chatInputContainer.classList.toggle('expanded'));
    conversationToggleButton.addEventListener("click", () => {
        conversationToggleButton.classList.toggle('open');
        collapsibleContent.classList.toggle('open');
    });
    chatInput.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } });
    chatInput.addEventListener('input', () => { chatInput.style.height = 'auto'; chatInput.style.height = (chatInput.scrollHeight) + 'px'; });
    
    loadConversationList();
    checkAndDisplayPremiumStatus();
    chatBox.innerHTML = `<div class="message model"><p>Select or start a new conversation.</p></div>`;
  }

  async function uploadImageAndGetUrl() {
    if (!pendingScreenshotBlob || !currentUser) return null;
    try {
        const fileName = `${Date.now()}.jpg`;
        const storagePath = `users/${currentUser.uid}/${fileName}`;
        const storageRef = storage.ref(storagePath);
        const snapshot = await storageRef.put(pendingScreenshotBlob);
        const downloadUrl = await snapshot.ref.getDownloadURL();
        return downloadUrl;
    } catch (error) {
        // This will force the detailed error to appear in a popup.
        alert("Upload Error Details: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
        console.error("Upload failed:", error);
        return null;
    }
  }

  async function sendMessage() {
    const messageText = chatInput.value.trim();
    const imageToUpload = pendingScreenshotBlob;

    if (!currentUser || (!messageText && !imageToUpload)) return;
    if (!currentConversationId) {
        const newId = await startNewConversation();
        if (!newId) { showError("Could not start conversation."); return; }
    }

    addMessage("user", messageText, imageToUpload ? URL.createObjectURL(imageToUpload) : null);
    chatInput.value = "";
    chatInput.style.height = 'auto';
    // The problematic clearImagePreview() call was removed from here.

    const generatingMessageId = `gen-${Date.now()}`;
    addMessage("model", null, null, false, generatingMessageId);

    let finalImageUrl = null;
    if (imageToUpload) {
      finalImageUrl = await uploadImageAndGetUrl();
      
      // FIX: The line is moved here. We now clear the preview
      // and blob AFTER the upload is successfully finished.
      clearImagePreview(); 
      
      if (!finalImageUrl) {
        // If upload fails, the alert() has already fired. We just clean up the UI.
        const generatingMessage = document.getElementById(generatingMessageId);
        if (generatingMessage) generatingMessage.remove();
        return;
      }
    }

    try {
      const chatWithAIFunction = functions.httpsCallable("chatWithAI");
      const result = await chatWithAIFunction({
        conversationId: currentConversationId,
        newMessageText: messageText,
        imageUrl: finalImageUrl,
      });
      
      updateGeneratingMessage(generatingMessageId, result.data.reply, false);
      loadConversationList(); 
    } catch (error) {
      console.error("Error calling chat function:", error);
      updateGeneratingMessage(generatingMessageId, `Error: ${error.message}`, true);
    }
}
  
  // --- All other functions below are unchanged ---

  async function startNewConversation() {
    if (!currentUser || isCreatingConversation) return null;
    isCreatingConversation = true;
    try {
        const convosRef = db.collection("users").doc(currentUser.uid).collection("conversations");
        const newConvoDoc = await convosRef.add({
            title: `New Chat ${new Date().toLocaleTimeString()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            history: [],
            isPinned: false,
        });
        currentConversationId = newConvoDoc.id;
        chatBox.innerHTML = `<div class="message model"><p>How can I help you today?</p></div>`;
        await loadConversationList();
        return currentConversationId;
    } catch (error) {
        showError("Could not start a new chat.");
        console.error("Error starting conversation:", error);
        return null;
    } finally {
        isCreatingConversation = false;
    }
  }
  async function loadConversationList() {
    if (!currentUser) return;
    conversationListElement.innerHTML = "<li>Loading...</li>";
    try {
      const convosRef = db.collection("users").doc(currentUser.uid).collection("conversations")
        .orderBy("isPinned", "desc")
        .orderBy("updatedAt", "desc");
      const snapshot = await convosRef.get();
      conversationListElement.innerHTML = "";
      if (snapshot.empty) {
        conversationListElement.innerHTML = "<li>No conversations yet.</li>";
        return;
      }
      snapshot.forEach((doc) => {
        const convo = doc.data();
        const convoId = doc.id;
        const li = document.createElement("li");
        const titleSpan = document.createElement("span");
        titleSpan.textContent = convo.title || `Chat from ${convo.updatedAt.toDate().toLocaleDateString()}`;
        titleSpan.addEventListener("click", () => loadSpecificConversation(convoId));
        if (convo.isPinned) {
            li.classList.add("pinned");
            const pinIcon = document.createElement("div");
            pinIcon.className = 'pin-icon';
            pinIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px" fill="currentColor"><path d="M680-880v80h-40L496-544v224l104 104v80H360v-80l104-104v-224L320-800H280v-80h400Z"/></svg>`;
            li.appendChild(pinIcon);
        }
        li.appendChild(titleSpan);
        const menuContainer = document.createElement("div");
        menuContainer.className = "convo-menu-container";
        const menuButton = document.createElement("button");
        menuButton.className = "convo-menu-button";
        menuButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z"/></svg>`;
        const dropdownMenu = document.createElement("div");
        dropdownMenu.className = "convo-dropdown-menu";
        dropdownMenu.innerHTML = `<a href="#" class="pin-action">${convo.isPinned ? "Unpin" : "Pin"}</a><a href="#" class="rename-action">Rename</a><a href="#" class="delete-action">Delete</a>`;
        menuButton.addEventListener("click", (e) => {
            e.stopPropagation();
            const isVisible = dropdownMenu.classList.contains('visible');
            document.querySelectorAll('.convo-dropdown-menu.visible').forEach(menu => { menu.classList.remove('visible'); });
            if (!isVisible) {
                const rect = menuButton.getBoundingClientRect();
                dropdownMenu.style.top = `${rect.bottom + 2}px`;
                dropdownMenu.style.right = `${window.innerWidth - rect.right - (dropdownMenu.offsetWidth / 2) - (rect.width / 2)}px`;
                dropdownMenu.classList.add("visible");
            }
        });
        dropdownMenu.querySelector('.pin-action').addEventListener('click', (e) => { e.preventDefault(); handlePinConversation(convoId, convo.isPinned); });
        dropdownMenu.querySelector('.rename-action').addEventListener('click', (e) => { e.preventDefault(); handleRenameConversation(convoId, convo.title); });
        dropdownMenu.querySelector('.delete-action').addEventListener('click', (e) => { e.preventDefault(); handleDeleteConversation(convoId); });
        menuContainer.appendChild(menuButton);
        document.body.appendChild(dropdownMenu);
        li.appendChild(menuContainer);
        conversationListElement.appendChild(li);
      });
    } catch (error) {
      showError("Could not load conversations.");
      console.error("Error loading conversations:", error);
    }
  }
  async function loadSpecificConversation(convoId) { if (!currentUser) return; currentConversationId = convoId; chatBox.innerHTML = ""; try { const convoRef = db.collection("users").doc(currentUser.uid).collection("conversations").doc(convoId); const doc = await convoRef.get(); if (doc.exists) { const history = doc.data().history || []; history.forEach((turn) => { const textPart = turn.parts.find(p => p.text)?.text || ""; const imagePart = turn.parts.find(p => p.imageUrl)?.imageUrl || null; addMessage(turn.role, textPart, imagePart, true); }); } } catch (error) { showError("Could not load conversation history."); console.error("Error loading history:", error); } }
  function addMessage(role, text, imageUrl, isHistory = false, messageId = null) { const msgEl = document.createElement("div"); if (messageId) msgEl.id = messageId; msgEl.classList.add("message", role); if (imageUrl) { const img = document.createElement("img"); img.src = imageUrl; img.className = "chat-history-image"; msgEl.appendChild(img); } const contentEl = document.createElement("div"); contentEl.className = 'message-content'; msgEl.appendChild(contentEl); if (text) { if (role === 'user' || isHistory) { contentEl.innerHTML = marked.parse(text, { sanitize: true }); } } else if (role === 'model' && !isHistory) { msgEl.classList.add('generating'); contentEl.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`; } chatBox.appendChild(msgEl); chatBox.scrollTop = chatBox.scrollHeight; }
  function updateGeneratingMessage(messageId, newText, isError = false) { const msgEl = document.getElementById(messageId); if (!msgEl) return; msgEl.classList.remove('generating'); if (isError) msgEl.classList.add('error'); const contentEl = msgEl.querySelector('.message-content'); if (isError) { contentEl.innerHTML = `<p>${newText}</p>`; } else { typeOutMessage(contentEl, newText); } }
  function typeOutMessage(element, text) { const words = text.split(' '); let currentContent = ''; let wordIndex = 0; function addWord() { if (wordIndex < words.length) { currentContent += words[wordIndex] + ' '; element.innerHTML = marked.parse(currentContent, { sanitize: true }); chatBox.scrollTop = chatBox.scrollHeight; wordIndex++; setTimeout(addWord, 50); } } addWord(); }
  document.addEventListener('click', () => { document.querySelectorAll('.convo-dropdown-menu.visible').forEach(menu => { menu.classList.remove('visible'); }); });
  async function checkAndDisplayPremiumStatus() { try { const getStatus = functions.httpsCallable('getPremiumStatus'); const result = await getStatus(); premiumStatusDiv.textContent = result.data.is_premium ? 'Status: Premium' : 'Status: Free'; if (result.data.is_premium) { premiumStatusDiv.classList.add('premium'); } else { premiumStatusDiv.classList.remove('premium'); } } catch (error) { premiumStatusDiv.textContent = 'Status: Error'; console.error("Could not check premium status:", error); } }
  async function claimLicense() { const code = licenseInput.value.trim(); if (!code) { alert("Please enter a license code."); return; } try { const claim = functions.httpsCallable('claimLicense'); const result = await claim({ licenseCode: code }); alert(result.data.message); if (result.data.success) { licenseInput.value = ''; checkAndDisplayPremiumStatus(); } } catch (error) { alert(`An error occurred: ${error.message}`); console.error("Error claiming license:", error); } }
  async function handlePinConversation(convoId, isPinned) { if (!currentUser) return; const convoRef = db.collection("users").doc(currentUser.uid).collection("conversations").doc(convoId); await convoRef.update({ isPinned: !isPinned }); loadConversationList(); }
  async function handleRenameConversation(convoId, currentTitle) { if (!currentUser) return; const newTitle = prompt("Enter a new name for the chat:", currentTitle); if (newTitle && newTitle.trim() !== "") { const convoRef = db.collection("users").doc(currentUser.uid).collection("conversations").doc(convoId); await convoRef.update({ title: newTitle.trim() }); loadConversationList(); } }
  async function handleDeleteConversation(convoId) {
      if (!currentUser) return;

      const overlay = document.getElementById("custom-confirm-overlay");
      const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
      const confirmCancelBtn = document.getElementById("confirm-cancel-btn");

      overlay.style.display = 'flex';

      // We use a Promise to wait for the user's choice
      const userChoice = new Promise(resolve => {
          confirmDeleteBtn.onclick = () => resolve(true);
          confirmCancelBtn.onclick = () => resolve(false);
      });

      const shouldDelete = await userChoice;
      overlay.style.display = 'none'; // Hide the popup after choice

      if (shouldDelete) {
          try {
              const deleteFunction = functions.httpsCallable("deleteConversation");
              await deleteFunction({ conversationId: convoId });
              
              if (currentConversationId === convoId) {
                  currentConversationId = null;
                  chatBox.innerHTML = `<div class="message model"><p>Select or start a new conversation.</p></div>`;
              }
              loadConversationList();
          } catch (error) {
              showError("Could not delete conversation.");
              console.error("Error deleting conversation:", error);
          }
      }
  }
  function clearImagePreview() { const previewImg = imagePreviewContainer.querySelector("img"); if (previewImg) { URL.revokeObjectURL(previewImg.src); } pendingScreenshotBlob = null; imagePreviewContainer.innerHTML = ""; imagePreviewContainer.style.display = 'none'; }
  function showLoginMessage() { chatBox.innerHTML = `<div class="message model"><p>Please log in to use the AI Helper.</p></div>`; conversationListElement.innerHTML = ""; [sendButton, chatInput, newChatButton, screenshotBtn].forEach((el) => (el.disabled = true)); }
  function showError(msg){ chatError.textContent = msg; chatError.style.display = "block";}
  async function takeScreenshot() { chrome.tabs.captureVisibleTab(null, { format: "jpeg" }, (dataUrl) => { if (chrome.runtime.lastError) { return showError("Could not capture tab: " + chrome.runtime.lastError.message); } const img = new Image(); img.onload = () => { const canvas = document.createElement("canvas"); const ctx = canvas.getContext("2d"); const maxWidth = 1024; const aspectRatio = img.width / img.height; canvas.width = Math.min(maxWidth, img.width); canvas.height = canvas.width / aspectRatio; ctx.drawImage(img, 0, 0, canvas.width, canvas.height); canvas.toBlob((blob) => { pendingScreenshotBlob = blob; displayImagePreview(URL.createObjectURL(blob)); }, "image/jpeg", 0.7); }; img.src = dataUrl; }); }
  function displayImagePreview(blobUrl) { imagePreviewContainer.innerHTML = `<img src="${blobUrl}" alt="Screenshot preview">`; imagePreviewContainer.style.display = 'block'; }
  async function loadAndApplyTheme() { const themeToggle = document.getElementById('themeToggle'); const body = document.body; function setTheme(theme) { body.classList.remove('light-mode', 'dark-mode'); body.classList.add(theme + '-mode'); themeToggle.checked = (theme === 'dark'); chrome.storage.local.set({ preferredTheme: theme }); } if (themeToggle) { themeToggle.addEventListener('change', () => { setTheme(themeToggle.checked ? 'dark' : 'light'); }); } try { const data = await chrome.storage.local.get('preferredTheme'); setTheme(data.preferredTheme || 'light'); } catch (error) { console.error("Error loading theme:", error); setTheme('light'); } }
});