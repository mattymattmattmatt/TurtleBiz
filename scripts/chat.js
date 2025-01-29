// scripts/chat.js

import {
  db,
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
// OR import them from your local firebase.js if you've exported them there:
// import { db, collection, addDoc, onSnapshot, doc, deleteDoc, serverTimestamp } from './firebase.js';

const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

// Reference to the "chats" collection in Firestore
const chatsRef = collection(db, "chats");

// Listen for real-time updates to the "chats" collection
onSnapshot(chatsRef, (snapshot) => {
  // Clear existing messages in the chat container
  chatContainer.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const messageData = docSnap.data();
    const messageId = docSnap.id;
    const messageText = messageData.text;

    // Create the message bubble
    const bubble = document.createElement("div");
    bubble.classList.add("chat-bubble");

    // The text inside the bubble
    const messageSpan = document.createElement("span");
    messageSpan.textContent = messageText;

    // Small "x" to delete the message
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.textContent = "×"; // or use "X"

    // When "x" is clicked, delete the message from Firestore
    deleteBtn.addEventListener("click", async () => {
      await deleteDoc(doc(db, "chats", messageId));
    });

    // Assemble the bubble
    bubble.appendChild(messageSpan);
    bubble.appendChild(deleteBtn);
    chatContainer.appendChild(bubble);
  });
});

// Handle chat form submissions
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newMessage = chatInput.value.trim();
  if (!newMessage) return; // Do nothing if empty

  // Add new doc to the "chats" collection
  try {
    await addDoc(chatsRef, {
      text: newMessage,
      timestamp: serverTimestamp() // Optional: store server timestamp
    });
  } catch (err) {
    console.error("Error adding document: ", err);
  }

  // Clear input field
  chatInput.value = "";
});
