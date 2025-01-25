document.addEventListener('DOMContentLoaded', () => {
    console.log("Favorites page loaded");

    const favoritesContainer = document.querySelector('#favorites-container');
    const clearAllButton = document.getElementById('clear-all-favorites');

    if (!favoritesContainer) {
        console.error("Favorites container not found");
        return;
    }

    // Clear all favorites functionality
    clearAllButton.addEventListener('click', () => {
        chrome.storage.local.set({ favorites: [] }, () => {
            favoritesContainer.innerHTML = '<p>No favorites found.</p>';
            console.log("All favorites have been cleared.");
        });
    });

    // Retrieve favorites from chrome.storage
    chrome.storage.local.get({ favorites: [] }, (data) => {
        const favorites = data.favorites || [];
        console.log('Favorites retrieved from storage:', favorites);

        // Check if there are any favorites saved
        if (favorites.length === 0) {
            favoritesContainer.innerHTML = '<p>No favorites found.</p>';
            clearAllButton.style.display = "none";
            return;
        } if (favorites.length >= 4) {
            console.log("More than 2 buttons. Showing delete all.");
            clearAllButton.style.display = "block";
        }

        // Loop through favorites and display them
        favorites.forEach((favorite) => {
            const template = document.createElement('div');
            template.innerHTML = favorite.html; // Insert the stored HTML
            const clonedDiv = template.firstElementChild;

            if (!clonedDiv) {
                console.error('Cloned div could not be created from:', favorite.html);
                return;
            }

            // Update the unfavorite button functionality
            const unfavoriteButton = clonedDiv.querySelector('#addQABtn'); // Favorite button
            if (unfavoriteButton) {
                const icon = unfavoriteButton.querySelector('#favorite-icon'); // Favorite icon

                // Set the unfavorite image (broken icon)
                if (icon) {
                    icon.src = './images/broken.png';
                }

                // Handle unfavorite logic
                unfavoriteButton.addEventListener('click', () => {
                    chrome.storage.local.get({ favorites: [], buttonStates: {} }, (data) => {
                        const updatedFavorites = data.favorites.filter(fav => fav.id !== favorite.id);
                        const buttonStates = data.buttonStates || {};

                        delete buttonStates[favorite.id];

                        chrome.storage.local.set({ favorites: updatedFavorites, buttonStates }, () => {
                            console.log(`Unfavorited: ${favorite.id}`);
                            clonedDiv.remove();
                            if (updatedFavorites.length === 0) {
                                favoritesContainer.innerHTML = '<p style="font-family: Lexend Deca;">No favorites found.</p>';
                                clearAllButton.style.display = "none";
                            } if (favorites.length >= 4) {
                                console.log("More than 2 buttons. Showing delete all.");
                                clearAllButton.style.display = "block";
                            }
                        });
                    });
                });
            }

            // Append the cloned element to the favorites container
            favoritesContainer.appendChild(clonedDiv);
        });
    });
});
