document.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.getElementById("menuButton");
    const sidePanel = document.getElementById("sidePanel");
    const overlay = document.getElementById("overlay");

    menuButton.addEventListener("click", () => {
      const isOpen = sidePanel.classList.toggle("show");
      menuButton.classList.toggle("rotate");
      overlay.classList.toggle("show", isOpen);
    });

    overlay.addEventListener("click", () => {
      sidePanel.classList.remove("show");
      menuButton.classList.remove("rotate");
      overlay.classList.remove("show");
    });
  });