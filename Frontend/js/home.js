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

// Add message to chat area
const addMessage = (text, isSelf = false) => {
  const msgDiv = document.createElement("div");
  msgDiv.className = `px-4 py-2 rounded max-w-xl w-fit ${
    isSelf ? "bg-gray-300" : "bg-white"
  }`;
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
            alert("Message added successfuly");
            console.log(response.data);
        }
    addMessage(message, true);
    chatInput.value = "";

    // Simulated Vaibhav reply
    setTimeout(() => {
      addMessage("Vaibhav: Got it!");
    }, 1000);
  }

}

  catch (error) {
        
    }
});

// Enter key support
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});
