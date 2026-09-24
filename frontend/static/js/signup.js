document.getElementById('signupform').addEventListener("submit",async function (e) {
    e.preventDefault();
    const username = document.getElementById('Username').value;
    const email =  document.getElementById('Email').value;
    const password = document.getElementById('Password').value;
    const cpassword = document.getElementById('CPassword').value;

    const response = await fetch('/api/register/',{
        method :"POST",
        headers : {
            "Content-Type":"application/json"
        },
        body : JSON.stringify({
            username : username,
            email : email,
            password : password,
            confirm_password : cpassword
        })
    });
    const data = await response.json();

    if (response.ok) {
    alert("Registration Successful! Please verify your email.");

    window.open("https://mail.google.com/", "_blank");

    setTimeout(() => {
        window.location.href = "/check_email/";
    }, 1000);
} else {

    if (data.username) {
        alert(data.username);
    }
    else if (data.email) {
        alert(data.email);
    }
    else if (data.confirm_password) {
        alert(data.confirm_password);
    }
    else {
        alert("Registration Failed");
    }

    console.log(data);
}
});