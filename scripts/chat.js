// scripts/chat.js

import {
  db,
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  serverTimestamp,
  query,       // <-- for ordering
  orderBy      // <-- for ordering
} from "./firebase.js";  // Adjust the path if needed

// Get references to HTML elements
const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

// Reference the "chats" collection
const chatsRef = collection(db, "chats");

// Create a query that sorts messages by timestamp in ascending order
const chatsQuery = query(chatsRef, orderBy("timestamp", "asc"));

// Listen for real-time updates using the ordered query
onSnapshot(chatsQuery, (snapshot) => {
  // Clear the chat display first
  chatContainer.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const messageData = docSnap.data();
    const messageId = docSnap.id;
    const messageText = messageData.text;

    // Create a chat bubble
    const bubble = document.createElement("div");
    bubble.classList.add("chat-bubble");

    // Message text
    const messageSpan = document.createElement("span");
    messageSpan.textContent = messageText;

    // Delete button ("x")
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.textContent = "×";

    // When clicked, remove the document from Firestore
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
  if (!newMessage) return; // Ignore empty submissions

  try {
    // Add a new doc with a timestamp field
    await addDoc(chatsRef, {
      text: newMessage,
      timestamp: serverTimestamp() // ensures we can sort
    });
  } catch (err) {
    console.error("Error adding chat message:", err);
  }

  // Clear the input
  chatInput.value = "";
});
