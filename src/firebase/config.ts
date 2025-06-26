import {getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork} from "firebase/firestore";
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

// Add connection retry logic
let retryCount = 0;
const maxRetries = 3;

const handleConnectionError = async () => {
  if (retryCount < maxRetries) {
    retryCount++;
    console.log(`Attempting to reconnect to Firestore (attempt ${retryCount}/${maxRetries})`);
    
    try {
      // Disable and re-enable network to force reconnection
      await disableNetwork(db);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await enableNetwork(db);
      console.log('Firestore reconnection successful');
      retryCount = 0; // Reset counter on success
    } catch (error) {
      console.error('Firestore reconnection failed:', error);
      if (retryCount >= maxRetries) {
        console.error('Max reconnection attempts reached. Please check your internet connection.');
      }
    }
  }
};

// Monitor connection state
const checkConnection = () => {
  if (!navigator.onLine) {
    console.warn('Device is offline. Firestore will operate in offline mode.');
  } else {
    // If online but still having issues, try to reconnect
    handleConnectionError();
  }
};

// Listen for online/offline events
window.addEventListener('online', () => {
  console.log('Device came online, attempting Firestore reconnection');
  retryCount = 0; // Reset retry count when coming online
  handleConnectionError();
});

window.addEventListener('offline', () => {
  console.log('Device went offline, Firestore will use cached data');
});

// Initial connection check
if (typeof window !== 'undefined') {
  // Check connection after a short delay to allow Firebase to initialize
  setTimeout(checkConnection, 2000);
}