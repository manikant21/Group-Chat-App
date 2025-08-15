import { BASE_URL } from "./constant.js";
// axios.defaults.withCredentials = true;
// const BASE_URL = "http://localhost:3000/api/v1";
let form = document.getElementById("form_register");
let name = document.getElementById("name");
let email = document.getElementById("email_register");
let phone = document.getElementById("no_register");
let password = document.getElementById("password_register");
let login_btn = document.getElementById("login_btn");


// console.log(BASE_URL);

login_btn.addEventListener('click', () => {
    window.location.href = "login.html"
})


form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (name.value === "" || email.value === "" || phone.value === "" || password.value === "") {
        alert("Please fill requred fields!!");
        return;
    }
    //     let phoneNum = Number(phone.value);
    //     if (isNaN(phoneNum)) {
    //   alert("Phone must be a number");
    //   return;
    // }
    let signupData = {
        name: name.value,
        email: email.value,
        phone: phone.value,
        password: password.value,
    }
    console.log(signupData);
    try {
        const response = await axios.post(`${BASE_URL}/user/register`, signupData);
        console.log(response);
        if (response.status == 201) {
            alert("Successfuly signed up")
            localStorage.setItem("token", response.data.token);
            form.reset();

            window.location.href = "./home.html"
            // window.open('./home.html', '_self');

            //  setTimeout(() => window.location.href = "./home.html", 1000);
        }

    } catch (error) {
        console.log(error);
        if (error.response.status == 409) {
            alert("User already exists, Please Login");
        }
        else {
            alert("Something went wrong");
            console.log("Internal server error");
        }

    }
   





})