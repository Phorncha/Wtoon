import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBg7mH2TTRJy1PyMRqbdRXXJj-0IgU_SEI",

  authDomain: "test-c6db1.firebaseapp.com",

  projectId: "test-c6db1",

  storageBucket: "test-c6db1.appspot.com",

  messagingSenderId: "828435202153",

  appId: "1:828435202153:web:361f368a72d2c80bf5e2f8",

  measurementId: "G-SZ7YF9JXVE"

  };
  

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const storage = getStorage(app);
  
  export { storage, db }; // ส่งออก storage และ db
