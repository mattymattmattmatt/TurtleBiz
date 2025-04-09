// scripts/chat.js

import {
  db,
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from "./firebase.js";  // Adjust the path if needed

const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

// Reference "chats" collection
const chatsRef = collection(db, "chats");

// Example: newest messages at the top
const chatsQuery = query(chatsRef, orderBy("timestamp", "desc"));

// Listen for real-time updates using the query
onSnapshot(chatsQuery, (snapshot) => {
  // Clear existing messages
  chatContainer.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const messageData = docSnap.data();
    const messageId = docSnap.id;
    const messageText = messageData.text;
    const firebaseTimestamp = messageData.timestamp;

    // Convert Firestore timestamp to a JS Date
    // Note: This can be null if old messages don't have 'timestamp'
    let displayTime = "";
    if (firebaseTimestamp) {
      const dateObj = firebaseTimestamp.toDate(); 
      // Format the date/time as you like:
      displayTime = dateObj.toLocaleString(); 
      // e.g. "1/31/2025, 3:45:12 PM"
    }

    // Create bubble div
    const bubble = document.createElement("div");
    bubble.classList.add("chat-bubble");

    // Message text
    const messageSpan = document.createElement("span");
    messageSpan.textContent = messageText;

    // Timestamp span (only if displayTime isn't empty)
    if (displayTime) {
      const timeSpan = document.createElement("span");
      timeSpan.textContent = displayTime;
      timeSpan.classList.add("message-timestamp");
      bubble.appendChild(timeSpan);
    }

    // Delete button ("x")
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", async () => {
      await deleteDoc(doc(db, "chats", messageId));
    });

    // Put it all together
    bubble.appendChild(messageSpan);
    bubble.appendChild(deleteBtn);
    chatContainer.appendChild(bubble);
  });
});

// Handle form submissions
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newMessage = chatInput.value.trim();
  if (!newMessage) return;

  try {
    await addDoc(chatsRef, {
      text: newMessage,
      timestamp: serverTimestamp()  // ensures sorting + displayable time
    });
  } catch (err) {
    console.error("Error adding chat message:", err);
  }

  // Clear the input
  chatInput.value = "";
});
