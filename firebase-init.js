// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDN1E5nYSj0aJQ66EEFf8NGH3lkDy64Cf8",
  authDomain: "a1dos-creations-25.firebaseapp.com",
  projectId: "a1dos-creations-25",
  storageBucket: "a1dos-creations-25.firebasestorage.app",
  messagingSenderId: "874801347017",
  appId: "1:874801347017:web:34cfce97e3eee8479a9018",
  measurementId: "G-7JBQ0CWX91"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions();
const storage = firebase.storage();
