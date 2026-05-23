// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE SETUP — PLUG YOUR CONFIG HERE
//
// Steps:
//  1. Go to https://console.firebase.google.com
//  2. Create a new project (e.g. "flowboost")
//  3. Add a Web App → copy the firebaseConfig object below
//  4. Enable these in Firebase Console:
//       Authentication → Sign-in methods → Google ✓  Email/Password ✓
//       Firestore Database → Create database (start in production mode)
//  5. Replace all "YOUR_*" values below with your actual config
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCmdFO_5F5laoq_hlu5C-qR85RZw27wIU8",
  authDomain: "waveport-3fa2f.firebaseapp.com",
  projectId: "waveport-3fa2f",
  storageBucket: "waveport-3fa2f.firebasestorage.app",
  messagingSenderId: "534459458347",
  appId: "1:534459458347:web:a948a59ac1992967381b6e",
  measurementId: "G-JY41N2NER5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
