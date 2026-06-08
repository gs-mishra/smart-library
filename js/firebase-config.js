// firebase-config.js
// Paste your Firebase Web App configuration below.
// If left empty or dummy, the application will fallback to LocalStorage database mode.

const firebaseConfig = {
  apiKey: "AIzaSyDJJvSkMOJYbCCv5BOCaGNFh_9kMugs4Ns",
  authDomain: "smart-library-c2048.firebaseapp.com",
  projectId: "smart-library-c2048",
  storageBucket: "smart-library-c2048.firebasestorage.app",
  messagingSenderId: "690076349216",
  appId: "1:690076349216:web:860e93bdbfc79c1b245d45"
};

// Check if Firebase is configured (i.e., user replaced placeholders)
const isFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
};

// Export configuration helper
window.firebaseConfig = firebaseConfig;
window.isFirebaseConfigured = isFirebaseConfigured;
