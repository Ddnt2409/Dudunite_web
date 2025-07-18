import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZ5pqZLibxxcRSkNs7N0dLiGyWrbVKQ4w",
  authDomain: "ddnt2409.firebaseapp.com",
  projectId: "ddnt2409",
  storageBucket: "ddnt2409.appspot.com",
  messagingSenderId: "367991336342",
  appId: "1:367991336342:web:be4450ea0697579d9701b7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;
