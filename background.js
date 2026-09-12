/*
File created date: July 20, 2026
Created by: Saanvi Doppalapudi
Function of file: JavaScript for login/register page of Touria, handles pictures transitions
*/


const background = document.querySelector(".background-image");

if (background) {

    const images = [
        "images/image1.jpg",
        "images/image2.jpg",
        "images/image3.jpg",
        "images/image4.jpg",
        "images/image5.jpg"
    ];

    let current = 0;

    // Initial image
    background.style.backgroundImage = `url(${images[current]})`;
    background.style.opacity = 1;
    background.style.transform = "scale(1.08)";

    setInterval(() => {

        // Fade out and zoom back slightly
        background.style.opacity = 0;
        background.style.transform = "scale(1)";

        setTimeout(() => {

            current = (current + 1) % images.length;

            // Change image
            background.style.backgroundImage = `url(${images[current]})`;

            // Fade in and slowly zoom
            background.style.opacity = 1;
            background.style.transform = "scale(1.08)";

        }, 800);

    }, 5000);

}