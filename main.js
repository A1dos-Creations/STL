/* document.addEventListener('DOMContentLoaded', () => {
    const favoriteButtons = document.querySelectorAll('.favorite-button');
    const favoritesDesc = document.getElementById("favoritesDesc");
    const favoritesButton = document.getElementById("favoritesButton");

    // Function to update visibility of elements and show only up to 3 buttons on main page
    function updateFavoritesVisibility(favorites) {
        const hasFavorites = favorites.length > 0;
        const favoritesContainer = document.querySelector('#wrapper');

        // Show or hide the elements based on whether favorites exist
        if (favoritesDesc) favoritesDesc.style.display = hasFavorites ? "block" : "none";
        if (favoritesButton) favoritesButton.style.display = hasFavorites ? "block" : "none";

        // If on the main page, limit to showing only 3 favorites
        if (document.body.id === "mainBody" && favoritesContainer) {
            favoritesContainer.innerHTML = ""; // Clear existing buttons
            const favoritesToShow = favorites.slice(0, 3); // Show only the first 3

            // Create and display the favorite buttons
            favoritesToShow.forEach(fav => {
                const template = document.createElement('div');
                template.innerHTML = fav.html;  // Insert the saved HTML
                const clonedDiv = template.firstElementChild;

                if (clonedDiv) {
                    favoritesContainer.appendChild(clonedDiv);  // Add cloned button
                }
            });
        }
    }

    // Retrieve favorite button states and stored favorites
    chrome.storage.local.get({ buttonStates: {}, favorites: [] }, (data) => {
        const buttonStates = data.buttonStates || {};
        let favorites = data.favorites || [];

        // Update the visibility of elements and limit the number of buttons shown
        updateFavoritesVisibility(favorites);

        favoriteButtons.forEach((button) => {
            const icon = button.querySelector('.favorite-icon');
            const anchor = button.previousElementSibling;

            if (!anchor || !anchor.id) {
                console.error('Anchor element with ID not found for button:', button);
                return;
            }

            const buttonId = anchor.id;

            // Set the correct icon based on the favorite status
            if (buttonStates[buttonId] === 'favorited') {
                icon.src = './images/unFavorite.png';
            } else {
                icon.src = './images/favorite.png';
            }
        });
    });

    // Add event listeners to the favorite buttons
    favoriteButtons.forEach((button) => {
        const icon = button.querySelector('.favorite-icon');
        const anchor = button.previousElementSibling;

        if (!anchor || !anchor.id) {
            console.error('Anchor element with ID not found for button:', button);
            return;
        }

        const buttonId = anchor.id;

        button.addEventListener('click', () => {
            chrome.storage.local.get({ buttonStates: {}, favorites: [] }, (data) => {
                const buttonStates = data.buttonStates || {};
                let favorites = data.favorites || [];

                if (buttonStates[buttonId] === 'favorited') {
                    // Unfavorite logic
                    icon.src = './images/favorite.png';
                    delete buttonStates[buttonId];
                    favorites = favorites.filter(fav => fav.id !== buttonId);
                } else {
                    // Favorite logic
                    icon.src = './images/unFavorite.png';
                    buttonStates[buttonId] = 'favorited';

                    const cloneHTML = anchor.closest('div').outerHTML; // Clone the entire div
                    favorites.push({ id: buttonId, html: cloneHTML });
                }

                // Save updated favorites and button states
                chrome.storage.local.set({ buttonStates, favorites }, () => {
                    console.log(`Favorites updated:`, favorites);

                    // Update visibility and enforce button limit
                    updateFavoritesVisibility(favorites);
                });
            });
        });
    });
});
*/