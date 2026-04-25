import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCp1rV3Hm_QFYdC1gpCe5A63VLqgMaiSpQ",
  authDomain: "food-tracker-25902.firebaseapp.com",
  projectId: "food-tracker-25902",
  storageBucket: "food-tracker-25902.firebasestorage.app",
  messagingSenderId: "527102117645",
  appId: "1:527102117645:web:2d96b39d9cd9f2f93d9244",
  measurementId: "G-SRTP5NZX33"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
