chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AUTH_SUCCESS') {
      const token = message.token;
      // Save the token securely, e.g., using chrome.storage
      chrome.storage.local.set({ clerkToken: token }, () => {
        console.log('Clerk token saved:', token);
      });
      sendResponse({ received: true });
    }
  });
  