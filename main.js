// Handle saving favorites
document.querySelectorAll('.favorite-button').forEach((favoriteButton) => {
    favoriteButton.addEventListener('click', (event) => {
        const parentDiv = event.target.closest('div');

        if (parentDiv) {
            const linkElement = parentDiv.querySelector('a');
            if (linkElement) {
                const clonedLink = linkElement.cloneNode(true); // Clone the <a> element

                // Retrieve current favorites from Chrome Storage
                chrome.storage.local.get({ favorites: [] }, (data) => {
                    // Log the current favorites for debugging
                    console.log("Current favorites:", data.favorites);

                    // Add the new favorite (cloned link) to the list
                    const updatedFavorites = [...data.favorites, clonedLink.outerHTML];

                    // Save the updated list to Chrome Storage
                    chrome.storage.local.set({ favorites: updatedFavorites }, () => {
                        console.log('Link added to favorites:', clonedLink.outerHTML);
                        alert(`Link "${linkElement.textContent.trim()}" added to favorites!`);
                    });
                });
            } else {
                console.error('No <a> element found in this div.');
            }
        } else {
            console.error('No parent <div> found for the favorite button.');
        }
    });
});
