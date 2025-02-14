/*document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("buttons");

  try {
      // Fetch the HTML snippet from your website
      const response = await fetch("https://a1dos-creations.com/stl-external-attachments/buttons.html");

      if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      // Get the text (HTML) from the response
      const htmlSnippet = await response.text();

      // Insert the HTML snippet into the container
      container.innerHTML = htmlSnippet;

      // Optionally, if you need to attach any event listeners to the new elements,
      // do it here after insertion.
  } catch (error) {
      console.error("Error fetching or inserting the HTML snippet:", error);
      // Optionally, display an error message or fallback content
      container.innerHTML = `<p style="color:white;font-family:Lexend Deca;opacity:0.4;"><i>! Failed to load external buttons. Please check your connection.</i></p>` + container.innerHTML;
  }
});*/
