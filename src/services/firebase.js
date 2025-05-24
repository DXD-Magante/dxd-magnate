import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
    apiKey: "AIzaSyCC14KmkyyahN98zuqZcVdLBBdg_QFT-ec",
    authDomain: "dxd-dashboard.firebaseapp.com",
    projectId: "dxd-dashboard",
    storageBucket: "dxd-dashboard.firebasestorage.app",
    messagingSenderId: "1053096732781",
    appId: "1:1053096732781:web:61d680932243fdbbc2f764",
    measurementId: "G-72R53VLD29"
  };


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);