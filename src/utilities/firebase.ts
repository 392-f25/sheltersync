import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Hardcoded Firebase config (previous project style). Update here if you switch projects.
const firebaseConfig = {
  apiKey: 'AIzaSyCrBRT1i33fmMzBFXP781e5w0cjm7obKG0',
  authDomain: 'sheltersync-c5e76.firebaseapp.com',
  databaseURL: 'https://sheltersync-c5e76-default-rtdb.firebaseio.com',
  projectId: 'sheltersync-c5e76',
  storageBucket: 'sheltersync-c5e76.firebasestorage.app',
  messagingSenderId: '729465795688',
  appId: '1:729465795688:web:739ed6b64c2ee0580a37dd',
};

// Avoid re-initializing in Vite HMR
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getDatabase(app);
