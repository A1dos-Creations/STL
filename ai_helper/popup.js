// popup.js - AI Chat Feature Logic

document.addEventListener('DOMContentLoaded', function() {

    // --- Theme Handling (Optional - Add back if needed) ---
    // const themeToggle = document.getElementById('themeToggle');
    // const body = document.body;
    // Define setTheme function...
    // Add event listener for themeToggle...
    // Load initial theme from storage...
    // console.log("Theme handling skipped/loaded.");

     // --- Get Theme Elements ---
     const themeToggle = document.getElementById('themeToggle');
     const themeLabel = document.getElementById('theme-label-text'); // Optional label text
     const body = document.body;
 
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

    // ** IMPORTANT: Replace with your actual backend URL **
    // Use http://localhost:3000 for local testing
    // Use your deployed backend URL for production
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
function addMessage(text, sender) { // sender is 'user' or 'ai'
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

    if (sender === 'ai') {
        // --- Simulate typing for AI messages ---
        const words = text.trim().split(/(\s+)/); // Split by space, keeping spaces
        let currentWordIndex = 0;
        paragraph.textContent = '▋'; // Initial cursor block
        paragraph.dataset.isComplete = 'false'; // Mark as incomplete

        typingIntervalId = setInterval(() => {
            if (currentWordIndex < words.length) {
                // Append the next word (or space)
                 paragraph.textContent = paragraph.textContent.slice(0, -1); // Remove cursor
                 paragraph.textContent += words[currentWordIndex];
                 paragraph.textContent += '▋'; // Add cursor back
                 currentWordIndex++;

                 // Ensure scroll stays at bottom during typing
                 chatBox.scrollTop = chatBox.scrollHeight;
            } else {
                // Finished typing
                clearInterval(typingIntervalId);
                typingIntervalId = null;
                paragraph.textContent = paragraph.textContent.slice(0, -1); // Remove final cursor
                paragraph.dataset.isComplete = 'true'; // Mark as complete
            }
        }, 50); // Adjust interval speed (milliseconds per word/space)

    } else {
        // User messages appear instantly
        paragraph.textContent = text.trim();
        // Ensure scroll stays at bottom
        chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    }

    // Add fade-in animation via CSS class (optional)
    requestAnimationFrame(() => {
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';
    });

}

    // Function to handle sending a message to the backend
    async function sendMessage() {
        const messageText = chatInput.value.trim();

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
                    message: messageText
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
        // Ensure count is a non-negative number
        messagesRemaining = Math.max(0, parseInt(count, 10) || 0);
        remainingCountSpan.textContent = messagesRemaining;

         // Disable input if limit reached
         const limitReached = messagesRemaining <= 0;
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


    // --- Initialize Chat ---
    async function initializeChat() {
        await loadAndApplyTheme(); // Load and apply theme on startup
        // Ensure all required elements exist before proceeding
        if (!chatBox || !chatInput || !sendButton || !remainingCountSpan || !loadingIndicator || !chatError) {
            console.error("Chat UI elements not found. Aborting chat initialization.");
            return;
        }

        userId = await getUserId(); // Get or generate user ID on load
        if (!userId) return; // Stop if ID failed

        console.log("Chat User ID:", userId);

        // Set initial UI state (assume 5, backend response will correct it)
        updateRemainingCount(10);
        setLoading(false); // Ensure loading is off initially
        clearError();

        // Event Listeners for Chat
        sendButton.addEventListener('click', sendMessage);

        chatInput.addEventListener('keypress', function(event) {
            // Send message on Enter key press, unless Shift key is also held
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); // Prevent adding a newline
                sendMessage();
            }
        });

        chatInput.addEventListener('input', autoResizeTextarea);

        autoResizeTextarea();

         console.log("AI Chat initialized successfully.");
    }

    initializeChat();
}); // End DOMContentLoaded listener