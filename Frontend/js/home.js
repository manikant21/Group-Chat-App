import { BASE_URL } from "./constant.js";

// axios.defaults.withCredentials = true;
const token = localStorage.getItem("token")

// const messages = JSON.parse(localStorage.getItem("messages") || "[]"); 
const chatArea = document.getElementById("chatArea");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const logout_btn = document.getElementById("logout_btn");
const seeOlderBtn = document.getElementById("seeOlderBtn");

if(!token) {
     window.location.href = "./login.html";
}

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
const addMessage = (message, isSelf = false, index ) => {
  const msgDiv = document.createElement("div");

  // Alternate background color based on index
  const bgColor = index % 2 === 0 ? "bg-white" : "bg-gray-100";

  msgDiv.className = `my-1 px-2 py-1 ${bgColor} text-sm text-black w-fit max-w-2xl`;
  msgDiv.textContent = isSelf ? `${message.User.name}: ${message.content}` : message.content;

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

// setInterval( async () => {
//   try {
//     const response = await axios.get(`${BASE_URL}/message/getmessage`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     // console.log(response);
//     const messages = response.data.data;
//     // console.log(messages);
//     chatArea.innerHTML = "";
//     for(let i=0;i<messages.length;i++) {
//           const isAlternate = i % 2 === 0;
//         addMessage(messages[i], true, isAlternate);
//     }
//   } catch (error) {
//     console.error("Failed to load messages on refresh", error);
//   }
// }, 2000);

function getMaxIdFromLocalStorage() {
  try {
    const raw = localStorage.getItem("messages");

    if (!raw) return undefined;

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed) || parsed.length === 0) return undefined;

    const ids = parsed.map(m => m.id).filter(id => typeof id === 'number' && !isNaN(id));

    return ids.length > 0 ? Math.max(...ids) : undefined;
  } catch (error) {
    console.error("Error reading messages from localStorage:", error);
    return undefined;
  }
}


function getMinIdFromLocalStorage() {
  try {
    const raw = localStorage.getItem("messages");
    if (!raw) return undefined;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return undefined;

    const ids = parsed.map(m => m.id).filter(id => typeof id === 'number' && !isNaN(id));
    return ids.length > 0 ? Math.min(...ids) : undefined;
  } catch (error) {
    console.error("Error reading messages from localStorage:", error);
    return undefined;
  }
}



 async function fetchMessageData () {
    try {
        const maxId = getMaxIdFromLocalStorage();
        // console.log(maxId);
        const response = await axios.get(`${BASE_URL}/message/getmessage?lastMessageId=${maxId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const newMessages = response.data.data;
    console.log(newMessages);

     const existingMessages = JSON.parse(localStorage.getItem("messages") || "[]");
      const allMessages = [...existingMessages, ...newMessages];
      const last10Messages = allMessages.slice(-10);
      localStorage.setItem("messages", JSON.stringify(last10Messages));
      const messages = JSON.parse(localStorage.getItem("messages"));
    //   console.log(messages);
    chatArea.innerHTML = "";
       for(let i=0;i<messages.length;i++) {
          const isAlternate = i % 2 === 0;
        addMessage(messages[i], true, isAlternate);
    }
      

    } catch (error) {
        console.log(error);
    }
}



seeOlderBtn.addEventListener("click", async () => {
  try {
    const minId = getMinIdFromLocalStorage();
    const response = await axios.get(`${BASE_URL}/message/getoldmessages?beforeMessageId=${minId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const olderMessages = response.data.data;
    console.log(olderMessages);

    if (olderMessages.length === 0) {
      alert("No more older messages");
      return;
    }

   
    const existingMessages = JSON.parse(localStorage.getItem("messages") || "[]");
    const updatedMessages = [...olderMessages, ...existingMessages];
    localStorage.setItem("messages", JSON.stringify(updatedMessages));
    const messages = JSON.parse(localStorage.getItem("messages"));    

    chatArea.innerHTML = "";
    for (let i = 0; i < messages.length; i++) {
      const isAlternate = i % 2 === 0;
      addMessage(messages[i], true, isAlternate);
    }
  } catch (error) {
    console.error("Failed to fetch older messages", error);
  }
});





window.addEventListener("DOMContentLoaded", () => fetchMessageData())


