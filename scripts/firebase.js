// Original public web configuration, recovered from commit b16eb0a.
// Keep this project and collection: they contain the existing community chats.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getFirestore, collection, onSnapshot, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const app = initializeApp({
  apiKey: 'AIzaSyCKgBKyJy_luMPWxIzwlcP0bC6xWRYnH0o',
  authDomain: 'turtle-biz.firebaseapp.com',
  projectId: 'turtle-biz',
  storageBucket: 'turtle-biz.firebasestorage.app',
  messagingSenderId: '53436434205',
  appId: '1:53436434205:web:d4f012fc0acf76870fc3f4'
});
const chats = collection(getFirestore(app), 'chats');

export function subscribeToChats(next, error) {
  // An orderBy on timestamp would exclude legacy documents without that field.
  // Sort in the presentation layer without changing any stored data.
  return onSnapshot(chats, { includeMetadataChanges: true }, snapshot => next({
    fromCache: snapshot.metadata.fromCache,
    messages: snapshot.docs.map(message => ({
      id: message.id,
      text: message.data().text,
      timestamp: message.data().timestamp,
      pending: message.metadata.hasPendingWrites
    }))
  }), error);
}

export async function postChat(text) {
  const message = text.trim();
  if (!message || message.length > 150) throw new Error('Messages must be 1–150 characters.');
  // Append only, using the original schema. Never replace or delete old chats.
  return addDoc(chats, { text: message, timestamp: serverTimestamp() });
}
