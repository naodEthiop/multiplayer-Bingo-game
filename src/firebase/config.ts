import {getFirestore} from "firebase/firestore";
import {getAuth} from "firebase/auth";
import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUL6n2RVoKE_lIdnMJFadACTwSYHNMHaU",
  authDomain: "bingo-game-39ba5.firebaseapp.com",
  projectId: "bingo-game-39ba5",
  storageBucket: "bingo-game-39ba5.firebasestorage.app",
  messagingSenderId: "817224600440",
  appId: "1:817224600440:web:55fe03f641a710e5cf168d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);