document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('favorites-container'); // Div to hold favorites

    if (!container) {
        console.error('Favorites container not found');
        return;
    }

    chrome.storage.local.get({ favorites: [] }, (data) => {
        const favorites = data.favorites;

        if (favorites.length === 0) {
            container.innerHTML = 'No favorites added yet!';
        } else {
            favorites.forEach((favoriteData) => {
                const wrapper = document.createElement('div'); // Wrapper for each favorite
                wrapper.classList.add('favorite-item');

                // Restore the original button structure
                wrapper.innerHTML = favoriteData.html;

                // Change the favorite button to an unfavorite button
                const favoriteButton = wrapper.querySelector('.favorite-button');
                const favoriteIcon = favoriteButton.querySelector('.favorite-icon');
                if (favoriteIcon) {
                    favoriteIcon.src = './images/broken.png'; // Set to unfavorite image
                }

                // Add unfavorite functionality
                favoriteButton.addEventListener('click', () => {
                    chrome.storage.local.get({ favorites: [] }, (data) => {
                        const updatedFavorites = data.favorites.filter(fav => fav.html !== favoriteData.html);
                        chrome.storage.local.set({ favorites: updatedFavorites }, () => {
                            console.log('Favorite removed from favorites page:', favoriteData.html);
                            wrapper.remove(); // Remove from the DOM

                            // Update the original favorite button on the discover page
                            chrome.storage.local.get({ discoverButtons: [] }, (discoverData) => {
                                const discoverButtons = discoverData.discoverButtons || [];
                                discoverButtons.forEach(discover => {
                                    if (discover.html === favoriteData.html) {
                                        const originalButton = document.querySelector(`#${discover.id}`);
                                        if (originalButton) {
                                            const icon = originalButton.querySelector('.favorite-icon');
                                            if (icon) icon.src = './images/favorite.png';
                                        }
                                    }
                                });
                            });
                        });
                    });
                });

                container.appendChild(wrapper); // Add to the favorites page
            });
        }
    });
});
