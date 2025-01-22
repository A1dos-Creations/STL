document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('favorites-container');

    chrome.storage.local.get({ favorites: [] }, (data) => {
        console.log('Retrieved favorites:', data.favorites); // Debugging line

        if (data.favorites.length === 0) {
            container.textContent = 'No favorites added yet!';
        } else {
            data.favorites.forEach((favoriteHTML, index) => {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = favoriteHTML;
                container.appendChild(wrapper.firstChild);
                console.log(`Favorite ${index + 1} loaded successfully!`);
            });
        }
    });
});
