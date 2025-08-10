import { BASE_URL } from "./constant.js";
export function getMaxIdFromLocalStorage() {
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


export function getMinIdFromLocalStorage() {
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


// let selectedGroupId = null;

// export async function openAddMemberModal(groupId) {
//   selectedGroupId = groupId;
//   const token = localStorage.getItem("token");

//   try {
//     const res = await axios.get(`${BASE_URL}/group/${groupId}/availableusers`, {
//       headers: { Authorization: `Bearer ${token}` }
//     });

//     const users = res.data.data;
//     const select = document.getElementById("availableUsersSelect");

//     select.innerHTML = `<option value="">Select a user</option>` +
//       users.map(u => `<option value="${u.id}">${u.name}</option>`).join("");

//     document.getElementById("addMemberModal").classList.remove("hidden");

//   } catch (err) {
//     console.error(err);
//     alert("Failed to fetch available users");
//   }
// }

export async function getMyGroups() {
    try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/group/my`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data.data;
    } catch (err) {
        console.error("Error fetching groups:", err);
        return [];
    }
}

export async function getAvailableUsersForGroup(groupId) {
    try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/group/${groupId}/availableusers`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(res);
        return res.data.availableUsers;
    } catch (err) {
        console.error("Error fetching available users:", err);
        return [];
    }
}

export async function addUsersToGroup(groupId, userIds) {
    try {
        const token = localStorage.getItem("token");
        await axios.post(
            `${BASE_URL}/group/addmember`,
            { groupId, userIds },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return true;
    } catch (err) {
        console.error("Error adding members:", err);
        return false;
    }
}