document.addEventListener('DOMContentLoaded', () => {
    // Reference the search input and buttons
    const searchInput = document.getElementById('searchInput');
    const buttons = document.querySelectorAll('#discoverPage .filterable'); // NodeList of buttons

    // Ensure `buttons` is correctly fetched
    if (!buttons || buttons.length === 0) {
        console.error('No buttons found to filter. Check your HTML structure or selector.');
        return;
    }

    // Add an event listener for the input event
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();

        // Loop through each button to filter
        buttons.forEach(button => {
            const text = button.textContent.toLowerCase();
            if (text.includes(query)) {
                button.style.display = ''; // Show matching buttons
            } else {
                button.style.display = 'none'; // Hide non-matching buttons
            }
        });
    });
});
