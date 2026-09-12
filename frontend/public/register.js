
/* File created date: July 2, 2025
Created by: Saanvi Doppalapudi
Function of file: JavaScript for registration page of AI Tour Planner 
*/

// Finds the form element on register.html
const registerForm = document.querySelector("form");

// When the form is submitted, this function is called.
registerForm.addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevents the page from refreshing when the form is submitted

    // Get the values from the form inputs
    const firstName = document.getElementById("first-name").value;
    const lastName = document.getElementById("last-name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    // Validates that all fields are filled in

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        alert("Please fill in all fields.");
        return;
    }

    // Validates that the password and confirm password fields match
    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    // Ensures that the password is at least 7 characters long
    if (password.length < 7) {
        alert("Password must be at least 7 characters long.");
        return;
    }
    
    // Stores the user data in an object to be sent to the backend
    const userData = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password
    };
    
    // Sends the user data to FASTAPI backend
    try {
       const response = await fetch("http://127.0.0.1:8000/register", {
           method: "POST", // Tells server that we are sending data to it
           headers: {
               "Content-Type": "application/json" // Tells server that we are sending JSON data
           },
           body: JSON.stringify(userData) // Converts the userData object to a JSON string
       });

       // If the response is successful, the user is alerted and redirected to homepage.html
       if (response.ok) {
           const data = await response.json();
           localStorage.setItem("userType", "registered");
           localStorage.setItem("email", email);
           localStorage.setItem("firstName", firstName);
           localStorage.setItem("lastName", lastName);
           if (data.user && data.user.id) {
               localStorage.setItem("userId", data.user.id);
           }
           alert(data.message);
           // Move user to home page after registration
            window.location.href = "touria-home.html";
       } 
       // If the response is not successful, the user is alerted with the error message
       else {
           const errorData = await response.json();
           console.log(errorData);
           alert(`Registration failed: ${errorData.detail || "Server error"}`);
       }
   }

   // Catches registration errors, preventing a crash, and then alerts the user
   catch (error) {
       console.error("Error:", error);
       alert("An error occurred during registration. Please try again later.");
   }
});
