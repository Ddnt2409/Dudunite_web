// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 1) Lê de variáveis de ambiente (Vercel / .env.*)
//   Obs: com Vite, só variáveis prefixadas com VITE_ vão para o front-end.
const envCfg = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// 2) Fallback — preencha com os dados REAIS do seu projeto (Console Firebase → Configurar app Web)
const hardcodedCfg = {
  apiKey: "COLE_AQUI",
  authDomain: "SEU_PROJECT_ID.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT_ID.appspot.com",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI",
};

// Decide qual usar
const cfg = Object.values(envCfg).every(Boolean) ? envCfg : hardcodedCfg;

// Aviso se ainda estiver com placeholders
if (!cfg.projectId || /SEU_PROJECT_ID/.test(cfg.projectId)) {
  console.error("⚠️ Firebase mal configurado — defina VITE_FIREBASE_* no Vercel ou preencha o fallback em firebase.js com valores REAIS.");
}

// Evita re-inicializar
const app = getApps().length ? getApp() : initializeApp(cfg);
const db = getFirestore(app);

// (opcional) Log temporário para conferir no navegador qual projectId está em uso
console.log("[Firebase] projectId:", app.options.projectId);

export { db, app };
export default db;
