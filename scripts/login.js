import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
    // Initialize Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyBQHh2-bc-PqCgxnxSz5ea9XD8WKUFmI60",
        authDomain: "askify-4424d.firebaseapp.com",
        projectId: "askify-4424d",
        storageBucket: "askify-4424d.firebasestorage.app",
        messagingSenderId: "37659707490",
        appId: "1:37659707490:web:ef22a078102ce9cd0ca93b",
        measurementId: "G-HEQ098XY8L"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Initialize Bootstrap modals after the page has loaded
    const loginModalElement = document.getElementById("loginModal");
    const signupModalElement = document.getElementById("signupModal");

    const loginModal = new bootstrap.Modal(loginModalElement);
    const signupModal = new bootstrap.Modal(signupModalElement);

    // Function to open the Login Modal
    function openLoginModal() {
        loginModal.show();
    }

    // Function to toggle between Login and Signup Modals
    function toggleToSignup() {
        loginModal.hide();
        signupModal.show();
    }

    function toggleToLogin() {
        signupModal.hide();
        loginModal.show();
    }

    function userProfile(){
        window.location.href="./pages/dashboard.html"
    }

    // function openChannel(){
    //     window.location.href="./pages/channels.html"
    // }
    function openChannel(){
        alert("This feature is in progress and will be updated soon.")
    }
    function bellIcon(){
        alert("This feature is in progress and will be updated soon.")
    }
    window.bellIcon=bellIcon
    // Attach functions to the window object to make them globally accessible
    window.openChannel = openChannel
    window.userProfile = userProfile
    window.openLoginModal = openLoginModal;
    window.toggleToSignup = toggleToSignup;
    window.toggleToLogin = toggleToLogin;

    // Handle Authentication State
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            console.log("User signed in:", user);

            // Show the "Ask Question" section when user is logged in
        

            // Hide the login button and show the bell and person icon
            document.getElementById("channelIcon").style.display = "inline-block"
            document.getElementById("loginBtn").style.display = "none";
            document.getElementById("bellIcon").style.display = "inline-block";
            document.getElementById("personIcon").style.display = "inline-block";
        } else {
            // User is signed out
            console.log("User signed out");

            // Hide the "Ask Question" section when user is logged out
          

            // Show the login button and hide the bell and person icon
            document.getElementById("channelIcon").style.display = "none"
            document.getElementById("loginBtn").style.display = "inline-block";
            document.getElementById("bellIcon").style.display = "none";
            document.getElementById("personIcon").style.display = "none";
        }
    });

    // Real-time Validation for Signup Form (Username)
    document.getElementById("signupUsername").addEventListener("input", async function () {
        const username = this.value;
        const usernameError = document.getElementById("signupUsernameError");

        // Validate username format
        if (username.includes(" ")) {
            usernameError.textContent = "Username cannot contain spaces.";
        } else if (/[^a-z]/.test(username)) {
            usernameError.textContent = "Username must only contain lowercase alphabets.";
        } else if (username.length < 3) {
            usernameError.textContent = "Username must be at least 3 characters long.";
        } else {
            // Check if the username is already taken by querying Firestore
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                usernameError.textContent = "Username is already taken.";
            } else {
                usernameError.textContent = "";
            }
        }
    });

    // Real-time Validation for Signup Form (Email)
    document.getElementById("signupEmail").addEventListener("input", function () {
        const email = this.value;
        const emailError = document.getElementById("signupEmailError");

        if (!/^[a-z0-9]+@[a-z]+\.[a-z]{2,3}$/.test(email)) {
            emailError.textContent = "Please enter a valid email address.";
        } else {
            emailError.textContent = "";
        }
    });

    // Real-time Validation for Signup Form (Password)
    document.getElementById("signupPassword").addEventListener("input", function () {
        const password = this.value;
        const passwordError = document.getElementById("signupPasswordError");

        if (password.length < 8) {
            passwordError.textContent = "Password must be at least 8 characters long.";
        } else if (!/[A-Z]/.test(password)) {
            passwordError.textContent = "Password must contain at least one uppercase letter.";
        } else if (!/[a-z]/.test(password)) {
            passwordError.textContent = "Password must contain at least one lowercase letter.";
        } else if (!/[0-9]/.test(password)) {
            passwordError.textContent = "Password must contain at least one number.";
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            passwordError.textContent = "Password must contain at least one special character.";
        } else if (/\s/.test(password)) {
            passwordError.textContent = "Password cannot contain spaces.";
        } else {
            passwordError.textContent = "";
        }
    });

    // Handle Form Submission for Signup
    const signupForm = document.getElementById("signupForm");
    signupForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const username = document.getElementById("signupUsername").value;
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;

        const usernameError = document.getElementById("signupUsernameError").textContent;
        const emailError = document.getElementById("signupEmailError").textContent;
        const passwordError = document.getElementById("signupPasswordError").textContent;

        // Check if there are any errors
        if (usernameError || emailError || passwordError) {
            alert("Please correct the errors before submitting.");
        } else {
            // Firebase Sign Up
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;

                    // Add user data to Firestore
                    const userDocRef = doc(db, "users", user.uid);
                    setDoc(userDocRef, {
                        username: username,
                        email: email,
                        createdAt: serverTimestamp()
                    })
                    .then(() => {
                        alert("Signup Successful!");
                        signupModal.hide();

                        // Hide login button and show the bell and person icon
                        document.getElementById("loginBtn").style.display = "none";
                        document.getElementById("bellIcon").style.display = "inline-block";
                        document.getElementById("personIcon").style.display = "inline-block";
                    })
                    .catch((error) => {
                        alert("Error saving user data: " + error.message);
                    });
                })
                .catch((error) => {
                    alert("Error: " + error.message);
                });
        }
    });

    // Handle Form Submission for Login
    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        const emailError = document.getElementById("loginEmailError").textContent;

        if (emailError) {
            alert("Please correct the errors before submitting.");
        } else {
            // Firebase Login
            signInWithEmailAndPassword(auth, email, password)
                .then(() => {
                    alert("Login Successful!");
                    loginModal.hide();

                    // Hide login button and show the bell and person icon
                    document.getElementById("loginBtn").style.display = "none";
                    document.getElementById("bellIcon").style.display = "inline-block";
                    document.getElementById("personIcon").style.display = "inline-block";
                })
                .catch((error) => {
                    alert("Error: " + error.message);
                });
        }
    });

    // Toggle Password Visibility for Login and Signup
    const loginPassword = document.getElementById("loginPassword");
    const signupPassword = document.getElementById("signupPassword");
    const toggleLoginPassword = document.getElementById("toggleLoginPassword");
    const toggleSignupPassword = document.getElementById("toggleSignupPassword");
    const eyeIconLogin = document.getElementById("eyeIconLogin");
    const eyeIconSignup = document.getElementById("eyeIconSignup");

    // Toggle password visibility for login
    toggleLoginPassword.addEventListener("click", function () {
        if (loginPassword.type === "password") {
            loginPassword.type = "text";
            eyeIconLogin.classList.remove("bi-eye-slash");
            eyeIconLogin.classList.add("bi-eye");
        } else {
            loginPassword.type = "password";
            eyeIconLogin.classList.remove("bi-eye");
            eyeIconLogin.classList.add("bi-eye-slash");
        }
    });

    // Toggle password visibility for signup
    toggleSignupPassword.addEventListener("click", function () {
        if (signupPassword.type === "password") {
            signupPassword.type = "text";
            eyeIconSignup.classList.remove("bi-eye-slash");
            eyeIconSignup.classList.add("bi-eye");
        } else {
            signupPassword.type = "password";
            eyeIconSignup.classList.remove("bi-eye");
            eyeIconSignup.classList.add("bi-eye-slash");
        }
    });
});
