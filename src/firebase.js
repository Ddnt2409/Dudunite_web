// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

// -> Use exatamente os SEUS valores reais (os mesmos que já estavam em produção)
const firebaseConfig = {
  apiKey: "AIzaSyCZS…VKQ4w",
  authDomain: "ddnt2409.firebaseapp.com",
  projectId: "ddnt2409",
  storageBucket: "ddnt2409.appspot.com", // bucket, não o domínio .firebasestorage.app
  messagingSenderId: "367991336342",
  appId: "1:367991336342:web:be4450ea0697579d9701b7",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Evita o uso do WebChannel/cleardot.gif em redes restritas
initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true, // detecta e usa long-polling quando necessário
  useFetchStreams: false,
  // Se ainda aparecer erro, troque por:
  // experimentalForceLongPolling: true,
});

const db = getFirestore(app);

export { app, db };
export default db;
