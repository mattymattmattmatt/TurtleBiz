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

// References to HTML elements
const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

// Reference the "chats" collection
const chatsRef = collection(db, "chats");

// Use "desc" to get newest messages first
const chatsQuery = query(chatsRef, orderBy("timestamp", "desc"));

// Listen for real-time updates using the ordered query
onSnapshot(chatsQuery, (snapshot) => {
  // Clear the chat display
  chatContainer.innerHTML = "";

  // Firestore returns the docs newest -> oldest in this loop
  snapshot.forEach((docSnap) => {
    const messageData = docSnap.data();
    const messageId = docSnap.id;
    const messageText = messageData.text;

    // Create chat bubble
    const bubble = document.createElement("div");
    bubble.classList.add("chat-bubble");

    // Message text element
    const messageSpan = document.createElement("span");
    messageSpan.textContent = messageText;

    // Delete button ("x")
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.textContent = "×";

    // Delete the doc from Firestore on click
    deleteBtn.addEventListener("click", async () => {
      await deleteDoc(doc(db, "chats", messageId));
    });

    // Assemble the bubble
    bubble.appendChild(messageSpan);
    bubble.appendChild(deleteBtn);
    chatContainer.appendChild(bubble);
  });
});

// Handle new message form submissions
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newMessage = chatInput.value.trim();
  if (!newMessage) return; // ignore empty submissions

  try {
    // Add new doc with a timestamp for sorting
    await addDoc(chatsRef, {
      text: newMessage,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Error adding chat message:", err);
  }

  // Clear the input
  chatInput.value = "";
});
