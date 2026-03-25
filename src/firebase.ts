import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDkd8Q8prVcYldHBc-qjWOVkf5IA3qfQkI",
  authDomain: "oc-gallery.firebaseapp.com",
  projectId: "oc-gallery",
  storageBucket: "oc-gallery.firebasestorage.app",
  messagingSenderId: "684869292431",
  appId: "1:684869292431:web:28c75797a5228ba2097bfa",
  measurementId: "G-JYJ56LXZJG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
