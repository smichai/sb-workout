import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDl-d1UHpcrH2xzSDxytvyRdFgVPjCYJPc",
  authDomain: "sb-workout-1aeb5.firebaseapp.com",
  projectId: "sb-workout-1aeb5",
  storageBucket: "sb-workout-1aeb5.firebasestorage.app",
  messagingSenderId: "261392783801",
  appId: "1:261392783801:web:c25ae8717d7764c7b37e68",
  measurementId: "G-VYGKDE0LP9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth Export
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore Export
export const db = getFirestore(app);

export { signInWithPopup, signOut, onAuthStateChanged };
