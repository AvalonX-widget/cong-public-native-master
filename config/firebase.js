import firebase from 'firebase';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCL4pUmJ5tnbih6lp31_kUAqejvhSsblQs",
  authDomain: "cong-public.firebaseapp.com",
  databaseURL: "https://cong-public.firebaseio.com",
  projectId: "cong-public",
  storageBucket: "cong-public.appspot.com",
  messagingSenderId: "1022335486264"
};

firebase.initializeApp(firebaseConfig);

export const database = firebase.database();
