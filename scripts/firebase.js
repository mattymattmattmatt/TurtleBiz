// scripts/firebase.js

// Import the functions you need from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
  getDoc,
  setDoc,
  query,
  orderBy,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Your web app's Firebase configuration
// NOTE: Replace these placeholders with YOUR actual config from the Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "turtle-biz.firebaseapp.com",
  projectId: "turtle-biz",
  storageBucket: "turtle-biz.appspot.com",
  messagingSenderId: "53436434205",
  appId: "1:53436434205:web:d4f012fc0acf76870fc3f4",
  measurementId: "G-EWR4LJLXMR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore
const db = getFirestore(app);

// Export the Firestore instance and all the Firestore functions you need
export {
  db,
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
  getDoc,
  setDoc,
  query,
  orderBy,
  updateDoc
};
