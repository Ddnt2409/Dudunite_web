import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZS…VKQ4w",                 // seus valores reais
  authDomain: "ddnt2409.firebaseapp.com",
  projectId: "ddnt2409",
  storageBucket: "ddnt2409.appspot.com",     // <- bucket
  messagingSenderId: "367991336342",
  appId: "1:367991336342:web:be4450ea0697579d9701b7",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db  = getFirestore(app);

export { app, db };
export default db;
