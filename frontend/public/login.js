/*
File created date: July 6, 2026
Created by: Saanvi Doppalapudi
Function of file: JavaScript for login page of AI Tour Planner
*/

const loginForm = document.querySelector("form");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        if (!email || !password) {
            alert("Please enter both email and password.");
            return;
        }

        const loginData = {
            email: email,
            password: password
        };

        try {
            const response = await fetch("http://127.0.0.1:8000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(loginData)
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("userType", "registered");
                localStorage.setItem("email", email);
                if (data.user) {
                    localStorage.setItem("userId", data.user.id || "");
                    localStorage.setItem("firstName", data.user.firstName || "");
                    localStorage.setItem("lastName", data.user.lastName || "");
                    if (data.user.createdAt) {
                        localStorage.setItem("userCreatedAt", data.user.createdAt);
                    }
                }
                alert(data.message);
                window.location.href = "touria-home.html";
            } else {
                const errorData = await response.json();
                alert(`Login failed: ${errorData.detail || "Invalid credentials"}`);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred while logging in.");
        }
    });
}
