import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmlG-lBodWq8aE6oe1-uPTPVK0HntcmRE",
  authDomain: "prefer-22556.firebaseapp.com",
  projectId: "prefer-22556",
  storageBucket: "prefer-22556.firebasestorage.app",
  messagingSenderId: "6296087913",
  appId: "1:6296087913:web:68f550f153ab3805f321f8",
  measurementId: "G-JWWE230BLS",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAnalytics(app);
export default app;
