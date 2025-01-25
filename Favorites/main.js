document.addEventListener('DOMContentLoaded', () => {
    const favoriteButtons = document.querySelectorAll('.favorite-button');

    // Restore favorite button states on load
    chrome.storage.local.get({ buttonStates: {} }, (data) => {
        const buttonStates = data.buttonStates || {};

        favoriteButtons.forEach((button) => {
            const icon = button.querySelector('.favorite-icon');
            const anchor = button.previousElementSibling; // Assuming <a> is directly before <button>

            if (!anchor || !anchor.id) {
                console.error('Anchor element with ID not found for button:', button);
                return;
            }

            const buttonId = anchor.id;

            // Set icon state
            if (buttonStates[buttonId] === 'favorited') {
                icon.src = './images/unFavorite.png';
            } else {
                icon.src = './images/favorite.png';
            }
        });
    });

    // Add event listeners to favorite buttons
    favoriteButtons.forEach((button) => {
        const icon = button.querySelector('.favorite-icon');
        const anchor = button.previousElementSibling; // Assuming <a> is directly before <button>

        if (!anchor || !anchor.id) {
            console.error('Anchor element with ID not found for button:', button);
            return;
        }

        const buttonId = anchor.id;

        button.addEventListener('click', () => {
            chrome.storage.local.get({ buttonStates: {}, favorites: [] }, (data) => {
                const buttonStates = data.buttonStates || {};
                const favorites = data.favorites || [];

                if (buttonStates[buttonId] === 'favorited') {
                    // Unfavorite
                    icon.src = './images/favorite.png';
                    delete buttonStates[buttonId];
                    const updatedFavorites = favorites.filter(fav => fav.id !== buttonId);
                    chrome.storage.local.set({ buttonStates, favorites: updatedFavorites }, () => {
                        console.log(`Button unfavorited: ${buttonId}`);
                    });
                } else {
                    // Favorite
                    icon.src = './images/unFavorite.png';
                    buttonStates[buttonId] = 'favorited';

                    const cloneHTML = anchor.closest('div').outerHTML; // Clone the entire div
                    favorites.push({ id: buttonId, html: cloneHTML });

                    chrome.storage.local.set({ buttonStates, favorites }, () => {
                        console.log(`Button favorited: ${buttonId}`);
                    });
                }
            });
        });
    });
});
