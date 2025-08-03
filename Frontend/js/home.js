import { BASE_URL } from "./constant.js";

// axios.defaults.withCredentials = true;
const token = localStorage.getItem("token")

const chatArea = document.getElementById("chatArea");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const logout_btn = document.getElementById("logout_btn");

// Logout handler
logout_btn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "./login.html";
});

// const addMessage = (text, isSelf = false, isAlternate = false) => {
//   const msgDiv = document.createElement("div");
//   msgDiv.className = `px-4 py-2 rounded max-w-xl w-fit mb-2 ${
//     isSelf
//       ? isAlternate
//         ? "bg-gray-300 self-end"
//         : "bg-white self-end"
//       : isAlternate
//       ? "bg-gray-200"
//       : "bg-white"
//   }`;
//   msgDiv.textContent = isSelf ? `You: ${text}` : text;

//   chatArea.appendChild(msgDiv);
//   chatArea.scrollTop = chatArea.scrollHeight;
// };
// const addMessage = (text, isSelf = false) => {
//   const msgDiv = document.createElement("div");

//   msgDiv.className = `my-1 text-base ${
//     isSelf ? "text-right text-blue-600" : "text-left text-black"
//   }`;

//   msgDiv.textContent = isSelf ? `You: ${text}` : text;

//   chatArea.appendChild(msgDiv);
//   chatArea.scrollTop = chatArea.scrollHeight;
// };
const addMessage = (text, isSelf = false, index ) => {
  const msgDiv = document.createElement("div");

  // Alternate background color based on index
  const bgColor = index % 2 === 0 ? "bg-white" : "bg-gray-100";

  msgDiv.className = `my-1 px-2 py-1 ${bgColor} text-sm text-black w-fit max-w-2xl`;
  msgDiv.textContent = isSelf ? `You: ${text}` : text;

  chatArea.appendChild(msgDiv);
  chatArea.scrollTop = chatArea.scrollHeight;
};



sendBtn.addEventListener("click", async() => {
  const message = chatInput.value.trim();
    try {
  if (message) {
    const response = await axios.post(`${BASE_URL}/message/addmessage`, {message: message}, {
          headers: {
                "Authorization": `Bearer ${token}`
            }
    });
     if(response.status==201) {
            // alert("Message added successfuly");
            console.log(response.data);
        }
    
    chatInput.value = "";

    // Simulated Vaibhav reply
    // setTimeout(() => {
    //   addMessage("Vaibhav: Got it!");
    // }, 1000);
  }

}

  catch (error) {
        alert("Something went wrong");
            console.log("Internal server error"); 
    }
});


chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});

setInterval( async () => {
  try {
    const response = await axios.get(`${BASE_URL}/message/getmessage`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log(response);
    const messages = response.data.data;
    // console.log(messages);
    chatArea.innerHTML = "";
    for(let i=0;i<messages.length;i++) {
          const isAlternate = i % 2 === 0;
        addMessage(messages[i].content, true, isAlternate);
    }
  } catch (error) {
    console.error("Failed to load messages on refresh", error);
  }
}, 2000);


