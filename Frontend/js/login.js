import { BASE_URL } from "./constant.js";
let form = document.getElementById("form_login");
let email = document.getElementById("email_login");
let password = document.getElementById("password_login");
let register_btn = document.getElementById("register_btn");


register_btn.addEventListener('click', () => {
    window.location.href = "register.html"
})



form.addEventListener('submit', (e) => {
    e.preventDefault();
    if(email.value =="" || password.value==""){
          alert("Please fill requred fields!!");
        return;
    }
    let loginData = {
        email: email.value,
        password: password.value

    }
    console.log(loginData);
    try {
        
        
    } catch (error) {
        console.log(error);
         if (error.response.status == 404) {
            alert("Please enter valid credentials");
        }
        else {
            alert("Something went wrong");
            console.log("Internal server error");
        }
    }
    form.reset();
})