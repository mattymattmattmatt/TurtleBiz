// scripts/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";
import { getFirestore, doc, runTransaction, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKgBKyJy_luMPWxIzwlcP0bC6xWRYnH0o",
  authDomain: "turtle-biz.firebaseapp.com",
  projectId: "turtle-biz",
  storageBucket: "turtle-biz.firebasestorage.app",
  messagingSenderId: "53436434205",
  appId: "1:53436434205:web:d4f012fc0acf76870fc3f4",
  measurementId: "G-EWR4LJLXMR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Export the Firestore database and necessary functions
export { db, doc, runTransaction, getDoc, setDoc, updateDoc };
