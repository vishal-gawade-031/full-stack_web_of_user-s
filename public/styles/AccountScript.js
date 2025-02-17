document.querySelectorAll(".popup-btn").forEach(button => {
    button.addEventListener("click", function() {
        let url = this.getAttribute("data-url");

        let screenWidth = window.screen.width;
        let screenHeight = window.screen.height;

        let popupWidth = screenWidth / 2;
        let popupHeight = screenHeight / 2;

        let left = (screenWidth - popupWidth) / 2;
        let top = (screenHeight - popupHeight) / 2;

        window.open(
            url,
            "PopupWindow",
            `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
        );
    });
});
