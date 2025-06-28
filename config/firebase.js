const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');

// Firebase configuration - Using actual credentials
const firebaseConfig = {
  apiKey: "AIzaSyC--XLn7L3KAn_6Uu1eO6aBDVt2rusO8i8",
  authDomain: "red-web-4fe2b.firebaseapp.com",
  projectId: "red-web-4fe2b",
  storageBucket: "red-web-4fe2b.firebasestorage.app",
  messagingSenderId: "873018006625",
  appId: "1:873018006625:web:9346d2cadaf096ff121e20"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase services
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

module.exports = {
  firebaseApp,
  db,
  auth
}; 
