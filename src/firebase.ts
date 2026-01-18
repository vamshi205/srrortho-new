// src/firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZLZoqjt6ciSCRyHD9DzLhYVzUhUG2tkc",
  authDomain: "srr-ortho-dc.firebaseapp.com",
  projectId: "srr-ortho-dc",
  storageBucket: "srr-ortho-dc.firebasestorage.app",
  messagingSenderId: "77019251347",
  appId: "1:77019251347:web:3550b27f9a2c5b292f0366",
  measurementId: "G-ZBKG7XN8YF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Export the app instance if needed for other services (e.g., Auth)
export default app;
