/*
File created date: July 22, 2026
Created by: Aswitha
Function of file: Handles trip-type card clicks on the plan welcome page.
  Saves the selected category to localStorage, then navigates to touria-chatbot.html
  so chatbot.js can auto-start the conversation with that context.
*/

(function () {
    // Step 1: Find all trip-type option cards on the page
    const cards = document.querySelectorAll(".option-card");

    cards.forEach(function (card) {
        card.addEventListener("click", function () {
            // Step 2: Visually mark only the clicked card as selected
            cards.forEach(function (c) {
                c.classList.remove("is-selected");
            });
            card.classList.add("is-selected");

            // Step 3: Read trip type + human-readable label from data attributes
            const tripType = card.getAttribute("data-trip-type") || "other";
            const label = card.getAttribute("data-label") || "I want to plan a trip";

            // Step 4: Persist choice so the chatbot page can build a starter message
            localStorage.setItem("touriaTripType", tripType);
            localStorage.setItem("touriaTripLabel", label);
            localStorage.setItem("touriaStartChat", "1"); // flag: auto-send on chatbot load

            // Step 5: Go to the chatbot page
            window.location.href = "touria-chatbot.html";
        });
    });
})();
