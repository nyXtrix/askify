// // Import Firebase modules (Firebase v11.1.0 Modular SDK)
// import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
// import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';
// import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';

// // Initialize Firebase with the Firebase config object
// const firebaseConfig = {
//     apiKey: "AIzaSyBQHh2-bc-PqCgxnxSz5ea9XD8WKUFmI60",
//     authDomain: "askify-4424d.firebaseapp.com",
//     projectId: "askify-4424d",
//     storageBucket: "askify-4424d.firebasestorage.app",
//     messagingSenderId: "37659707490",
//     appId: "1:37659707490:web:ef22a078102ce9cd0ca93b",
//     measurementId: "G-HEQ098XY8L"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);

// // Function to toggle the notification dropdown visibility
// function openNotifications() {
//     const notificationDropdown = document.getElementById('notificationDropdown');
//     notificationDropdown.style.display = (notificationDropdown.style.display === 'block') ? 'none' : 'block';
// }
// document.addEventListener('click', (e) => {
//     if (!bellIcon.contains(e.target) && !notificationDropdown.contains(e.target)) {
//         notificationDropdown.style.display = 'none'
//     }
// })

// // Function to show welcome notification and old notifications
// async function showNotifications() {
//     const user = auth.currentUser; // Get current logged-in user
//     if (user) {
//         const userRef = doc(db, "users", user.email); // Reference to user's document
//         const userDoc = await getDoc(userRef); // Fetch the document

//         if (!userDoc.exists()) {
//             // If the user document doesn't exist, create a new one and add the welcome notification
//             await setDoc(userRef, {
//                 notifications: [
//                     `Welcome ${user.displayName} to Askify!`
//                 ]
//             });
//             displayNotifications([`Welcome ${user.displayName} to Askify!`]);
//         } else {
//             // Display the existing notifications if available
//             const notifications = userDoc.data().notifications;
//             if (notifications.length === 0) {
//                 displayNotifications(["No new notifications."]);
//             } else {
//                 displayNotifications(notifications);
//             }
//         }
//     }
// }

// // Function to display notifications in the dropdown
// function displayNotifications(notifications) {
//     const notificationDropdown = document.getElementById('notificationDropdown');
//     notificationDropdown.innerHTML = '<div class="notification-header"><h6>Notifications</h6></div>';

//     notifications.forEach(notification => {
//         const notificationElement = document.createElement('div');
//         notificationElement.classList.add('notification-item');
//         notificationElement.innerHTML = notification;
//         notificationDropdown.appendChild(notificationElement);
//     });
// }

// // Initialize Notifications when the user logs in
// onAuthStateChanged(auth, user => {
//     if (user) {
//         document.getElementById('bellIcon').style.display = 'block'; // Show bell icon when user is logged in
//         showNotifications(); // Show the notifications
//     }
// });

// // Add event listener for the bell icon to open the notifications dropdown
// document.addEventListener('DOMContentLoaded', function () {
//     const bellIcon = document.getElementById('bellIcon');
//     bellIcon.addEventListener('click', openNotifications);  // Add event listener to the button
// });
