import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, onSnapshot, addDoc, updateDoc, increment, deleteDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

const urlParams = new URLSearchParams(window.location.search);
const questionId = urlParams.get("questionId");

const questionDetailsDiv = document.getElementById("questionDetails");
const commentsListDiv = document.getElementById("commentsList");
const addCommentSection = document.getElementById("addCommentSection");
const commentInput = document.getElementById("commentInput");
const postCommentButton = document.getElementById("postCommentButton");

async function loadQuestionDetails() {
    try {
        const questionRef = doc(db, "questions", questionId);
        const questionSnap = await getDoc(questionRef);

        if (questionSnap.exists()) {
            const questionData = questionSnap.data();
            const userRef = doc(db, "users", questionData.user_id);
            const userSnap = await getDoc(userRef);
            const username = userSnap.exists() ? userSnap.data().username : "Unknown User";
            let descriptionHTML = "";
            if (questionData.description_content) {
                descriptionHTML = `<p><strong>Description:</strong> ${questionData.description_content}</p>`;
            }

            questionDetailsDiv.innerHTML = `
                <div class="question border p-3 rounded">
                    <p><strong>Asked by: </strong><strong style="color:#3083fd">@${username}</strong></p>
                    <p class="question-content mb-2"><strong>Question: </strong>${questionData.question_content}</p>
                    ${descriptionHTML} <!-- Add description if available -->
                    <div class="d-flex justify-content-between">
                        <span><i class="bi bi-heart-fill text-danger"></i> ${questionData.likes} Likes</span>
                    </div>
                </div>
            `;
        } else {
            questionDetailsDiv.innerHTML = `<div class="alert alert-danger">Question not found!</div>`;
        }
    } catch (error) {
        console.error("Error loading question details:", error);
        questionDetailsDiv.innerHTML = `<div class="alert alert-danger">Failed to load question details. Please try again later.</div>`;
    }
}

function loadComments() {
    const commentsQuery = query(collection(db, "comments"), where("question_id", "==", questionId));

    onSnapshot(commentsQuery, async (querySnapshot) => {
        commentsListDiv.innerHTML = "";

        for (const commentDoc of querySnapshot.docs) {
            const commentData = commentDoc.data();
            const commentId = commentDoc.id;

            try {
                const userRef = doc(db, "users", commentData.user_id);
                const userSnap = await getDoc(userRef);
                const username = userSnap.exists() ? userSnap.data().username : "Unknown User";

                const commentElement = document.createElement("div");
                commentElement.classList.add("comment", "border", "p-2", "mb-2", "rounded");

                commentElement.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="username">@${username}</span>
                        <button class="btn p-0 border-0 more-options-btn text-muted" data-comment-id="${commentId}">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                    </div>
                    <p class="comment-content">${commentData.content}</p>
                    <div class="more-options-menu d-none" data-comment-id="${commentId}">
                        <button class="btn p-0 border-0 delete-btn ">Delete</button>
                        <button class="btn p-0 border-0 report-btn ">Report</button>
                    </div>
                `;

                commentsListDiv.appendChild(commentElement);

                const moreOptionsButton = commentElement.querySelector(".more-options-btn");
                const moreOptionsMenu = commentElement.querySelector(".more-options-menu");
                const deleteButton = commentElement.querySelector(".delete-btn");
                const reportButton = commentElement.querySelector(".report-btn");

                moreOptionsButton.addEventListener("click", (event) => {
                    const allMenus = document.querySelectorAll(".more-options-menu");
                    allMenus.forEach(menu => {
                        if (menu !== moreOptionsMenu) {
                            menu.classList.add("d-none");
                        }
                    });
                    moreOptionsMenu.classList.toggle("d-none");

                    const buttonRect = event.target.getBoundingClientRect();
                    const menuHeight = moreOptionsMenu.offsetHeight;
                    moreOptionsMenu.style.position = 'absolute';
                    moreOptionsMenu.style.left = `${buttonRect.left}px`;
                    moreOptionsMenu.style.top = `${buttonRect.bottom + window.scrollY}px`;
                });

                const currentUserId = auth.currentUser?.uid;
                if (currentUserId && commentData.user_id === currentUserId) {
                    deleteButton.style.display = "inline-block";
                    reportButton.style.display ="none"
                } else {
                    deleteButton.style.display = "none"; 
                }

                deleteButton.addEventListener("click", async () => {
                    if (commentData.user_id === currentUserId) {
                        const isConfirmed = window.confirm("Are you sure you want to delete this comment?");
                        
                        if (isConfirmed) {
                            try {
                                await deleteDoc(doc(db, "comments", commentId));
                                alert("Comment deleted successfully.");
                            } catch (error) {
                                console.error("Error deleting comment:", error);
                                alert("There was an error deleting the comment. Please try again.");
                            }
                        }
                    } else {
                        alert("You can only delete your own comments.");
                    }
                });
                
                reportButton.addEventListener("click", async () => {
                    alert("Comment reported. We will review it shortly.");
                });
            } catch (error) {
                console.error("Error loading comment user data:", error);
            }
        }
    });
}

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

    try {
        await addDoc(collection(db, "comments"), {
            question_id: questionId,
            user_id: userId,
            content: content,
            likes: 0,
            createdAt: new Date().toISOString(),
        });

        commentInput.value = ""; 
    } catch (error) {
        console.error("Error posting comment:", error);
        alert("There was an error posting your comment. Please try again.");
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        addCommentSection.classList.remove("d-none");
    } else {
        addCommentSection.classList.add("d-none");
    }
});

loadQuestionDetails();
loadComments();
