import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, onSnapshot, addDoc, updateDoc, increment, deleteDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBql-S9mse5HsyDnzclvnSGI5kn3MjWArw",
    authDomain: "like-tweet-38a79.firebaseapp.com",
    projectId: "like-tweet-38a79",
    storageBucket: "like-tweet-38a79.appspot.com",
    messagingSenderId: "976222867265",
    appId: "1:976222867265:web:4b0638a616a35c7e769bc0",
    measurementId: "G-LB8CPH3480",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Get questionId from URL
const urlParams = new URLSearchParams(window.location.search);
const questionId = urlParams.get("questionId");

// DOM elements
const questionDetailsDiv = document.getElementById("questionDetails");
const commentsListDiv = document.getElementById("commentsList");
const addCommentSection = document.getElementById("addCommentSection");
const commentInput = document.getElementById("commentInput");
const postCommentButton = document.getElementById("postCommentButton");

// Fetch question details
async function loadQuestionDetails() {
    const questionRef = doc(db, "questions", questionId);
    const questionSnap = await getDoc(questionRef);

    if (questionSnap.exists()) {
        const questionData = questionSnap.data();

        questionDetailsDiv.innerHTML = `
            <div class="question border p-3 rounded">
                <p class="question-content mb-2">${questionData.question_content}</p>
                <div class="d-flex justify-content-between">
                    <span><i class="bi bi-heart-fill text-danger"></i> ${questionData.likes} Likes</span>
                </div>
            </div>
        `;
    } else {
        questionDetailsDiv.innerHTML = `<div class="alert alert-danger">Question not found!</div>`;
    }
}

// Load comments
function loadComments() {
    const commentsQuery = query(collection(db, "comments"), where("question_id", "==", questionId));

    onSnapshot(commentsQuery, async (querySnapshot) => {
        commentsListDiv.innerHTML = "";

        for (const commentDoc of querySnapshot.docs) {
            const commentData = commentDoc.data();
            const commentId = commentDoc.id;

            // Fetch username for the comment
            const userRef = doc(db, "users", commentData.user_id);
            const userSnap = await getDoc(userRef);
            const username = userSnap.exists() ? userSnap.data().username : "Unknown User";

            const commentElement = document.createElement("div");
            commentElement.classList.add("comment", "border", "p-2", "mb-2", "rounded");

            commentElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="username">${username}</span>
                    <button class="btn p-0 border-0 like-btn text-muted" data-comment-id="${commentId}">
                        <i class="bi bi-heart fs-6"></i> <span>${commentData.likes || 0}</span>
                    </button>
                </div>
                <p class="comment-content">${commentData.content}</p>
            `;

            commentsListDiv.appendChild(commentElement);

            // Handle like button for each comment
            const likeButton = commentElement.querySelector(".like-btn");
            const likeCountSpan = likeButton.querySelector("span");

            likeButton.addEventListener("click", async () => {
                const userId = auth.currentUser?.uid;
                if (!userId) {
                    alert("You must be logged in to like comments.");
                    return;
                }

                const likeRef = doc(db, "likes", `${commentId}_${userId}`);
                const likeSnap = await getDoc(likeRef);

                if (likeSnap.exists()) {
                    // Unlike the comment
                    await deleteDoc(likeRef);

                    likeButton.querySelector("i").classList.remove("text-danger");
                    likeCountSpan.textContent = parseInt(likeCountSpan.textContent) - 1;

                    await updateDoc(doc(db, "comments", commentId), {
                        likes: increment(-1),
                    });
                } else {
                    // Like the comment
                    await addDoc(likeRef, {
                        user_id: userId,
                        comment_id: commentId,
                        createdAt: new Date().toISOString(),
                    });

                    likeButton.querySelector("i").classList.add("text-danger");
                    likeCountSpan.textContent = parseInt(likeCountSpan.textContent) + 1;

                    await updateDoc(doc(db, "comments", commentId), {
                        likes: increment(1),
                    });
                }
            });
        }
    });
}

// Post a comment
postCommentButton.addEventListener("click", async () => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
        alert("You must be logged in to post comments.");
        return;
    }

    const content = commentInput.value.trim();

    if (!content) {
        alert("Comment cannot be empty.");
        return;
    }

    await addDoc(collection(db, "comments"), {
        question_id: questionId,
        user_id: userId,
        content: content,
        likes: 0,
        createdAt: new Date().toISOString(),
    });

    commentInput.value = ""; // Clear input field
});

// Check auth state to enable or disable comment input
onAuthStateChanged(auth, (user) => {
    if (user) {
        addCommentSection.classList.remove("d-none");
    } else {
        addCommentSection.classList.add("d-none");
    }
});

// Initialize page
loadQuestionDetails();
loadComments();
