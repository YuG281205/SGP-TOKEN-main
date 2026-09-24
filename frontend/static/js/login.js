document.getElementById("loginForm").addEventListener("submit", async function (e) {

    e.preventDefault();

    const username = document.getElementById("Username").value;
    const password = document.getElementById("Password").value;

    const response = await fetch("/api/login/", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            username: username,
            password: password
        })

    });

    const data = await response.json();

    if (response.ok) {

        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("username", data.username);
        localStorage.setItem("email", data.email);

        alert(data.message);

        window.location.href = "/dashboard/";

    } else {

        if (data.message) {
            alert(data.message);
        }
        else {
            alert("Login Failed");
        }

        console.log(data);
    }

});