// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PRODUCT_ID,
  storageBucket: import.meta.env.VITE_FIRBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "undefined" && 
  firebaseConfig.apiKey !== ""
);

// Initialize Firebase only if configured (or initialize anyway depending on your setup)
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

export async function getGoogleIdToken() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Get the Google credential which contains the idToken
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const idToken = credential?.idToken;

    if (!idToken) {
      throw new Error("Failed to retrieve Google ID token from credentials.");
    }

    return idToken;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}