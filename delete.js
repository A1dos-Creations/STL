document.addEventListener('DOMContentLoaded', () => {
    // Select all delete buttons
    const deleteButtons = document.querySelectorAll('.delete-button');
    
    // Add event listener to each delete button
    deleteButtons.forEach((deleteButton, index) => {
        deleteButton.addEventListener('click', () => {
            const buttonDiv = deleteButton.closest('div'); // Get the closest div (parent of delete button)
            
            if (buttonDiv) {
                // Get the ID of the button div, or use another unique identifier
                const buttonId = buttonDiv.querySelector('button')?.id;
                
                // Hide the button div
                buttonDiv.style.display = 'none';

                // Store the deleted button's ID in localStorage
                let deletedButtons = JSON.parse(localStorage.getItem('deletedButtons')) || [];
                if (buttonId && !deletedButtons.includes(buttonId)) {
                    deletedButtons.push(buttonId); // Add button ID to the array
                    localStorage.setItem('deletedButtons', JSON.stringify(deletedButtons)); // Save back to localStorage
                }

                // Check if all buttons have been deleted
                checkAllDeleted();
            }
        });
    });

    // On page reload, check for deleted buttons and hide them
    let deletedButtons = JSON.parse(localStorage.getItem('deletedButtons')) || [];
    const allDivs = document.querySelectorAll('#wrapper > div');  // Get all divs inside wrapper
    allDivs.forEach((div) => {
        const buttonId = div.querySelector('button')?.id;
        if (deletedButtons.includes(buttonId)) {
            div.style.display = 'none';  // Hide the div if its ID is in the deleted list
        }
    });

    // Check if all buttons have been deleted
    checkAllDeleted();
});

// Function to check if all buttons have been deleted
function checkAllDeleted() {
    // Get all the button IDs that should be deleted
    const allButtonIds = ['button1', 'button2', 'button3'];
    
    // Retrieve the list of deleted button IDs from localStorage
    const deletedButtons = JSON.parse(localStorage.getItem('deletedButtons')) || [];

    // If all button IDs are in the deletedButtons list, then all buttons are deleted
    const allDeleted = allButtonIds.every(buttonId => deletedButtons.includes(buttonId));

    // You can perform an action if all buttons are deleted
    if (allDeleted) {
        const message = document.getElementById("empty");
        message.textContent = "You have no quick access buttons. Find some in the discover page!";
        message.style.textWrapStyle = "Pretty";
        message.style.fontFamily = "Lexend Deca";
        message.style.color = "white";
        message.style.display = "none";
    }
}
