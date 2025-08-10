import { BASE_URL } from "./constant.js";
import {
  getMaxIdFromLocalStorage,
  getMinIdFromLocalStorage,
  getMyGroups,
  getAvailableUsersForGroup,
  addUsersToGroup,
} from "./helper.js";

// axios.defaults.withCredentials = true;
const token = localStorage.getItem("token");

// Elements
const chatArea = document.getElementById("chatArea");
const chatInput = document.getElementById("chatInput"); // footer input (global)
const sendBtn = document.getElementById("sendBtn");
const logout_btn = document.getElementById("logout_btn");
const seeOlderBtn = document.getElementById("seeOlderBtn");
const seeUsersBtn = document.getElementById("seeUsersBtn");
const userListModal = document.getElementById("userListModal");
const userList = document.getElementById("userList");
const modal = document.getElementById("modalBackdrop");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");
const form = document.getElementById("createGroupForm");
const usersSelect = document.getElementById("groupUsers");

// Chat modal elements (group chat)
const chatModal = document.getElementById("chatModal");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput_group = document.getElementById("chatInput_group"); // NOTE: matches modal input id
const chatGroupName = document.getElementById("chatGroupName");

let currentGroupId = null;
let chatPolling = null;
let globalChatPolling = null;

// ---------------------- Group Chat: openChat ----------------------
async function openChat(groupId, groupName) {
  try {
    currentGroupId = groupId;
    chatGroupName.textContent = groupName;
    chatMessages.innerHTML = "";

    const tokenLocal = localStorage.getItem("token");
    const res = await axios.get(`${BASE_URL}/message/${groupId}/getGroupMessage`, {
      headers: { Authorization: `Bearer ${tokenLocal}` },
    });

    const msgs = res.data?.data || [];
    msgs.forEach((msg) => {
      const div = document.createElement("div");
      div.className = "p-2 rounded";
      div.innerHTML = `<strong>${msg.User?.name ?? "Unknown"}:</strong> ${msg.content}`;
      chatMessages.appendChild(div);
    });

    // scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // show modal
    chatModal.classList.remove("hidden");
    startGroupChatPolling();
  } catch (err) {
    console.error("Failed to open chat:", err);
    alert("Unable to load group messages");
  }
}

// ---------------------- Start Group Chat Polling ----------------------
function startGroupChatPolling() {
  // Clear any existing polling
  if (chatPolling) {
    clearInterval(chatPolling);
  }

  chatPolling = setInterval(async () => {
    if (!currentGroupId || chatModal.classList.contains("hidden")) {
      return;
    }

    try {
      const tokenLocal = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/message/${currentGroupId}/getGroupMessage`, {
        headers: { Authorization: `Bearer ${tokenLocal}` },
      });

      const msgs = res.data?.data || [];
      
      // Only update if message count changed (simple approach)
      if (msgs.length !== chatMessages.childElementCount) {
        chatMessages.innerHTML = "";
        msgs.forEach((msg) => {
          const div = document.createElement("div");
          div.className = "p-2 rounded";
          div.innerHTML = `<strong>${msg.User?.name ?? "Unknown"}:</strong> ${msg.content}`;
          chatMessages.appendChild(div);
        });
        
        // scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    } catch (err) {
      console.error("Failed to fetch group messages:", err);
    }
  }, 1000); // Poll every 1 second
}

// ---------------------- Stop Group Chat Polling ----------------------
function stopGroupChatPolling() {
  if (chatPolling) {
    clearInterval(chatPolling);
    chatPolling = null;
  }
}


// ---------------------- Group Chat: send message handler ----------------------
if (chatForm) {
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = chatInput_group?.value?.trim();
    if (!text) return;

    try {
      const tokenLocal = localStorage.getItem("token");
      await axios.post(
        `${BASE_URL}/message/${currentGroupId}/postGroupMessage`,
        { content: text },
        { headers: { Authorization: `Bearer ${tokenLocal}` } }
      );
      // clear input and refresh messages
      chatInput_group.value = "";
      await openChat(currentGroupId, chatGroupName.textContent);
    } catch (err) {
      console.error("Failed to send group message:", err);
      alert("Failed to send message");
    }
  });
}

// close chat modal
const closeChatBtn = document.getElementById("closeChatBtn");
if (closeChatBtn) {
  closeChatBtn.addEventListener("click", () => {
    chatModal.classList.add("hidden");
    stopGroupChatPolling();
  });
}

// ---------------------- Create Group Modal ----------------------
if (openBtn) {
  openBtn.addEventListener("click", async () => {
    await loadUsers(); // fetch all users before showing modal
    modal.classList.remove("hidden");
  });
}
if (closeBtn) {
  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
}
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });
}

// Fetch users for the create-group multi-select
async function loadUsers() {
  try {
    const tokenLocal = localStorage.getItem("token");
    const res = await axios.get(`${BASE_URL}/user/all`, {
      headers: { Authorization: `Bearer ${tokenLocal}` },
    });

    usersSelect.innerHTML = "";
    (res.data?.data || []).forEach((user) => {
      const opt = document.createElement("option");
      opt.value = user.id;
      opt.textContent = user.name;
      usersSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Failed to load users", err);
  }
}

// ---------------------- Create Group submit ----------------------
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tokenLocal = localStorage.getItem("token");

    const groupName = document.getElementById("groupName").value;
    const description = document.getElementById("groupDescription").value;

    const selectedUsers = Array.from(usersSelect.selectedOptions)
      .map((opt) => Number(opt.value))
      .filter((id) => !isNaN(id));

    if (!groupName) {
      alert("Group name is required");
      return;
    }

    if (selectedUsers.length === 0) {
      alert("Please select at least one member");
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}/group/creategroup`,
        { groupName, description, memberIds: selectedUsers },
        { headers: { Authorization: `Bearer ${tokenLocal}` } }
      );

      alert(" Group created successfully!");
      modal.classList.add("hidden");
      form.reset();
      // refresh groups list
      fetchGroup();
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Failed to create group");
    }
  });
}

// ---------------------- Fetch Groups & render ----------------------
document.getElementById("fetchGroupsBtn").addEventListener("click", fetchGroup);

async function fetchGroup() {
  try {
    const groups = await getMyGroups();
    const groupsListDiv = document.getElementById("groupsList");

    if (!groups || groups.length === 0) {
      groupsListDiv.innerHTML = `<p class="text-gray-500">You are not part of any groups yet.</p>`;
      return;
    }

    groupsListDiv.innerHTML = groups
      .map(
        (g) => `
          <div class="p-3 border rounded mb-2 bg-white shadow">
            <h3 class="font-bold">${g.name}</h3>
            <p class="text-sm text-gray-500">${g.description || "No description"}</p>
            <div class="mt-2 flex gap-2">
              <button class="chatBtn bg-blue-500 text-white px-3 py-1 rounded" data-group-id="${g.id}" data-group-name="${escapeHtml(
          g.name
        )}">
                Chat
              </button>
              <button class="addMemberBtn bg-green-500 text-white px-3 py-1 rounded" data-group-id="${g.id}">
                Add Member
              </button>
            </div>
          </div>
        `
      )
      .join("");

    // attach handlers for Add Member and Chat
    document.querySelectorAll(".addMemberBtn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const groupId = btn.getAttribute("data-group-id");
        const users = await getAvailableUsersForGroup(groupId);

        if (!users || users.length === 0) {
          alert("No available users to add.");
          return;
        }

        const modalUserList = document.getElementById("modalUserList");
        modalUserList.innerHTML = users
          .map(
            (u) => `
              <label class="block">
                <input type="checkbox" value="${u.id}" /> ${u.name} (${u.email})
              </label>
            `
          )
          .join("");

        // Save groupId for submission
        document.getElementById("modalAddBtn").setAttribute("data-group-id", groupId);

        // Show modal
        document.getElementById("addMemberModal").classList.remove("hidden");
      });
    });

    // attach chat handlers
    document.querySelectorAll(".chatBtn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const groupId = btn.getAttribute("data-group-id");
        const groupName = btn.getAttribute("data-group-name") || btn.closest("div").querySelector("h3")?.textContent || "Group";
        await openChat(groupId, groupName);
      });
    });
  } catch (err) {
    console.error(err);
    alert("Failed to fetch groups");
  }
}

// ---------------------- Add Member modal handlers ----------------------
// Close Add Member modal
document.getElementById("modalCloseBtn").addEventListener("click", () => {
  document.getElementById("addMemberModal").classList.add("hidden");
});

// Submit selected members
document.getElementById("modalAddBtn").addEventListener("click", async () => {
  const groupId = document.getElementById("modalAddBtn").getAttribute("data-group-id");
  const selectedIds = Array.from(document.querySelectorAll("#modalUserList input:checked")).map((cb) =>
    Number(cb.value)
  );

  if (selectedIds.length === 0) {
    alert("Select at least one user.");
    return;
  }

  const success = await addUsersToGroup(groupId, selectedIds);
  if (success) {
    alert("Members added successfully!");
    document.getElementById("addMemberModal").classList.add("hidden");
    fetchGroup(); // Refresh group list
  }
});

// ---------------------- Auth & Logout ----------------------
if (!token) {
  window.location.href = "./login.html";
}

logout_btn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "./login.html";
});

// ---------------------- Start Global Chat Polling ----------------------
function startGlobalChatPolling() {
  // Clear any existing global polling
  if (globalChatPolling) {
    clearInterval(globalChatPolling);
  }

  globalChatPolling = setInterval(async () => {
    await fetchMessageData();
  }, 1000); // Poll every 1 second
}

// ---------------------- Stop Global Chat Polling ----------------------
function stopGlobalChatPolling() {
  if (globalChatPolling) {
    clearInterval(globalChatPolling);
    globalChatPolling = null;
  }
}


// ---------------------- message display helper ----------------------
const addMessage = (message, isSelf = false, index) => {
  const msgDiv = document.createElement("div");
  const bgColor = index % 2 === 0 ? "bg-white" : "bg-gray-100";
  msgDiv.className = `my-1 px-2 py-1 ${bgColor} text-sm text-black w-fit max-w-2xl`;
  msgDiv.textContent = isSelf ? `${message.User.name}: ${message.content}` : message.content;
  chatArea.appendChild(msgDiv);
  chatArea.scrollTop = chatArea.scrollHeight;
};

// ---------------------- footer sendBtn (existing) ----------------------
sendBtn.addEventListener("click", async () => {
  const message = chatInput.value.trim();
  try {
    if (message) {
      const response = await axios.post(
        `${BASE_URL}/message/addmessage`,
        { message: message },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status == 201) {
        console.log(response.data);
      }
      chatInput.value = "";
    }
  } catch (error) {
    alert("Something went wrong");
    console.log("Internal server error");
  }
});

chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});

// ---------------------- fetchMessageData (existing localStorage logic) ----------------------
async function fetchMessageData() {
  try {
    const maxId = getMaxIdFromLocalStorage();
    const response = await axios.get(`${BASE_URL}/message/getmessage?lastMessageId=${maxId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const newMessages = response.data.data || [];

    const existingMessages = JSON.parse(localStorage.getItem("messages") || "[]");
    const allMessages = [...existingMessages, ...newMessages];
    const last10Messages = allMessages.slice(-10);
    localStorage.setItem("messages", JSON.stringify(last10Messages));
    const messages = JSON.parse(localStorage.getItem("messages"));

    chatArea.innerHTML = "";
    for (let i = 0; i < messages.length; i++) {
      const isAlternate = i % 2 === 0;
      addMessage(messages[i], true, isAlternate);
    }
  } catch (error) {
    console.log(error);
  }
}

// ---------------------- See older messages ----------------------
seeOlderBtn.addEventListener("click", async () => {
  try {
    const minId = getMinIdFromLocalStorage();
    const response = await axios.get(`${BASE_URL}/message/getoldmessages?beforeMessageId=${minId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const olderMessages = response.data.data || [];
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

// ---------------------- See all users modal ----------------------
seeUsersBtn.addEventListener("click", async () => {
  // defensive checks
  if (!userListModal || !userList) {
    console.error("Missing DOM elements: userListModal or userList");
    return;
  }

  try {
    // Toggle the modal visibility
    userListModal.classList.toggle("hidden");

    // If modal is now visible and empty, fetch users
    if (!userListModal.classList.contains("hidden") && userList.childElementCount === 0) {
      const response = await axios.get(`${BASE_URL}/user/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const users = response.data.data || [];
      users.forEach((user) => {
        const li = document.createElement("li");
        li.textContent = user.name;
        userList.appendChild(li);
      });
    }
  } catch (error) {
    console.error("Failed to fetch users", error);
    alert("Unable to load users");
  }
});

// close userListModal when clicking outside it
document.addEventListener("click", (e) => {
  if (!userListModal) return;
  if (
    !userListModal.classList.contains("hidden") &&
    !userListModal.contains(e.target) &&
    !seeUsersBtn.contains(e.target)
  ) {
    userListModal.classList.add("hidden");
  }
});

// ---------------------- Handle page visibility for polling optimization ----------------------
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Page is hidden, reduce polling frequency or stop
    stopGlobalChatPolling();
    stopGroupChatPolling();
  } else {
    // Page is visible again, resume normal polling
    startGlobalChatPolling();
    if (!chatModal.classList.contains("hidden") && currentGroupId) {
      startGroupChatPolling();
    }
  }
});

// ---------------------- Cleanup on page unload ----------------------
window.addEventListener("beforeunload", () => {
  stopGlobalChatPolling();
  stopGroupChatPolling();
});

// ---------------------- Initial load ----------------------
window.addEventListener("DOMContentLoaded", () => {
    fetchMessageData(),
    startGlobalChatPolling()}
);

// ---------------------- small util ----------------------
function escapeHtml(str = "") {
  return String(str).replace(/[&<>"'`=\/]/g, function (s) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "/": "&#x2F;",
      "`": "&#x60;",
      "=": "&#x3D;",
    }[s];
  });
}
