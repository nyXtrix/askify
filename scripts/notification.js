import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';

// Initialize Firebase with the Firebase config object
const firebaseConfig = {
    apiKey: "AIzaSyBQHh2-bc-PqCgxnxSz5ea9XD8WKUFmI60",
    authDomain: "askify-4424d.firebaseapp.com",
    projectId: "askify-4424d",
    storageBucket: "askify-4424d.firebasestorage.app",
    messagingSenderId: "37659707490",
    appId: "1:37659707490:web:ef22a078102ce9cd0ca93b",
    measurementId: "G-HEQ098XY8L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Function to toggle the notification dropdown visibility
function openNotifications() {
    const notificationDropdown = document.getElementById('notificationDropdown');
    notificationDropdown.style.display = (notificationDropdown.style.display === 'block') ? 'none' : 'block';
}

// Function to close the notification dropdown when clicking outside of it
document.addEventListener('click', (e) => {
    const notificationDropdown = document.getElementById('notificationDropdown');
    const bellIcon = document.getElementById('bellIcon');
    if (bellIcon && notificationDropdown && !bellIcon.contains(e.target) && !notificationDropdown.contains(e.target)) {
        notificationDropdown.style.display = 'none';
    }
});

// Function to show notifications
async function showNotifications() {
    const user = auth.currentUser; // Get current logged-in user
    if (user) {
        const userRef = doc(db, "users", user.uid); // Reference to user's document by UID
        const userDoc = await getDoc(userRef); // Fetch the document

        const notifications = userDoc.exists() ? userDoc.data().notifications || [] : [];

        // If there are new notifications, update the bell icon color to blue
        if (notifications.length > 0 && notifications.some(notification => notification.isNew === true)) {
            document.getElementById('bellIcon').style.backgroundColor = 'blue'; // Set bell icon to blue
        } else {
            document.getElementById('bellIcon').style.backgroundColor = ''; // Reset bell icon to default color
        }

        displayNotifications(notifications);
    }
}

// Function to display notifications in the dropdown
function displayNotifications(notifications) {
    const notificationDropdown = document.getElementById('notificationDropdown');
    notificationDropdown.innerHTML = '<div class="notification-header"><h6>Notifications</h6></div>';

    notifications.forEach((notification, index) => {
        const notificationElement = document.createElement('div');
        notificationElement.classList.add('notification-item');
        notificationElement.innerHTML = notification.message;

        // Add "X" button to dismiss the notification
        const dismissButton = document.createElement('span');
        dismissButton.textContent = 'X';
        dismissButton.classList.add('dismiss-button');
        dismissButton.addEventListener('click', async () => {
            // Mark notification as seen
            const user = auth.currentUser;
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const updatedNotifications = userDoc.data().notifications.map((notif, idx) => {
                        if (idx === index) {
                            notif.isNew = false; // Mark this notification as seen
                        }
                        return notif;
                    });

                    await updateDoc(userRef, { notifications: updatedNotifications });
                    showNotifications(); // Reload the notifications
                }
            }
        });

        notificationElement.appendChild(dismissButton);
        notificationDropdown.appendChild(notificationElement);
    });
}

// Initialize Notifications when the user logs in
onAuthStateChanged(auth, user => {
    if (user) {
        document.getElementById('bellIcon').style.display = 'block'; // Show bell icon when user is logged in
        showNotifications(); // Show the notifications
    }
});

// Add event listener for the bell icon to open the notifications dropdown
document.addEventListener('DOMContentLoaded', function () {
    const bellIcon = document.getElementById('bellIcon');
    const notificationDropdown = document.getElementById('notificationDropdown');

    if (bellIcon && notificationDropdown) {
        bellIcon.addEventListener('click', openNotifications);  // Add event listener to the button
    }
});
