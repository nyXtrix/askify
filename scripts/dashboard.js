import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy, limit, deleteDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBQHh2-bc-PqCgxnxSz5ea9XD8WKUFmI60",
    authDomain: "askify-4424d.firebaseapp.com",
    projectId: "askify-4424d",
    storageBucket: "askify-4424d.firebasestorage.app",
    messagingSenderId: "37659707490",
    appId: "1:37659707490:web:ef22a078102ce9cd0ca93b",
    measurementId: "G-HEQ098XY8L",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
const dashboardButton = document.getElementById('dashboardBtn'); 
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
        myQuestionsContainer.classList.add('d-none'); 
        recentQuestionsContainer.classList.remove('d-none');
    });
    return closeBtn;
}


onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User signed in:", user);
        await loadUserData(user);
    } else {
        console.log("No user signed in.");
        window.location.href = './index.html'; 
    }
});

async function loadUserData(user) {
    const userId = user.uid;
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log("Fetched user data:", userData);
        usernameElement.textContent = `@${userData.username}` || 'User Name';
        userHandleElement.textContent = `@${userData.username}` || '@username';
        profileNameElement.textContent = userData.username || 'User Name';

        updateProfilePicture(userData.username); 
    } else {
        console.log("User not found:", userId);
    }

    await loadUserStats(userId);
    await loadRecentQuestions(userId);
}

function updateProfilePicture(username) {
    const profilePictureElement = document.getElementById('profilePicture');
    const profileInitialElement = document.getElementById('profileInitial');
    const profileImageUrl = ''; 

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

async function loadRecentQuestions(userId) {
    const questionsRef = collection(db, "questions");

    const q = query(
        questionsRef,
        where("user_id", "==", userId),
        orderBy("post_time", "desc"), 
        limit(8)
    );

    try {
        const querySnapshot = await getDocs(q);
        recentQuestionsElement.innerHTML = '';

        if (querySnapshot.empty) {
            recentQuestionsElement.innerHTML = "<p>No recent questions to show.</p>";
        }

        querySnapshot.forEach((doc) => {
            const question = doc.data();
            const questionElement = document.createElement('div');
            questionElement.classList.add('bg-white', 'rounded', 'shadow-sm', 'p-3', 'mb-4');
            questionElement.innerHTML = 
                `<div class="d-flex justify-content-between align-items-center">
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


myQuestionsBtn.addEventListener('click', () => {
    pageTitle.textContent = "My Questions";
    recentQuestionsContainer.classList.add('d-none'); 
    myQuestionsContainer.classList.remove('d-none'); 
    settingsSection.classList.add('d-none'); 
    loadUserQuestions(); 
});

// Show settings section when the "Settings" button is clicked
// settingsBtn.addEventListener('click', () => {
//     settingsSection.classList.remove('d-none'); // Show settings section
//     overlay.style.display = 'block'; // Show overlay

//     // Hide other sections
//     recentQuestionsContainer.classList.add('d-none');
//     myQuestionsContainer.classList.add('d-none');
// });


deleteAccountBtn.addEventListener('click', async () => {
    const user = auth.currentUser;

    if (user) {
        try {
            const userRef = doc(db, "users", user.uid);
            await deleteDoc(userRef); 
            await signOut(auth); 
            console.log("Account deleted and user signed out.");
            window.location.href = '../index.html'; 
        } catch (error) {
            console.error("Error deleting account:", error);
        }
    }
});

logoutButton.addEventListener('click', async () => {
    const isConfirmed = window.confirm("Are you sure you want to log out?");
    if (isConfirmed) {
        await signOut(auth);
        window.location.href = '../index.html'; 
    }
});

async function loadUserQuestions() {
    const user = auth.currentUser;
    if (user) {
        const userId = user.uid;

        const questionsRef = collection(db, "questions");
        const q = query(questionsRef, where("user_id", "==", userId));

        const querySnapshot = await getDocs(q);

        myQuestionsElement.innerHTML = ''; 

        if (querySnapshot.empty) {
            myQuestionsElement.innerHTML = "<p>You have not asked any questions yet.</p>";
        } else {
            querySnapshot.forEach(async (doc, index) => {
                const question = doc.data();
                const questionId = doc.id;

                const likesRef = collection(db, "likes");
                const likesQuery = query(likesRef, where("question_id", "==", questionId));
                const likesSnapshot = await getDocs(likesQuery);
                const likeCount = likesSnapshot.size; 

                const commentsRef = collection(db, "comments");
                const commentsQuery = query(commentsRef, where("question_id", "==", questionId));
                const commentsSnapshot = await getDocs(commentsQuery);

                const comments = commentsSnapshot.docs.map(doc => {
                    const commentData = doc.data();
                    return commentData.content || "No content available";
                });

                const questionElement = document.createElement('div');
                questionElement.classList.add('bg-white', 'rounded', 'shadow-sm', 'p-3', 'mb-4');
                questionElement.innerHTML = 
                    `<div class="d-flex justify-content-between align-items-center">
                        <a href="#" class="text-decoration-none text-primary fw-bold">${question.question_content}</a>
                        <span class="text-muted small">${likeCount} likes</span> <!-- Displaying likes count -->
                    </div>
                `;

                if (comments.length > 0) {
                    questionElement.innerHTML += 
                        `<div class="mt-2">
                            <strong>Comments:</strong>
                            <ul>
                                ${comments.map(comment => `<li>${comment}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                } else {
                    questionElement.innerHTML += 
                        `<div class="mt-2">
                            <strong>Comments:</strong>
                            <p>No comments yet.</p>
                        </div>
                    `;
                }

                if (index === 0) {
                    const closeButton = createCloseButton();
                    questionElement.prepend(closeButton); 
                }

                myQuestionsElement.appendChild(questionElement);
            });
        }
    }
}

dashboardButton.addEventListener('click', () => {
    pageTitle.textContent = "Recent Questions"; 
    recentQuestionsContainer.classList.remove('d-none'); 
    myQuestionsContainer.classList.add('d-none'); 
    settingsSection.classList.add('d-none'); 
    overlay.style.display = 'none';
    loadRecentQuestions(auth.currentUser.uid);
});
overlay.addEventListener('click', () => {
    settingsSection.classList.add('d-none'); 
    overlay.style.display = 'none'; 
    recentQuestionsContainer.classList.remove('d-none');
});