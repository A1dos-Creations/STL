const div = document.getElementById("accountDiv");

document.addEventListener('DOMContentLoaded', () => {
    div.addEventListener("mouseenter", () => {
        div.classList.remove("accPopHide");
        div.classList.add("accPopShow");
    });
    div.addEventListener("mouseleave", () => {
        div.classList.remove("accPopShow");
        div.classList.add("accPopHide");
    })
});