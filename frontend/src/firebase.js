// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA2wjkbYRmRQXiIxVyuJYNjAX3IAwYVM8M",
    authDomain: "volcano-b2672.firebaseapp.com",
    projectId: "volcano-b2672",
    storageBucket: "volcano-b2672.firebasestorage.app",
    messagingSenderId: "628904014625",
    appId: "1:628904014625:web:b646ac8de8c3c27a0fc460",
    measurementId: "G-NQWRN7DCBN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { app, auth, analytics };
