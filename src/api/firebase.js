import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Env var names: the corrected names are read first; the old misspelled ones
// are kept as fallbacks so existing Vercel/.env settings keep working.
const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PRODUCT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.VITE_FIRBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

const isSet = (v) => Boolean(v) && v !== "undefined";

// Google sign-in needs at least these three values.
export const isFirebaseConfigured =
  isSet(firebaseConfig.apiKey) &&
  isSet(firebaseConfig.authDomain) &&
  isSet(firebaseConfig.projectId);


let auth = null;
if (isFirebaseConfigured) {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
}
export { auth };

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });


export async function getGoogleIdToken() {
  if (!auth) {
    throw new Error("Google sign-in is not configured.");
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user.getIdToken();
}