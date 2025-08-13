// src/firebase.js
// Ponto único de inicialização do Firebase (Módulo 1 + Financeiro)

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// MANTENHA AQUI o mesmo firebaseConfig que você já está usando
// (não altere seus valores)
const firebaseConfig = {
  apiKey: "SEU_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
};

// Evita re-inicializar (hot reload / múltiplas entradas)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firestore único
const db = getFirestore(app);

// Exports compatíveis com ambos os estilos de import
export { db, app };   // uso: import { db } from "../firebase";
export default db;     // uso: import db from "../firebase";
