// Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDnotXzrFZPyZSPfy7nVcFTq72Kr2mCn4c",
    authDomain: "flashcards-project-73131.firebaseapp.com",
    projectId: "flashcards-project-73131",
    storageBucket: "flashcards-project-73131.firebasestorage.app",
    messagingSenderId: "326762118238",
    appId: "1:326762118238:web:afd8037256085c35e108cf",
    measurementId: "G-2CMLSN7KPW"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Reference to auth and database
  const auth = firebase.auth();
  const database = firebase.database();
  
  // Google auth provider
  const googleProvider = new firebase.auth.GoogleAuthProvider();
  
  // DOM elements
  const googleLoginBtn = document.getElementById('googleLogin');
  const loadingElement = document.getElementById('loading');
  
  // Login with Google
  googleLoginBtn.addEventListener('click', () => {
    const audio = new Audio('/img/button.mp3'); // Ganti dengan nama file audio kamu
    audio.volume = 0.5; // Set volume ke 50%
    audio.play();
    
    loadingElement.classList.remove('hidden');
    
    auth.signInWithPopup(googleProvider)
      .then((result) => {
        // User signed in
        const user = result.user;
        
        // Store user data in the database
        return database.ref(`users/${user.uid}`).once('value')
          .then((snapshot) => {
            if (!snapshot.exists()) {
              // Create new user entry if it doesn't exist
              return database.ref(`users/${user.uid}`).set({
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: firebase.database.ServerValue.TIMESTAMP
              });
            } else {
              // Update last login time
              return database.ref(`users/${user.uid}`).update({
                lastLogin: firebase.database.ServerValue.TIMESTAMP
              });
            }
          });
      })
      .then(() => {
        // Redirect to dashboard
        window.location.href = '/dashboard';
      })
      .catch((error) => {
        console.error('Error during authentication:', error);
        alert('Authentication failed. Please try again.');
        loadingElement.classList.add('hidden');
      });
  });
  
  // Check auth state
  auth.onAuthStateChanged((user) => {
    loadingElement.classList.add('hidden');
    
    if (user && window.location.pathname === '/') {
      // If user is already logged in and on index page, redirect to dashboard
      window.location.href = '/dashboard';
    } else if (!user && window.location.pathname !== '/') {
      // If user is not logged in and not on index page, redirect to login
      window.location.href = '/';
    }
  });