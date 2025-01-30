document.addEventListener('DOMContentLoaded', () => {
    console.log("Main page loaded");

    const favoritesContainer = document.getElementById('wrapper');

    if (!favoritesContainer) {
        console.error("Favorites container not found");
        return;
    }

    // Retrieve favorites from chrome.storage
    chrome.storage.local.get({ favorites: [] }, (data) => {
        const favorites = data.favorites || [];
        console.log('Favorites retrieved from storage:', favorites);

        // Check if there are any favorites saved
        if (favorites.length === 0) {
            return;
        } if (favorites.length >= 4) {
            console.log("More than 2 buttons. Showing delete all.");
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

            // Manually clone the button styling
            const clonedButton = clonedDiv.querySelector('button');
            if (clonedButton) {
                clonedButton.style.backgroundColor = "#ffcc00";  // Example of applying background color
                clonedButton.style.fontSize = "16px";             // Example of setting font size
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
                        });
                    });
                });
            }

            // Append the cloned element to the favorites container
            favoritesContainer.appendChild(clonedDiv);
        });
    });
});
