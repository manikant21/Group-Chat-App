import { BASE_URL } from "./constant.js";

axios.defaults.withCredentials = true;

const chatArea = document.getElementById("chatArea");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const logout_btn = document.getElementById("logout_btn");

// Logout handler
logout_btn.addEventListener("click", async () => {
  try {
    const response = await axios.post(`${BASE_URL}/user/logout`, {});
    console.log(response);
    if (response.status === 201) {
      alert("Successfully logged out!");
      window.location.href = "login.html";
    }
  } catch (error) {
    console.error("Logout failed", error);
  }
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


// Send button click
sendBtn.addEventListener("click", () => {
  const message = chatInput.value.trim();
  if (message) {
    addMessage(message, true);
    chatInput.value = "";

    // Simulated Vaibhav reply
    setTimeout(() => {
      addMessage("Vaibhav: Got it!");
    }, 1000);
  }
});

// Enter key support
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});
