// src/firebaseFinanceiro.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuração do Firebase do Módulo Financeiro
const firebaseFinanceiroConfig = {
  apiKey: "AIzaSyA6FAbMC67qxiD3zDNYzs7HiCNsYGUce5k",
  authDomain: "dudunite-financeiro.firebaseapp.com",
  projectId: "dudunite-financeiro",
  storageBucket: "dudunite-financeiro.firebasestorage.app",
  messagingSenderId: "1002980268849",
  appId: "1:1002980268849:web:ad55eea99700bab55dee10"
};

const appFinanceiro = initializeApp(firebaseFinanceiroConfig, "financeiro");
const dbFinanceiro = getFirestore(appFinanceiro);

export default dbFinanceiro;
