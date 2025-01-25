document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.favorite-button').forEach((favoriteButton) => {
        const favoriteIcon = favoriteButton.querySelector('.favorite-icon'); // Image element inside the button

        favoriteButton.addEventListener('click', () => {
            const parentDiv = favoriteButton.closest('div'); // Get the parent div
            const linkElement = parentDiv.querySelector('a'); // The anchor element
            const buttonHTML = parentDiv.innerHTML; // Save the full structure

            if (linkElement) {
                chrome.storage.local.get({ favorites: [] }, (data) => {
                    const favorites = data.favorites;

                    // Check if this button is already a favorite
                    const alreadyFavorited = favorites.some(fav => fav.html === buttonHTML);

                    if (alreadyFavorited) {
                        // Unfavorite logic
                        const updatedFavorites = favorites.filter(fav => fav.html !== buttonHTML);
                        chrome.storage.local.set({ favorites: updatedFavorites }, () => {
                            console.log('Favorite removed:', buttonHTML);

                            // Update the src to show it's unfavorited
                            if (favoriteIcon) favoriteIcon.src = './images/favorite.png';
                        });
                    } else {
                        // Favorite logic
                        const updatedFavorites = [...favorites, { html: buttonHTML }];
                        chrome.storage.local.set({ favorites: updatedFavorites }, () => {
                            console.log('Favorite added:', buttonHTML);

                            // Update the src to show it's favorited
                            if (favoriteIcon) favoriteIcon.src = './images/unFavorite.png';
                        });
                    }
                });
            }
        });
    });
});
