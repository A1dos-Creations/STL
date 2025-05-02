// popup.js - AI Chat Feature Logic

document.addEventListener('DOMContentLoaded', function() {
     // --- Get Theme Elements ---
     const themeToggle = document.getElementById('themeToggle');
     const themeLabel = document.getElementById('theme-label-text'); // Optional label text
     const body = document.body;
     let currentConversationId = null;
 
     // --- Theme Handling Logic ---
     function setTheme(theme) { // theme should be 'light' or 'dark'
         body.classList.remove('light-mode', 'dark-mode'); // Remove existing theme classes
         body.classList.add(theme + '-mode'); // Add the current theme class
         themeToggle.checked = (theme === 'dark'); // Sync checkbox state to the theme
 
         // Update label text (Optional)
         if (themeLabel) {
             themeLabel.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
         }
 
         // Save the theme preference to Chrome storage
         chrome.storage.local.set({ preferredTheme: theme }, () => {
             if (chrome.runtime.lastError) {
                 console.error("Error saving theme:", chrome.runtime.lastError);
             } else {
                 console.log('Theme preference saved:', theme);
             }
         });
     }
 
     // Listener for the theme toggle switch change event
     if (themeToggle) {
         themeToggle.addEventListener('change', () => {
             setTheme(themeToggle.checked ? 'dark' : 'light');
         });
     }
 
     // Function to load and apply saved theme on startup
     async function loadAndApplyTheme() {
         try {
             // *** This part retrieves the saved theme ***
             const data = await chrome.storage.local.get('preferredTheme');
             const currentTheme = data.preferredTheme || 'light'; // Default to light if nothing stored
             setTheme(currentTheme); // Apply the loaded (or default) theme
             console.log('Applied theme:', currentTheme);
         } catch (error) {
             console.error("Error loading theme:", error);
             setTheme('light'); // Default to light on error
         }
     }
     // --- End Theme Handling Logic ---
 


    // --- AI Chat Logic ---
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const remainingCountSpan = document.getElementById('remaining-count');
    const loadingIndicator = document.getElementById('loading-indicator');
    const chatError = document.getElementById('chat-error');
    const conversationListElement = document.getElementById('conversation-list');
    const newChatButton = document.getElementById('new-chat-button');

    const BACKEND_URL = 'https://api.a1dos-creations.com/api/chat';

    let userId = null;
    let messagesRemaining = 5; // Default assumption, updated by backend response

    // Function to get or create a unique user ID using chrome.storage.local
    async function getUserId() {
        try {
            // Use await for cleaner async handling
            const result = await chrome.storage.local.get(['aiChatUserId']);
            if (result.aiChatUserId) {
                console.log("Retrieved User ID:", result.aiChatUserId);
                return result.aiChatUserId;
            } else {
                const newUserId = crypto.randomUUID(); // Generate unique ID
                await chrome.storage.local.set({ aiChatUserId: newUserId });
                console.log("Generated new User ID:", newUserId);
                return newUserId;
            }
        } catch (error) {
            console.error("Error accessing chrome.storage.local:", error);
            showError("Could not initialize user session. Please reload.");
            // Disable input if we can't get/set a user ID
            chatInput.disabled = true;
            sendButton.disabled = true;
            return null;
        }
    }

    // Function to add a message to the chat box UI
    // Keep track of any active typing intervals to clear them if needed
let typingIntervalId = null;

// Function to add a message to the chat box UI
function addMessage(text, sender, isHistoryLoading = false) { // sender is 'user' or 'ai'
    if (!text || typeof text !== 'string') {
        console.warn("Attempted to add invalid message content:", text);
        return;
    }

    // --- Stop any previous AI typing animation ---
    if (typingIntervalId) {
        clearInterval(typingIntervalId);
        typingIntervalId = null;
        // Ensure the last AI message element is fully displayed if interrupted
        const lastAiMessage = chatBox.querySelector('.message.ai:last-child p');
        if (lastAiMessage && !lastAiMessage.dataset.isComplete) {
             // Find the full text if stored, otherwise might be tricky
             // For now, we assume interruption means starting fresh
        }
    }
    // -----------------------------------------

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);

    const paragraph = document.createElement('p');
    messageElement.appendChild(paragraph);
    chatBox.appendChild(messageElement);

    // Scroll immediately to show the bubble starting
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });

    if (sender === 'model' && !isHistoryLoading) {
        // --- Simulate typing for NEW AI messages ---
        const words = text.trim().split(/(\s+)/);
        let currentWordIndex = 0;
        paragraph.textContent = '▋'; // Initial cursor block
        paragraph.dataset.isComplete = 'false'; // Mark as incomplete

        typingIntervalId = setInterval(() => {
            if (currentWordIndex < words.length) {
                paragraph.textContent = paragraph.textContent.slice(0, -1);
                paragraph.textContent += words[currentWordIndex];
                paragraph.textContent += '▋';
                currentWordIndex++;
                chatBox.scrollTop = chatBox.scrollHeight; // Scroll with typing
            } else {
                clearInterval(typingIntervalId);
                typingIntervalId = null;
                paragraph.textContent = paragraph.textContent.slice(0, -1); // Remove final cursor
                paragraph.dataset.isComplete = 'true'; // Mark as complete
            }
        }, 50); // Typing speed

    } else {
        // User messages OR historical AI messages appear instantly
        paragraph.textContent = text.trim();
        // If loading history, maybe don't scroll for every message, scroll once at the end
        if (!isHistoryLoading) {
             chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
        }
    }
    // --- END UPDATED LOGIC ---
    // Add fade-in animation via CSS class (optional)
    requestAnimationFrame(() => {
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';
    });

}

    // Function to handle sending a message to the backend
    async function sendMessage() {
        const messageText = chatInput.value.trim();
        const token = localStorage.getItem('authToken');

        // Ensure userId is loaded and message is not empty
        if (!userId) {
            showError("User session not initialized. Please try reloading.");
            return;
        }
        if (!messageText) {
            return;
        }

        // Check remaining messages locally (as a quick check)
        if (messagesRemaining <= 0) {
             showError("You have reached your daily message limit.");
             return;
        }


        addMessage(messageText, 'user'); // Display user message immediately
        chatInput.value = ''; // Clear input field
        chatInput.style.height = 'auto'; // Reset height after clearing
        setLoading(true);
        clearError();

        try {
            // Make the fetch request to the backend
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    message: messageText,
                    token: token
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific errors like rate limiting (429) or other server errors
                 if (response.status === 429) {
                     showError(data.error || 'Daily message limit reached.');
                     updateRemainingCount(data.remaining !== undefined ? data.remaining : 0);
                 } else {
                     throw new Error(data.error || `Request failed with status ${response.status}`);
                 }
                 // Don't proceed to add AI message if response not okay
                 setLoading(false); // Stop loading on error
                 return; // Exit function early
            }

            // Success - display AI reply and update count
            addMessage(data.reply, 'ai');
            updateRemainingCount(data.remaining);

        } catch (error) {
            console.error("Error sending/receiving chat message:", error);
            showError(`Error: ${error.message}. Could not connect to helper.`);
             // Don't assume remaining count changed if fetch itself failed
        } finally {
            // Ensure loading state is turned off regardless of success/error
            setLoading(false);
        }
    }

    // Function to update the remaining message count UI
    function updateRemainingCount(count) {
        console.log("updateRemainingCount received:", count, typeof count); // Add log to see input
    
        if (count === "Unlimited" || count === Infinity) {
            messagesRemaining = Infinity;
            remainingCountSpan.textContent = 'Unlimited'; // Display "Unlimited"
        } else {
            const numericCount = parseInt(count, 10);
            messagesRemaining = Math.max(0, isNaN(numericCount) ? 0 : numericCount);
            remainingCountSpan.textContent = messagesRemaining;
        }
    
        const limitReached = (typeof messagesRemaining === 'number' && messagesRemaining <= 0);
        console.log("Limit reached check:", limitReached, "messagesRemaining:", messagesRemaining); // Add log
    
        chatInput.disabled = limitReached;
        sendButton.disabled = limitReached;
        chatInput.placeholder = limitReached ? "Daily limit reached." : "Type your question...";
    
    }

    // Function to toggle loading indicator and disable/enable input
    function setLoading(isLoading) {
        loadingIndicator.style.display = isLoading ? 'inline-block' : 'none';
        // Only disable send button if loading, re-enable based on message count later
        sendButton.disabled = isLoading || (messagesRemaining <= 0);
         chatInput.disabled = isLoading || (messagesRemaining <= 0);
    }

     function showError(message) {
        chatError.textContent = message;
        chatError.style.display = 'block';
    }

     function clearError() {
        chatError.textContent = '';
        chatError.style.display = 'none';
    }

     // Auto-resize textarea height
     function autoResizeTextarea() {
        chatInput.style.height = 'auto'; // Reset height
        let scrollHeight = chatInput.scrollHeight;
        // Consider max-height from CSS. Apply scrollHeight only if less than max.
        // Get max-height value (e.g., '80px') and parse it.
         let maxHeight = parseInt(window.getComputedStyle(chatInput).maxHeight, 10);
         if (scrollHeight > maxHeight) {
             chatInput.style.height = maxHeight + 'px';
         } else {
             chatInput.style.height = scrollHeight + 'px';
         }
     }

     let conversationHistory = []; // Array to hold message objectsr
     async function loadConversationList() {
        const token = localStorage.getItem('authToken');
        if (!token) return; // Handle not logged in
        try {
            const response = await fetch(`${BACKEND_URL.replace('/api/chat', '')}/api/conversations`, { // Adjust URL based on backend base
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load conversations');
            const conversations = await response.json();
            displayConversationList(conversations);
        } catch (error) {
            console.error("Error loading conversation list:", error);
            showError("Could not load conversations.");
        }
    }

    function displayConversationList(conversations) {
        conversationListElement.innerHTML = ''; // Clear list
        if (!conversations || conversations.length === 0) {
            conversationListElement.innerHTML = '<li>No past conversations found.</li>';
            return;
        }
        conversations.forEach(convo => {
            const li = document.createElement('li');
            li.textContent = convo.title || `Chat from ${new Date(convo.updated_at).toLocaleDateString()}`; // Example title
            li.dataset.id = convo.id;
            li.addEventListener('click', () => loadSpecificConversation(convo.id));

            // Add delete button (optional)
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'X';
            deleteBtn.onclick = (e) => { e.stopPropagation(); deleteConversation(convo.id); };
            li.appendChild(deleteBtn);

            conversationListElement.appendChild(li);
        });
    }

    async function loadSpecificConversation(conversationId) {
        console.log("Loading conversation:", conversationId);
        currentConversationId = conversationId; // Set active conversation
        const token = localStorage.getItem('authToken');
        if (!token) return;
        setLoading(true); // Show loading state
        chatBox.innerHTML = ''; // Clear visual chat box

        try {
            const response = await fetch(`${BACKEND_URL.replace('/api/chat', '')}/api/conversations/${conversationId}`, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load history');
            const data = await response.json();

            // Populate chat UI from history
            if (data.history && data.history.length > 0) {
                 data.history.forEach(msg => {
                     // Use addMessage, but prevent it from adding to local history array
                     // Need to slightly modify addMessage or bypass its history logic if it had any
                     addMessage(msg.parts[0].text, msg.role);
                 });
            } else {
                 // Maybe add initial greeting if history is empty?
                 addMessage("How can I help you learn today?", 'ai');
            }

        } catch (error) {
            console.error("Error loading specific conversation:", error);
            showError("Could not load conversation history.");
            currentConversationId = null; // Reset if load failed
        } finally {
            setLoading(false);
        }
    }

    async function startNewConversation() {
        console.log("Starting new conversation...");
        const token = localStorage.getItem('authToken');
        if (!token) return;
        setLoading(true);
        chatBox.innerHTML = ''; // Clear visual chat box

        try {
             const response = await fetch(`${BACKEND_URL.replace('/api/chat', '')}/api/conversations`, {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${token}`
                 },
                 body: JSON.stringify({ title: "New Chat " + new Date().toLocaleTimeString() }) // Optional title
             });
             if (!response.ok) throw new Error('Failed to create conversation');
             const newConversation = await response.json();
             currentConversationId = newConversation.id; // Set new active ID
             addMessage("How can I help you learn today?", 'ai'); // Add initial message UI
             loadConversationList(); // Refresh list to show the new one
        } catch (error) {
             console.error("Error starting new conversation:", error);
             showError("Could not start new chat.");
             currentConversationId = null;
        } finally {
             setLoading(false);
        }
    }

     async function deleteConversation(conversationId) {
        if (!confirm("Are you sure you want to delete this conversation?")) return;

        console.log("Deleting conversation:", conversationId);
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
             const response = await fetch(`${BACKEND_URL.replace('/api/chat', '')}/api/conversations/${conversationId}`, {
                 method: 'DELETE',
                 headers: { 'Authorization': `Bearer ${token}` }
             });
             if (!response.ok) throw new Error('Failed to delete conversation');

             // If deleted conversation was the current one, clear the chat
             if (currentConversationId === conversationId) {
                  currentConversationId = null;
                  chatBox.innerHTML = '<div class="message ai"><p>Select or start a new conversation.</p></div>';
             }
             loadConversationList(); // Refresh the list

        } catch (error) {
             console.error("Error deleting conversation:", error);
             showError("Could not delete conversation.");
        }
    }

    // --- MODIFIED: sendMessage function ---
    async function sendMessage() {
        const newMessageText = chatInput.value.trim(); // Renamed for clarity
        const token = localStorage.getItem('authToken');

        if (!currentConversationId) { // << Check if a conversation is active
             showError("Please select or start a new conversation first.");
             return;
        }
        // ... (keep other checks: userId, token, newMessageText, messagesRemaining) ...
        if (!userId || !token || !newMessageText || messagesRemaining <= 0) {
            // Handle missing info or limit reached
            return;
        }

        addMessage(newMessageText, 'user'); // Add to UI
        // NO need to add to local conversationHistory array anymore

        chatInput.value = '';
        chatInput.style.height = 'auto';
        setLoading(true);
        clearError();

        try {
            // Call the MODIFIED /api/chat endpoint
            const response = await fetch(BACKEND_URL, { // Still POST to /api/chat
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Send token in header for isAuth middleware
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    // Send conversationId and the new message text
                    conversationId: currentConversationId,
                    newMessageText: newMessageText,
                    extensionUserId: userId // Still needed for rate limiting key
                    // No need to send 'token' in body if using Authorization header
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // No need to pop history here, as we didn't add optimistically
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            // Success - Add AI reply to UI
            addMessage(data.reply, 'ai');
            // NO need to add AI reply to local history array
            updateRemainingCount(data.remaining);

             // Optional: Refresh conversation list to update 'updated_at' sort order
             // loadConversationList();

        } catch (error) {
             console.error("Error sending/receiving chat message:", error);
             showError(`Error: ${error.message}.`);
        } finally {
            setLoading(false);
        }
    }

    // --- Initialize App ---
    async function initializeApp() {
        await loadAndApplyTheme(); // Load theme

        if (!document.getElementById('chat-box')) { // Check if chat UI exists
             console.log("Chat elements not found, skipping chat initialization.");
             return;
        }

        userId = await getUserId();
        if (!userId) return;

        updateRemainingCount(10); // Set initial visual count
        setLoading(false);
        clearError();

        // Setup event listeners
        if(newChatButton) newChatButton.addEventListener('click', startNewConversation);
        if(sendButton) sendButton.addEventListener('click', sendMessage);
        if(chatInput) {
            chatInput.addEventListener('keypress', function(event) {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                }
            });
            chatInput.addEventListener('input', autoResizeTextarea);
            autoResizeTextarea();
        }

        // Load initial conversation list
        await loadConversationList();

        // Optionally load the latest conversation automatically? Or show a welcome message.
        if (!currentConversationId) {
            chatBox.innerHTML = '<div class="message ai"><p>Select or start a new conversation.</p></div>';
        }

        console.log("AI Chat initialized successfully.");
    }

    initializeApp();

}); // End DOMContentLoaded listener