// src/firebase.js
// Ponto único de inicialização do Firebase para todo o app (Módulo 1 + Financeiro)

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// >>> IMPORTANTE <<<
// Use o MESMO firebaseConfig que você já usa hoje no Módulo 1.
// Se o seu arquivo atual já tem esse objeto, mantenha-o aqui.
// Exemplo/placeholder abaixo — SUBSTITUA pelos seus valores reais:
const firebaseConfig = {
  apiKey: "SEU_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
};

// Evita re-inicializar em hot reload / múltiplas entradas
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firestore único do projeto (usado por Módulo 1 e Financeiro)
export const db = getFirestore(app);

// Exporta app caso seja necessário em outro lugar
export { app };
