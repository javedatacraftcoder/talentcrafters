// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCgX2a_zf8sweWMGLZa-chIdAKTSC5kudI",
  authDomain: "talentcrafters-19f35.firebaseapp.com",
  projectId: "talentcrafters-19f35",
  storageBucket: "talentcrafters-19f35.firebasestorage.app",
  messagingSenderId: "764716169339",
  appId: "1:764716169339:web:c6e2c1c98a3912d9d90ade",
};

// Evita reinicializar si ya está inicializado
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exporta Firestore
const db = getFirestore(app);

export { db };
