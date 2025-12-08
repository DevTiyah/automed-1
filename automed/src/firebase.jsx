// firebase.jsx
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, remove, update } from 'firebase/database';

// --- Firebase Configuration ---
// IMPORTANT: Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKWAsgN5QKrIvPz0x5A9jUUxTVshnFPao",
  authDomain: "automed-d980c.firebaseapp.com",
  databaseURL: "https://automed-d980c-default-rtdb.firebaseio.com",
  projectId: "automed-d980c",
  storageBucket: "automed-d980c.firebasestorage.app",
  messagingSenderId: "664828223150",
  appId: "1:664828223150:web:a517c57000bab20622973f",
  measurementId: "G-5MKD1JPGBL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Export Firebase database instance and functions for use in other components
export { database, ref, set, onValue, push, remove, update };
