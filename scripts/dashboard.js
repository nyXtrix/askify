import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy, limit, deleteDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQHh2-bc-PqCgxnxSz5ea9XD8WKUFmI60",
    authDomain: "askify-4424d.firebaseapp.com",
    projectId: "askify-4424d",
    storageBucket: "askify-4424d.firebasestorage.app",
    messagingSenderId: "37659707490",
    appId: "1:37659707490:web:ef22a078102ce9cd0ca93b",
    measurementId: "G-HEQ098XY8L",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM elements
const usernameElement = document.getElementById('username');
const userHandleElement = document.getElementById('userHandle');
const profileNameElement = document.getElementById('profileName');
const questionsCountElement = document.getElementById('questionsCount');
const answersCountElement = document.getElementById('answersCount');
const likesCountElement = document.getElementById('likesCount');
const recentQuestionsElement = document.getElementById('recentQuestions');
const myQuestionsElement = document.getElementById('myQuestions');
const recentQuestionsContainer = document.getElementById('recentQuestionsContainer');
const myQuestionsContainer = document.getElementById('myQuestionsContainer');
const settingsSection = document.getElementById('settingsSection');
const settingsForm = document.getElementById('settingsForm');
const newUsernameElement = document.getElementById('newUsername');
const newEmailElement = document.getElementById('newEmail');
const newPasswordElement = document.getElementById('newPassword');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const logoutButton = document.getElementById('logoutBtn');
const myQuestionsBtn = document.getElementById('myQuestionsBtn');
const settingsBtn = document.getElementById('settingsBtn');
const pageTitle = document.getElementById('pageTitle');
const dashboardButton = document.getElementById('dashboardBtn'); // Dashboard button
const overlay = document.createElement('div');
overlay.id = 'overlay';
overlay.style.display = 'none';
overlay.style.position = 'fixed';
overlay.style.top = '0';
overlay.style.left = '0';
overlay.style.width = '100%';
overlay.style.height = '100%';
overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
overlay.style.zIndex = '9998';
document.body.appendChild(overlay);

// Event listener for the "X" button (close My Questions section)
const createCloseButton = () => {
    const closeBtn = document.createElement('button');
    closeBtn.classList.add('close-btn');
    closeBtn.innerHTML = 'X';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.border = 'none';
    closeBtn.style.backgroundColor = 'transparent';
    closeBtn.style.cursor = 'pointer';
    closeBtn.addEventListener('click', () => {
        myQuestionsContainer.classList.add('d-none'); // Hide My Questions section
        recentQuestionsContainer.classList.remove('d-none'); // Show Recent Questions section
    });
    return closeBtn;
}

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User signed in:", user);
        await loadUserData(user);
    } else {
        console.log("No user signed in.");
        window.location.href = 'login.html'; // Redirect to login page
    }
});

// Fetch user data from Firestore
async function loadUserData(user) {
    const userId = user.uid;
    // Fetch user profile info
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log("Fetched user data:", userData);
        usernameElement.textContent = userData.username || 'User Name';
        userHandleElement.textContent = `@${userData.username}` || '@username';
        profileNameElement.textContent = userData.username || 'User Name';

        // Call updateProfilePicture to display profile picture or initial
        updateProfilePicture(userData.username); // Passing username to display initial or image
    } else {
        console.log("User not found:", userId);
    }

    // Fetch user statistics (questions, answers, likes)
    await loadUserStats(userId);

    // Fetch and display recent questions (limited to 10)
    await loadRecentQuestions(userId);
}

// Update profile picture or initial
function updateProfilePicture(username) {
    const profilePictureElement = document.getElementById('profilePicture');
    const profileInitialElement = document.getElementById('profileInitial');
    const profileImageUrl = ''; // If you have an image URL from Firestore or Firebase Storage, replace this with it.

    if (profileImageUrl) {
        profilePictureElement.style.backgroundImage = `url(${profileImageUrl})`;
        profilePictureElement.style.backgroundSize = 'cover';
        profilePictureElement.style.backgroundPosition = 'center';
        profileInitialElement.style.display = 'none';
    } else {
        const initial = username ? username.charAt(0).toUpperCase() : 'U';
        profileInitialElement.textContent = initial;
        profileInitialElement.style.display = 'inline-block';
        profilePictureElement.style.backgroundImage = 'none';
    }
}

// Fetch user statistics (questions, answers, likes)
async function loadUserStats(userId) {
    const questionsRef = collection(db, "questions");
    const q = query(questionsRef, where("user_id", "==", userId));
    const querySnapshot = await getDocs(q);

    let questionsCount = 0;
    querySnapshot.forEach(() => {
        questionsCount++;
    });
    questionsCountElement.textContent = questionsCount;

    const answersRef = collection(db, "answers");
    const answersQuery = query(answersRef, where("user_id", "==", userId));
    const answersSnapshot = await getDocs(answersQuery);

    let answersCount = 0;
    answersSnapshot.forEach(() => {
        answersCount++;
    });
    answersCountElement.textContent = answersCount;

    const likesRef = collection(db, "likes");
    const likesQuery = query(likesRef, where("user_id", "==", userId));
    const likesSnapshot = await getDocs(likesQuery);

    let likesCount = 0;
    likesSnapshot.forEach(() => {
        likesCount++;
    });
    likesCountElement.textContent = likesCount;
}

// Fetch and display recent questions (limited to 10)
async function loadRecentQuestions(userId) {
    const questionsRef = collection(db, "questions");

    // Query to fetch questions by user_id, ordered by post_time in descending order (most recent first)
    const q = query(
        questionsRef,
        where("user_id", "==", userId),
        orderBy("post_time", "desc"), // Order by 'post_time' field in descending order
        limit(8) // Limit to 10 most recent questions
    );

    try {
        const querySnapshot = await getDocs(q);
        recentQuestionsElement.innerHTML = ''; // Clear previous questions

        if (querySnapshot.empty) {
            recentQuestionsElement.innerHTML = "<p>No recent questions to show.</p>";
        }

        querySnapshot.forEach((doc) => {
            const question = doc.data();
            const questionElement = document.createElement('div');
            questionElement.classList.add('bg-white', 'rounded', 'shadow-sm', 'p-3', 'mb-4');
            questionElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <a href="#" class="text-decoration-none text-primary fw-bold">${question.question_content}</a>
                    <span class="text-muted small">${question.likes || 0} likes</span>
                </div>
            `;
            recentQuestionsElement.appendChild(questionElement);
        });
    } catch (error) {
        console.error("Error fetching recent questions:", error);
    }
}

// Show recent questions when the "My Questions" button is clicked
myQuestionsBtn.addEventListener('click', () => {
    pageTitle.textContent = "My Questions"; // Change the header
    recentQuestionsContainer.classList.add('d-none'); // Hide recent questions
    myQuestionsContainer.classList.remove('d-none'); // Show my questions section
    settingsSection.classList.add('d-none'); // Hide settings section
    loadUserQuestions(); // Load user's questions
});

// Show settings section when the "Settings" button is clicked
settingsBtn.addEventListener('click', () => {
    settingsSection.classList.remove('d-none'); // Show settings section
    overlay.style.display = 'block'; // Show overlay

    // Hide other sections
    recentQuestionsContainer.classList.add('d-none');
    myQuestionsContainer.classList.add('d-none');
});

// Handle the "Delete Account" button click
deleteAccountBtn.addEventListener('click', async () => {
    const user = auth.currentUser;

    if (user) {
        try {
            // Perform the delete account logic (example: delete from Firestore, sign out the user, etc.)
            const userRef = doc(db, "users", user.uid);
            await deleteDoc(userRef); // Deleting user data from Firestore
            await signOut(auth); // Sign out the user
            console.log("Account deleted and user signed out.");
            window.location.href = 'login.html'; // Redirect to login page
        } catch (error) {
            console.error("Error deleting account:", error);
        }
    }
});

// Handle logout with confirmation
logoutButton.addEventListener('click', async () => {
    // Show confirmation dialog
    const isConfirmed = window.confirm("Are you sure you want to log out?");
    
    // If the user clicks "OK" (i.e., isConfirmed is true), proceed with logout
    if (isConfirmed) {
        await signOut(auth);
        window.location.href = '../index.html'; // Redirect to login page after logout
    }
    // If the user clicks "Cancel", do nothing
});

// Load and display user questions with comments and like count
async function loadUserQuestions() {
    const user = auth.currentUser;
    if (user) {
        const userId = user.uid;

        const questionsRef = collection(db, "questions");
        const q = query(questionsRef, where("user_id", "==", userId));

        const querySnapshot = await getDocs(q);

        myQuestionsElement.innerHTML = ''; // Clear previous questions

        if (querySnapshot.empty) {
            myQuestionsElement.innerHTML = "<p>You have not asked any questions yet.</p>";
        } else {
            querySnapshot.forEach(async (doc, index) => {
                const question = doc.data();
                const questionId = doc.id;

                // Get the likes count for this question
                const likesRef = collection(db, "likes");
                const likesQuery = query(likesRef, where("question_id", "==", questionId));
                const likesSnapshot = await getDocs(likesQuery);
                const likeCount = likesSnapshot.size;

                // Get the comments for this question
                const commentsRef = collection(db, "comments");
                const commentsQuery = query(commentsRef, where("question_id", "==", questionId));
                const commentsSnapshot = await getDocs(commentsQuery);

                // Map through the comments and ensure 'content' exists
                const comments = commentsSnapshot.docs.map(doc => {
                    const commentData = doc.data();
                    return commentData.content || "No content available"; // Use "content" instead of "comment_content"
                });

                const questionElement = document.createElement('div');
                questionElement.classList.add('bg-white', 'rounded', 'shadow-sm', 'p-3', 'mb-4');
                questionElement.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <a href="#" class="text-decoration-none text-primary fw-bold">${question.question_content}</a>
                        <span class="text-muted small">${likeCount} likes</span>
                    </div>
                `;

                // Display comments if available
                if (comments.length > 0) {
                    questionElement.innerHTML += `
                        <div class="mt-2">
                            <strong>Comments:</strong>
                            <ul>
                                ${comments.map(comment => `<li>${comment}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                } else {
                    // Display if no comments are available
                    questionElement.innerHTML += `
                        <div class="mt-2">
                            <strong>Comments:</strong>
                            <p>No comments yet.</p>
                        </div>
                    `;
                }

                // Add the close button above the first question card
                if (index === 0) {
                    const closeButton = createCloseButton();
                    questionElement.prepend(closeButton); // Add the "X" button before the first question card
                }

                myQuestionsElement.appendChild(questionElement);
            });
        }
    }
}

// Show recent questions when the "Dashboard" button is clicked
dashboardButton.addEventListener('click', () => {
    pageTitle.textContent = "Recent Questions"; // Change the page title to "Recent Questions"
    recentQuestionsContainer.classList.remove('d-none'); // Show recent questions
    myQuestionsContainer.classList.add('d-none'); // Hide my questions section
    settingsSection.classList.add('d-none'); // Hide settings section
    overlay.style.display = 'none'; // Hide overlay if settings are open
    loadRecentQuestions(auth.currentUser.uid); // Reload recent questions
});

// Close settings when overlay is clicked
overlay.addEventListener('click', () => {
    settingsSection.classList.add('d-none'); // Hide settings section
    overlay.style.display = 'none'; // Hide overlay
    recentQuestionsContainer.classList.remove('d-none'); // Show recent questions again
});
