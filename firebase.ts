import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAm7rFX7dZ5acQdQiGbjYHHQH8u425hbIE",
  authDomain: "moizychat.firebaseapp.com",
  projectId: "moizychat",
  storageBucket: "moizychat.firebasestorage.app",
  messagingSenderId: "658602474034",
  appId: "1:658602474034:web:37c97351fd910bfdc41a2b",
  measurementId: "G-J6G6C0X0S3"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export default firebase;