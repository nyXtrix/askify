import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    orderBy,
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    updateDoc,
    onSnapshot,
    increment,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyBql-S9mse5HsyDnzclvnSGI5kn3MjWArw",
        authDomain: "like-tweet-38a79.firebaseapp.com",
        projectId: "like-tweet-38a79",
        storageBucket: "like-tweet-38a79.appspot.com",
        messagingSenderId: "976222867265",
        appId: "1:976222867265:web:4b0638a616a35c7e769bc0",
        measurementId: "G-LB8CPH3480",
    };

    // Initialize Firebase services
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    /**
     * Toggles the like status of a question.
     * @param {string} questionId - The ID of the question.
     * @param {HTMLElement} likeButton - The like button element.
     * @param {HTMLElement} likeCountSpan - The element displaying the like count.
     */
    async function toggleLike(questionId, likeButton, likeCountSpan) {
        const userId = auth.currentUser?.uid;

        if (!userId) {
            alert("You must be logged in to like.");
            return;
        }

        try {
            const likeRef = doc(db, "likes", `${questionId}_${userId}`);
            const likeSnap = await getDoc(likeRef);

            if (likeSnap.exists()) {
                // Unlike the question
                await deleteDoc(likeRef);
                likeButton.classList.remove("text-danger");
                likeButton.classList.add("text-muted");
                await updateDoc(doc(db, "questions", questionId), {
                    likes: increment(-1),
                });
                likeCountSpan.textContent = parseInt(likeCountSpan.textContent) - 1;
            } else {
                // Like the question
                await setDoc(likeRef, {
                    user_id: userId,
                    question_id: questionId,
                    createdAt: new Date().toISOString(),
                });
                likeButton.classList.remove("text-muted");
                likeButton.classList.add("text-danger");
                await updateDoc(doc(db, "questions", questionId), {
                    likes: increment(1),
                });
                likeCountSpan.textContent = parseInt(likeCountSpan.textContent) + 1;
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    }

    /**
     * Loads and renders questions from Firestore.
     */
    function setupQuestionListener() {
        const questionsList = document.getElementById("questionsList");

        onSnapshot(
            query(collection(db, "questions"), orderBy("post_time", "desc")),
            async (querySnapshot) => {
                questionsList.innerHTML = ""; // Clear existing questions

                querySnapshot.forEach(async (questionDoc) => {
                    const questionData = questionDoc.data();
                    const questionId = questionDoc.id;

                    // Fetch username
                    const userRef = doc(db, "users", questionData.user_id);
                    const userSnap = await getDoc(userRef);
                    const username = userSnap.exists() ? userSnap.data().username : "Unknown User";

                    // Create question element
                    const questionElement = document.createElement("div");
                    questionElement.classList.add("question", "border", "p-3", "mb-4", "rounded");
                    questionElement.innerHTML = `
                        <div class="d-flex align-items-center mb-2">
                            <div class="user-avatar me-2">
                                <img src="https://via.placeholder.com/40" alt="User" class="rounded-circle" />
                            </div>
                            <div class="username">${username}</div>
                        </div>
                        <p class="question-content mb-2">${questionData.question_content}</p>
                        <div class="question-footer d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <button class="btn p-0 border-0 like-btn text-muted" data-question-id="${questionId}">
                                    <i class="bi bi-heart fs-5"></i>
                                </button>
                                <span class="ms-2 like-count">${questionData.likes || 0}</span>
                            </div>
                            <button class="btn p-0 border-0 text-muted comment-btn" data-question-id="${questionId}">
                                <i class="bi bi-wechat fs-5"></i>
                            </button>
                        </div>
                    `;

                    questionsList.appendChild(questionElement);

                    // Handle like button
                    const likeButton = questionElement.querySelector(".like-btn");
                    const likeCountSpan = questionElement.querySelector(".like-count");

                    if (auth.currentUser) {
                        const likeRef = doc(db, "likes", `${questionId}_${auth.currentUser.uid}`);
                        const likeSnap = await getDoc(likeRef);
                        if (likeSnap.exists()) {
                            likeButton.querySelector("i").classList.add("text-danger");
                            likeButton.querySelector("i").classList.remove("text-muted");
                        }
                    }

                    likeButton.addEventListener("click", () => toggleLike(questionId, likeButton.querySelector("i"), likeCountSpan));

                    // Handle comment button
                    const commentButton = questionElement.querySelector(".comment-btn");
                    commentButton.addEventListener("click", () => {
                        window.location.href = `./pages/comments.html?questionId=${questionId}`;
                    });
                });
            }
        );
    }

    // Handle "Post Question" functionality
    document.getElementById("submitQuestion").addEventListener("click", async function () {
        const questionContent = document.getElementById("questionInput").value;

        if (!questionContent) {
            alert("Please enter a question.");
            return;
        }

        try {
            const userId = auth.currentUser?.uid;

            if (!userId) {
                alert("You must be logged in to post a question.");
                return;
            }

            const newQuestionRef = collection(db, "questions");

            // Create a new question object and save it to Firestore
            await setDoc(doc(newQuestionRef), {
                user_id: userId,
                question_content: questionContent,
                post_time: new Date(),
                likes: 0, // Initial likes count is 0
            });

            // Clear input field and hide ask section
            document.getElementById("questionInput").value = "";
            // document.getElementById("askSection").style.display = "none"; // Hide the ask section after posting

            alert("Your question has been posted!");
        } catch (error) {
            console.error("Error posting question:", error);
        }
    });

    // Monitor authentication state and load questions
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User signed in:", user);
            document.getElementById("askSection").style.display = "block"; // Show the ask section
            setupQuestionListener();
        } else {
            console.log("No user signed in.");
            document.getElementById("askSection").style.display = "none"; // Hide the ask section if not logged in
            setupQuestionListener();
        }
    });
});
