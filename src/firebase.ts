import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCzN3VHiqxhWXKxshZi4ORFm9_IGGQr9J0",
  authDomain: "fanon-mobile.firebaseapp.com",
  projectId: "fanon-mobile",
  storageBucket: "fanon-mobile.firebasestorage.app",
  messagingSenderId: "269660937918",
  appId: "1:269660937918:web:f34ae3e5394f464eec48ef",
  measurementId: "G-8WYSW1D05Y",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
