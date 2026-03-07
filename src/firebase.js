// ============================================================
// SSC — Configuration Firebase (Auth + Firestore)
// ============================================================

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC48psH9fRlmW4zxPf8mBWgUc5QyjZ710U",
  authDomain: "ssc-stock.firebaseapp.com",
  projectId: "ssc-stock",
  storageBucket: "ssc-stock.firebasestorage.app",
  messagingSenderId: "648101576019",
  appId: "1:648101576019:web:20e0b60764721ca44df5a6",
  measurementId: "G-J7T31WBXYX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
