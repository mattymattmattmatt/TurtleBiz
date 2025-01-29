// scripts/chat.js

import {
  db,
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  serverTimestamp
} from "./firebase.js";  // relative path to firebase.js

const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

// Reference to "chats" collection
const chatsRef = collection(db, "chats");

// Listen in real time for new/deleted messages
onSnapshot(chatsRef, (snapshot) => {
  // Clear the chat display
  chatContainer.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const messageData = docSnap.data();
    const messageId = docSnap.id;
    const messageText = messageData.text;

    // Create chat bubble
    const bubble = document.createElement("div");
    bubble.classList.add("chat-bubble");

    // Message text
    const messageSpan = document.createElement("span");
    messageSpan.textContent = messageText;

    // Delete button (small "x")
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.textContent = "×";

    // On delete button click, remove this doc from Firestore
    deleteBtn.addEventListener("click", async () => {
      await deleteDoc(doc(db, "chats", messageId));
    });

    // Put bubble together
    bubble.appendChild(messageSpan);
    bubble.appendChild(deleteBtn);
    chatContainer.appendChild(bubble);
  });
});

// Handle new message form submissions
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newMessage = chatInput.value.trim();
  if (!newMessage) return; // ignore empty string

  try {
    await addDoc(chatsRef, {
      text: newMessage,
      timestamp: serverTimestamp() // optional field
    });
  } catch (err) {
    console.error("Error adding chat message:", err);
  }

  // Clear the input
  chatInput.value = "";
});
