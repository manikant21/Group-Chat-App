import { BASE_URL } from "./constant.js";
import {
    getMaxIdFromLocalStorage,
    getMinIdFromLocalStorage,
    getMyGroups,
    getAvailableUsersForGroup,
    addUsersToGroup,
    getGroupMembers,
    addAdminsToGroup,
    removeUsersFromGroup,
    getNonAdminMembers,
    getGroupAdmins,
    removeAdminsFromGroup
} from "./helper.js";


const token = localStorage.getItem("token");
let socket = null;
let joinedGroups = [];
const currentUser = { name: localStorage.getItem("userName") };

if (!token) {
    window.location.href = "./login.html";
} else {
    socket = io(BASE_URL.replace('/api/v1', ''), {
        auth: { token: token },
        transports: ["websocket"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
    });
    // window.debugSocket = socket;
}



const chatArea = document.getElementById("chatArea");
const chatInput = document.getElementById("chatInput"); 
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
const fileInput_group = document.getElementById("fileInput_group");
const attachBtn_group = document.getElementById("attachBtn_group");

attachBtn_group.addEventListener("click", () => {
    fileInput_group.click();
});

const fileInput = document.getElementById("fileInput");
const attachBtn = document.getElementById("attachBtn");

attachBtn.addEventListener("click", () => {
    fileInput.click();
});

let currentGroupId = null;


// Upload helper
async function uploadFiles(fileInputEl) {
    if (!fileInputEl || fileInputEl.files.length === 0) return [];
    const formData = new FormData();
    for (const file of fileInputEl.files) {
        formData.append("files", file);
    }
    try {
        const res = await axios.post(`${BASE_URL}/upload/multimedia`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
        });
        return res.data.attachments || [];
    } catch (err) {
        console.error("File upload failed:", err);
        return [];
    }
}

// Render attachments helper
function renderAttachments(attachments) {
    const attachContainer = document.createElement("div");
    attachContainer.className = "mt-2 space-y-2";

    attachments.forEach((file) => {
        const { fileUrl, fileName, fileType } = file;

        if (fileType.startsWith("image/")) {
            const img = document.createElement("img");
            img.src = fileUrl;
            img.alt = fileName;
            img.className = "max-w-xs rounded shadow";
            attachContainer.appendChild(img);
        } else if (fileType.startsWith("video/")) {
            const video = document.createElement("video");
            video.src = fileUrl;
            video.controls = true;
            video.className = "max-w-xs rounded shadow";
            attachContainer.appendChild(video);
        } else {
            const fileLabel = document.createElement("span");
            fileLabel.textContent = `📎 ${fileName}`;
            fileLabel.className = "block text-gray-800 text-sm";
            attachContainer.appendChild(fileLabel);
        }

        // Force download button
        const downloadBtn = document.createElement("button");
        downloadBtn.textContent = "⬇ Download";
        downloadBtn.className = "block text-blue-500 text-xs underline";
        downloadBtn.onclick = async () => {
            try {
                const response = await fetch(fileUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = fileName || "download";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                window.URL.revokeObjectURL(url);
            } catch (err) {
                console.error("Download failed:", err);
                alert("Failed to download file");
            }
        };
        attachContainer.appendChild(downloadBtn);
    });

    return attachContainer;
}



if (socket) {

    socket.on("connect", () => {
        socket.emit("join_global");

        joinedGroups.forEach((gid) => {
            // console.log(" Rejoining group:", gid);
            socket.emit("join_group", gid);
        });
    });

    socket.on("disconnect", (reason) => {
    //    console.log(" Socket.IO disconnected:", reason);
        console.log("Disconnect details:", {
            reason,
            connected: socket.connected,
            disconnected: socket.disconnected
        });
    });

    socket.on("connect_error", (err) => {
        console.error("Socket.IO connection error:", err.message);
    });

     // Add error handling for authentication failures
    socket.on("error", (error) => {
        console.error("Socket error received:", error);
    });

    // Monitor connection status changes
    socket.on("reconnect", (attemptNumber) => {
        console.log("Socket reconnected after", attemptNumber, "attempts");
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
        console.log(" Reconnection attempt", attemptNumber);
    });

    socket.on("reconnect_error", (error) => {
        console.error(" Reconnection error:", error);
    });

    socket.on("reconnect_failed", () => {
        console.error(" All reconnection attempts failed");
    });


    // ===== GLOBAL CHAT =====
    socket.on("new_global_message", (msg) => {
        console.log(" Received new global message:", msg);
        // Check if message already exists in UI by ID (if available)
        if (msg.id && document.querySelector(`[data-message-id="${msg.id}"]`)) {
            console.log("Message already exists in UI, skipping...");
            return;
        }
        let messages = JSON.parse(localStorage.getItem("messages") || "[]");
        // Prevent duplicate messages in localStorage
        if (msg.id && messages.some((m) => m.id === msg.id)) {
            console.log("Message already exists in localStorage, skipping...");
            return;
        }

        messages.push(msg);
        if (messages.length > 10) messages = messages.slice(-10);
        localStorage.setItem("messages", JSON.stringify(messages));

        appendGlobalMessage(msg);
    });

    socket.on("joined_global_chat", (data) => {
        console.log(" Successfully joined global chat:", data);
    });

    // ===== GROUP CHAT =====
    socket.on("new_group_message", (message) => {
        // console.log("Received new group message:", message);
        // console.log("Current group ID:", currentGroupId);
        // console.log("Message group ID:", message.groupId);
        // console.log("Message sender ID:", message.userId);
        // console.log("Current user from token:", currentUser);
        
        // Check if this is your own message vs others
        if (message.User?.name === currentUser.name || message.userId ===  Number(localStorage.getItem("userId"))) {
            console.log(" This is MY message");
        } else {
            console.log(" This is SOMEONE ELSE'S message");
        }
        

        if (message.groupId == currentGroupId) {
           

            // Check if the message is already on the UI by its ID or data attribute
            if (message.id && (document.getElementById(message.id) || document.querySelector(`[data-message-id="${message.id}"]`))) {
                console.log("Message already exists on UI, skipping append.");
                return;
            }
            console.log("Appending group message to UI...");

            appendGroupMessage(message);
        }
        else {
            console.log("Message not for current group, ignoring.");
        }
    });

    socket.on("joined_group", (data) => {
        console.log(" Successfully joined group:", data);
    });
}



// ---------------------- Toggle Groups ----------------------
let groupsVisible = false;

async function toggleGroups() {
    const groupsListDiv = document.getElementById("groupsList");

    if (groupsVisible) {
        groupsListDiv.innerHTML = "";
        groupsVisible = false;
    } else {
        await fetchGroup();
        groupsVisible = true;
    }
}

// ---------------------- Group Chat Submit ----------------------
chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = chatInput_group.value.trim();
    if (!message && fileInput_group.files.length === 0) return;

    const attachments = await uploadFiles(fileInput_group);

    if (socket && socket.connected) {
        console.log("Sending group message to group:", currentGroupId);
        
        // REMOVED optimistic UI update - let server handle it
        socket.emit("new_group_message", { groupId: currentGroupId, message, attachments });

        chatInput_group.value = "";
        fileInput_group.value = "";
    } else {
        console.error("Socket not connected, cannot send group message");
        alert("Connection lost. Please refresh the page.");
    }
});

// ===== GROUP CHAT: openChat =====
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
    msgs.forEach((msg) => appendGroupMessage(msg));
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (socket && socket.connected) {
      console.log("🔗 Joining group room:", groupId);
      socket.emit("join_group", groupId);

      if (!joinedGroups.includes(groupId)) {
        joinedGroups.push(groupId);
      }
      console.log(joinedGroups);
    } else {
      console.error(" Socket not connected, cannot join group");

    }

    chatModal.classList.remove("hidden");
  } catch (err) {
    console.error("Failed to open chat:", err);
    alert("Unable to load group messages");
  }
}

// close chat modal
const closeChatBtn = document.getElementById("closeChatBtn");
if (closeChatBtn) {
    closeChatBtn.addEventListener("click", () => {
        chatModal.classList.add("hidden");
        // We don't need to explicitly leave the room here. The backend can handle cleanup on disconnect.
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
            await fetchGroup();
            groupsVisible = true;
        } catch (err) {
            console.error(err.response?.data || err.message);
            alert("Failed to create group");
        }
    });
}

// ---------------------- Fetch Groups & render ----------------------
document.getElementById("fetchGroupsBtn").addEventListener("click", toggleGroups);


async function fetchGroup() {
    const groupsListDiv = document.getElementById("groupsList");

    if (groupsVisible) {
        // Hide groups
        groupsListDiv.innerHTML = "";
        groupsVisible = false;
        return;
    }
    // Otherwise fetch and show groups
    try {
        const groups = await getMyGroups();
        const groupsListDiv = document.getElementById("groupsList");
        const currentUserId = Number(localStorage.getItem("userId"));

        if (!groups || groups.length === 0) {
            groupsListDiv.innerHTML = `<p class="text-gray-500">You are not part of any groups yet.</p>`;
            return;
        }

        groupsListDiv.innerHTML = groups
            .map(
                (g) => `
          <div class="p-3 border rounded mb-2 bg-white shadow max-w-2xl w-full">
            <h3 class="font-bold">${g.name}</h3>
            <p class="text-sm text-gray-500">${g.description || "No description"}</p>
            <div class="mt-2 flex flex-wrap gap-2 ">
              <button class="chatBtn bg-blue-500 text-white px-3 py-1 rounded" data-group-id="${g.id}" data-group-name="${escapeHtml(
                    g.name
                )}">
                Chat
              </button>
              <button 
            class="showMemberBtn bg-yellow-500 text-white px-3 py-1 rounded" 
            data-group-id="${g.id}">
            Show Members
          </button>
              <button 
            class="addMemberBtn bg-green-500 text-white px-3 py-1 rounded" 
            data-group-id="${g.id}">
            Add Member
          </button>
          <button 
            class="removeMemberBtn bg-red-500 text-white px-3 py-1 rounded" 
            data-group-id="${g.id}">
            Remove Member
          </button>
          <button 
            class="addAdminBtn bg-pink-500 text-white px-3 py-1 rounded" 
            data-group-id="${g.id}">
            Add Admin
          </button>
           <button 
            class="removeAdminBtn bg-orange-500 text-white px-3 py-1 rounded" 
            data-group-id="${g.id}">
            Remove Admin
          </button>
          ${g.ownerId === currentUserId
                        ? `<button class="deleteGroupBtn bg-black text-white px-3 py-1 rounded" data-group-id="${g.id}">
                      Delete Group
                    </button>`
                        : ""
                    }
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

        //Add admin click handler
        document.querySelectorAll(".addAdminBtn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const groupId = btn.getAttribute("data-group-id");


                try {

                    const members = await getNonAdminMembers(groupId);
                    console.log(members);
                    if (!members || members.length === 0) {
                        alert("No members in this group.");
                        return;
                    }
                    const modal = document.getElementById("addAdminModal");
                    modal.classList.remove("hidden"); // show modal first

                    const modalAdminList = document.getElementById("modalAdminList");
                    modalAdminList.innerHTML = members
                        .map(
                            (m) => `
                        <label class="block">
                          <input type="checkbox" value="${m.id}" /> ${m.name} (${m.email})
                        </label>
                    `
                        )
                        .join("");

                    document
                        .getElementById("modalAddAdminBtn")
                        .setAttribute("data-group-id", groupId);

                    document
                        .getElementById("addAdminModal")
                        .classList.remove("hidden");
                } catch (err) {
                    console.error(err);
                    alert("Failed to fetch group members");
                }
            });
        });


        // Close Add Admin modal function
        function closeAddAdminModal() {
            document.getElementById("addAdminModal").classList.add("hidden");
        }

        document.getElementById("closeAddAdminModal").addEventListener("click", closeAddAdminModal);
        document.getElementById("modalAddAdminCloseBtn").addEventListener("click", closeAddAdminModal);

        document.getElementById("addAdminModal").addEventListener("click", (e) => {
            if (e.target.id === "addAdminModal") closeAddAdminModal();
        });

        // Add admin button click handeler
        document.getElementById("modalAddAdminBtn").addEventListener("click", async (e) => {
            const groupId = e.currentTarget.getAttribute("data-group-id");
            const selected = Array.from(document.querySelectorAll("#modalAdminList input[type='checkbox']:checked"))
                .map(cb => cb.value);

            if (selected.length === 0) {
                alert("Select at least one member.");
                return;
            }

            try {
                const res = await addAdminsToGroup(groupId, selected); // implement this API call
                console.log("Add admins payload:", { groupId, selected });
                if (res) {
                    alert("Admins added!");
                    closeAddAdminModal();
                }
                else {
                    alert("Failed to add admins.");
                }


            } catch (err) {
                console.error(err);
                alert("Failed to add admins.");
            }
        });




        //Remove admin click handler
        document.querySelectorAll(".removeAdminBtn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const groupId = btn.getAttribute("data-group-id");


                try {

                    const members = await getGroupAdmins(groupId);
                    console.log(members);
                    if (!members || members.length === 0) {
                        alert("No members in this group.");
                        return;
                    }
                    const modal = document.getElementById("removeAdminModal");
                    modal.classList.remove("hidden"); // show modal first

                    const modalRemoveAdminList = document.getElementById("modalRemoveAdminList");
                    modalRemoveAdminList.innerHTML = members
                        .map(
                            (m) => `
                        <label class="block">
                          <input type="checkbox" value="${m.userId}" /> ${m.name} (${m.email})
                        </label>
                    `
                        )
                        .join("");

                    document
                        .getElementById("modalRemoveAdminBtn")
                        .setAttribute("data-group-id", groupId);

                    document
                        .getElementById("removeAdminModal")
                        .classList.remove("hidden");
                } catch (err) {
                    console.error(err);
                    alert("Failed to fetch group admin's list");
                }
            });
        });


        // Close Remove Admin modal function
        function closeRemoveAdminModal() {
            document.getElementById("removeAdminModal").classList.add("hidden");
        }

        document.getElementById("closeRemoveAdminModal").addEventListener("click", closeRemoveAdminModal);
        document.getElementById("modalRemoveAdminCloseBtn").addEventListener("click", closeRemoveAdminModal);

        document.getElementById("removeAdminModal").addEventListener("click", (e) => {
            if (e.target.id === "removeAdminModal") closeRemoveAdminModal();
        });

        // attach delete group handlers
        document.querySelectorAll(".deleteGroupBtn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const groupId = btn.getAttribute("data-group-id");
                if (confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
                    try {
                        await axios.delete(`${BASE_URL}/group/${groupId}/deletegroup`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        alert("Group deleted successfully");
                        fetchGroup(); // refresh list
                        groupsVisible = true;
                    } catch (err) {
                        console.error(err);
                        alert("Failed to delete group");
                    }
                }
            });
        });


        // Remove admin button click handeler
        document.getElementById("modalRemoveAdminBtn").addEventListener("click", async (e) => {
            const groupId = e.currentTarget.getAttribute("data-group-id");
            const selected = Array.from(document.querySelectorAll("#modalRemoveAdminList input[type='checkbox']:checked"))
                .map(cb => cb.value);

            if (selected.length === 0) {
                alert("Select at least one member.");
                return;
            }
            console.log(selected);

            try {
                const res = await removeAdminsFromGroup(groupId, selected);
                console.log("Remove admins payload:", { groupId, selected });
                if (res) {
                    alert("Admins remove!");
                    closeRemoveAdminModal();
                }
                else {
                    alert("Failed to remove admins.");
                }


            } catch (err) {
                console.error(err);
                alert("Failed to remove admins.");
            }
        });


        // Attach click event for "Show Members" buttons
        document.addEventListener("click", async function (e) {
            if (e.target.classList.contains("showMemberBtn")) {
                const groupId = e.target.getAttribute("data-group-id");
                await fetchAndShowMembers(groupId);
            }
        });

        // Fetch show members from backend and open modal
        async function fetchAndShowMembers(groupId) {
            try {
                const res = await axios.get(`${BASE_URL}/group/${groupId}/allmembers`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                console.log(res);
                const members = res.data; // Expected: [{ id, name, email, isAdmin }, ...]

                const membersList = document.getElementById("membersList");
                membersList.innerHTML = "";

                if (!members || members.length === 0) {
                    membersList.innerHTML = `<li class="text-gray-500">No members found</li>`;
                } else {
                    members.forEach(member => {
                        const li = document.createElement("li");
                        li.className = "p-2 border rounded flex justify-between items-center";

                        li.innerHTML = `
                        <span>${member.name} <small class="text-gray-500">${member.email}</small></span>
                        ${member.isAdmin ? `<span class="text-xs bg-yellow-300 px-2 py-1 rounded">Admin</span>` : ""}
                    `;

                        membersList.appendChild(li);
                    });
                }

                // Show modal
                document.getElementById("showMembersModal").classList.remove("hidden");

            } catch (err) {
                console.error("Error fetching members:", err);
                alert("Failed to load members.");
            }
        }

        // Close show modal
        document.getElementById("closeShowMembersModal").addEventListener("click", function () {
            document.getElementById("showMembersModal").classList.add("hidden");
        });

        // Close show modal when clicking outside content
        document.getElementById("showMembersModal").addEventListener("click", function (e) {
            if (e.target === this) {
                this.classList.add("hidden");
            }
        });






        // ------------ Remove Member button click handler ------------
        document.querySelectorAll(".removeMemberBtn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const groupId = btn.getAttribute("data-group-id");

                try {
                    const members = await getGroupMembers(groupId); // <-- You must implement API call
                    if (!members || members.length === 0) {
                        alert("No members in this group.");
                        return;
                    }

                    const modalRemoveUserList = document.getElementById("modalRemoveUserList");
                    modalRemoveUserList.innerHTML = members
                        .map(
                            (m) => `
              <label class="block">
                <input type="checkbox" value="${m.id}" /> ${m.name} (${m.email})
              </label>
            `
                        )
                        .join("");

                    document
                        .getElementById("modalRemoveBtn")
                        .setAttribute("data-group-id", groupId);

                    document
                        .getElementById("removeMemberModal")
                        .classList.remove("hidden");
                } catch (err) {
                    console.error(err);
                    alert("Failed to fetch group members");
                }
            });
        });

        // ------------ Remove Members modal close handlers ------------
        document.getElementById("closeRemoveMemberModal").addEventListener("click", () => {
            document.getElementById("removeMemberModal").classList.add("hidden");
        });
        document.getElementById("modalRemoveCloseBtn").addEventListener("click", () => {
            document.getElementById("removeMemberModal").classList.add("hidden");
        });

        // ------------ Remove Members submit handler ------------
        document.getElementById("modalRemoveBtn").addEventListener("click", async () => {
            const groupId = document
                .getElementById("modalRemoveBtn")
                .getAttribute("data-group-id");

            const selectedIds = Array.from(
                document.querySelectorAll("#modalRemoveUserList input:checked")
            ).map((cb) => Number(cb.value));

            if (selectedIds.length === 0) {
                alert("Select at least one member to remove.");
                return;
            }

            try {
                const success = await removeUsersFromGroup(groupId, selectedIds); // <-- You must implement API
                if (success) {
                    alert("Members removed successfully!");
                    document.getElementById("removeMemberModal").classList.add("hidden");
                    fetchGroup(); // refresh list
                    groupsVisible = true;
                }
            } catch (err) {
                console.error(err);
                alert("Failed to remove members");
            }
        });
        groupsVisible = true;
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
        groupsVisible = true;
    }
});






// ---------------------- Auth & Logout ----------------------
// The token check is moved to the top of the file

logout_btn.addEventListener("click", () => {
     // Close socket connection
    if (socket && socket.connected) {
        socket.disconnect();
    }

    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    window.location.href = "./login.html";
});


// ---------------------- Message Append ----------------------
function appendGlobalMessage(message) {
    const { User, content, attachments = [] } = message;
    const msgDiv = document.createElement("div");
    msgDiv.className = "my-1 px-2 py-1 bg-gray-100 text-sm text-black w-fit max-w-2xl";

    // Add unique identifier for duplicate prevention
    if (message.id) {
        msgDiv.setAttribute("data-message-id", message.id);
    }

    const sender = document.createElement("strong");
    sender.textContent = User?.name ? `${User.name}: ` : "Unknown: ";
    msgDiv.appendChild(sender);

    if (content) {
        const textSpan = document.createElement("span");
        textSpan.textContent = content;
        msgDiv.appendChild(textSpan);
    }

    if (attachments.length > 0) msgDiv.appendChild(renderAttachments(attachments));

    chatArea.appendChild(msgDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function appendGroupMessage(message) {
    const { User, content, attachments = [] } = message;
    const msgDiv_group = document.createElement("div");
    // Assign a unique ID if it exists
    if (message.id) {
        msgDiv_group.id = message.id;
    }
    msgDiv_group.className = "p-2 rounded bg-gray-200 text-black";
      // Always assign a unique identifier for duplicate prevention
    if (message.id) {
        msgDiv_group.id = message.id;
        msgDiv_group.setAttribute("data-message-id", message.id);
    } else {
        // Fallback for messages without ID (like optimistic updates)
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        msgDiv_group.setAttribute("data-message-id", tempId);
    }

    const sender = document.createElement("strong");
    sender.textContent = User?.name ? `${User.name}: ` : "Unknown: ";
    msgDiv_group.appendChild(sender);

    if (content) {
        const textSpan = document.createElement("span");
        textSpan.textContent = content;
        msgDiv_group.appendChild(textSpan);
    }

    if (attachments.length > 0) msgDiv_group.appendChild(renderAttachments(attachments));

    chatMessages.appendChild(msgDiv_group);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


// ---------------------- Global Chat Submit ----------------------
sendBtn.addEventListener("click", async () => {
    const message = chatInput.value.trim();
    if (!message && fileInput.files.length === 0) return;

    const attachments = await uploadFiles(fileInput);

    if (socket && socket.connected) {
        // REMOVED optimistic UI update - let server handle it
        socket.emit("new_global_message", { message, attachments });

        chatInput.value = "";
        fileInput.value = "";
    } else {
        console.error(" Socket not connected, cannot send global message");
        alert("Connection lost. Please refresh the page.");
    }
});


// Fetch initial 10 messages (on page load or refresh)
async function fetchMessageData() {
    try {
        const maxId = getMaxIdFromLocalStorage();
        const response = await axios.get(`${BASE_URL}/message/getmessage?lastMessageId=${maxId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const newMessages = response.data.data || [];

        // Get existing messages from localStorage
        const existingMessages = JSON.parse(localStorage.getItem("messages") || "[]");

        // Merge existing + new, then keep last 10
        const allMessages = [...existingMessages, ...newMessages];
        const last10Messages = allMessages.slice(-10);

        // Save back to localStorage
        localStorage.setItem("messages", JSON.stringify(last10Messages));

        // Render UI
        chatArea.innerHTML = "";
        last10Messages.slice(-10).forEach(msg => appendGlobalMessage(msg));
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
            appendGlobalMessage(messages[i]);
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

// ---------------------- Handle page visibility ----------------------
// document.addEventListener("visibilitychange", () => {
//     if (!socket) return;
//     if (document.hidden) {
//         socket.disconnect();
//     } else {
//         socket.connect();
//     }
// });

// ---------------------- Cleanup on page unload ----------------------
window.addEventListener("beforeunload", () => {
    if (socket) {
        socket.disconnect();
    }
});

// ---------------------- Initial load ----------------------
window.addEventListener("DOMContentLoaded", () => {
    fetchMessageData();
});

// ---------------------- small util ----------------------
function escapeHtml(str = "") {
    return String(str).replace(/[&<>"'`=\/]/g, function (s) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;",
            "/": "&#x2F;",
            "`": "&#x60;",
            "=": "&#x3D;",
        }[s];
    });
}
