/*
File created date: July 20, 2026
Created by: Saanvi Doppalapudi
Function of file: JavaScript for landing page of Touria, handles pictures transitions
*/

const background = document.querySelector(".background-image");

const images = [
    "images/image1.jpg",
    "images/image2.jpg",
    "images/image3.jpg",
    "images/image4.jpg",
    "images/image5.jpg"
];

let current = 0;

if (background) {
    background.style.backgroundImage = `url(${images[current]})`;
    setInterval(() => {
        background.style.opacity = 0;
        setTimeout(() => {
            current = (current + 1) % images.length;
            background.style.backgroundImage = `url(${images[current]})`;
            background.style.opacity = 1;
        }, 1000);
    }, 5000);
}

const guestLink = document.getElementById("guest-link");
if (guestLink) {
    guestLink.addEventListener("click", function (event) {
        event.preventDefault();
        ["userId", "email", "firstName", "lastName", "userCreatedAt", "touriaActiveConversationId", "touriaGuestId"].forEach(
            function (key) {
                localStorage.removeItem(key);
            }
        );
        localStorage.setItem("userType", "guest");
        window.location.href = "touria-home.html";
    });
}
