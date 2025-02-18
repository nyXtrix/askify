import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
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
    getDocs,
    where,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
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

    document.getElementById("askSection").style.display = "none"; 

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
                await deleteDoc(likeRef);
                likeButton.classList.remove("text-danger");
                likeButton.classList.add("text-muted");
                likeButton.querySelector("i").classList.remove("bi-heart-fill"); 
                likeButton.querySelector("i").classList.add("bi-heart");
                await updateDoc(doc(db, "questions", questionId), {
                    likes: increment(-1),
                });
                likeCountSpan.textContent = parseInt(likeCountSpan.textContent) - 1;
            } else {
                await setDoc(likeRef, {
                    user_id: userId,
                    question_id: questionId,
                    createdAt: new Date().toISOString(),
                });
                likeButton.classList.remove("text-muted");
                likeButton.classList.add("text-danger");
                likeButton.querySelector("i").classList.remove("bi-heart");
                likeButton.querySelector("i").classList.add("bi-heart-fill");
                await updateDoc(doc(db, "questions", questionId), {
                    likes: increment(1),
                });
                likeCountSpan.textContent = parseInt(likeCountSpan.textContent) + 1;
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    }
    document.getElementById('askQuestionButton').addEventListener('click', function() {
        const askSection = document.getElementById('askSection');
        const searchSection = document.getElementById('searchSection');
        const askQuestionButton = document.getElementById('askQuestionButton');

        searchSection.style.display = 'none'; 
        askSection.style.display = 'block'; 
        askQuestionButton.style.display = 'none';
    });

    document.getElementById('closeAskSection').addEventListener('click', function() {
        const askSection = document.getElementById('askSection');
        const searchSection = document.getElementById('searchSection');
        const askQuestionButton = document.getElementById('askQuestionButton');
        
        askSection.style.display = 'none'; 
        searchSection.style.display = 'block'; 
        askQuestionButton.style.display = 'block';
    });

    async function setupQuestionListener() {
        const questionsList = document.getElementById("questionsList");

        onSnapshot(
            query(collection(db, "questions"), orderBy("post_time", "desc")),
            async (querySnapshot) => {
                questionsList.innerHTML = "";

                querySnapshot.forEach(async (questionDoc) => {
                    const questionData = questionDoc.data();
                    const questionId = questionDoc.id;
                    console.log("Fetched question data:", questionData);

                    const userId = questionData.user_id;
                    if (typeof userId !== "string") {
                        console.error("Invalid user_id type:", userId);
                        return;
                    }

                    const userRef = doc(db, "users", userId);
                    const userSnap = await getDoc(userRef);

                    let username = "Unknown User";
                    if (userSnap.exists()) {
                        username = userSnap.data().username;
                        console.log("Fetched username:", username);
                    } else {
                        console.log("User not found for userId:", userId);
                    }

                    const questionElement = document.createElement("div");
                    questionElement.classList.add("question-card");
                    questionElement.innerHTML = ` 
                        <div class="question-card-header">
                            <!-- <div class="user-avatar me-2">
                                <img src="https://via.placeholder.com/40" alt="User" class="rounded-circle" />
                            </div> -->
                            <div class="username">@${username}</div>
                            <div class="dropdown ms-auto">
                                <button class="btn btn-link p-0" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                    <li class="edit-option"><a class="dropdown-item" href="#" data-action="edit">Edit</a></li>
                                    <li class="delete-option"><a class="dropdown-item" href="#" data-action="delete">Delete</a></li>
                                    <li><a class="dropdown-item" href="#" data-action="report">Report</a></li>
                                </ul>
                            </div>
                        </div>
                        <p class="question-content mb-2">${questionData.question_content}</p>
                        ${questionData.description_content
                            ? `<p class="question-description">${questionData.description_content}</p>`
                            : ""
                        }
                        <div class="question-card-footer">
                            <div class="d-flex align-items-center">
                                <button class="like-btn btn p-0 border-0 text-muted" data-question-id="${questionId}">
                                    <i class="bi bi-heart fs-5"></i>
                                </button>
                                <span class="like-count ms-2">${questionData.likes || 0}</span>
                            </div>
                            <button class="btn p-0 border-0 comment-btn text-muted" data-question-id="${questionId}">
                                <i class="bi bi-chat-square-dots fs-4"></i> 
                                <span class="comment-count">0</span> comments
                            </button>
                        </div>
                    `;
                    questionsList.appendChild(questionElement);

                    const editOption = questionElement.querySelector('.edit-option');
                    const deleteOption = questionElement.querySelector('.delete-option');
                    const reportOption = questionElement.querySelector('li:last-child');

                    if (auth.currentUser?.uid === userId) {
                        editOption.style.display = "none"; 
                        deleteOption.style.display = "block";
                    } else {
                        editOption.style.display = "none"; 
                        deleteOption.style.display = "none"; 
                        reportOption.style.display = "block"; 
                    }

                    const dropdownMenu = questionElement.querySelector('.dropdown-menu');
                    dropdownMenu.addEventListener("click", async function(event) {
                        const action = event.target.dataset.action;
                        switch(action) {
                            case "edit":
                                const newQuestionContent = prompt("Edit your question:", questionData.question_content);
                                if (newQuestionContent && newQuestionContent !== questionData.question_content) {
                                    await updateDoc(doc(db, "questions", questionId), {
                                        question_content: newQuestionContent,
                                    });
                                    alert("Your question has been updated!");
                                }
                                break;
                            case "delete":
                                const confirmDelete = confirm("Are you sure you want to delete this question?");
                                if (confirmDelete) {
                                    await deleteDoc(doc(db, "questions", questionId));
                                    alert("Your question has been deleted!");
                                }
                                break;
                            case "report":
                                const reportRef = collection(db, "reported_questions");
                                await setDoc(doc(reportRef), {
                                    question_id: questionId,
                                    user_id: auth.currentUser.uid,
                                    reported_at: new Date(),
                                });
                                alert("This question has been reported!");
                                break;
                            default:
                                console.log("Unknown action:", action);
                        }
                    });

                    
                    const likeButton = questionElement.querySelector(".like-btn");
                    const likeCountSpan = questionElement.querySelector(".like-count");

                    if (auth.currentUser) {
                        const likeRef = doc(
                            db,
                            "likes",
                            `${questionId}_${auth.currentUser.uid}`
                        );
                        const likeSnap = await getDoc(likeRef);
                        if (likeSnap.exists()) {
                            likeButton.querySelector("i").classList.add("text-danger");
                            likeButton.querySelector("i").classList.remove("text-muted");
                            likeButton.querySelector("i").classList.add("bi-heart-fill"); 
                            likeButton.querySelector("i").classList.remove("bi-heart");
                        }
                    }

                    likeButton.addEventListener("click", () =>
                        toggleLike(questionId, likeButton, likeCountSpan)
                    );
                    const commentButton = questionElement.querySelector(".comment-btn");
                    const commentCountSpan = questionElement.querySelector(".comment-count");

                    const commentsQuery = query(
                        collection(db, "comments"),
                        where("question_id", "==", questionId)
                    );
                    onSnapshot(commentsQuery, (commentsSnapshot) => {
                        const commentCount = commentsSnapshot.size;
                        commentCountSpan.textContent = commentCount;
                    });

                    commentButton.addEventListener("click", () => {
                        window.location.href = `./pages/comments.html?questionId=${questionId}`;
                    });
                });
            }
        );
    }

    document
        .getElementById("showDescription")
        .addEventListener("change", function () {
            const descriptionInput = document.getElementById("descriptionInput");
            if (this.checked) {
                descriptionInput.style.display = "block";
            } else {
                descriptionInput.style.display = "none";
            }
        });

    document
        .getElementById("submitQuestion")
        .addEventListener("click", async function () {
            const questionContent = document.getElementById("questionInput").value;
            const descriptionContent =
                document.getElementById("descriptionInput").value;

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

                await setDoc(doc(newQuestionRef), {
                    user_id: userId,
                    question_content: questionContent,
                    description_content: descriptionContent || "",
                    post_time: new Date(),
                    likes: 0, 
                });

                document.getElementById("questionInput").value = "";
                document.getElementById("descriptionInput").value = "";

                alert("Your question has been posted!");
            } catch (error) {
                console.error("Error posting question:", error);
            }
        });

    // Initialize the question listener when the page loads
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User signed in:", user);
            setupQuestionListener(); 
        } else {
            console.log("No user signed in.");
            setupQuestionListener(); 
        }
    });


    // document.getElementById("searchInput").addEventListener("input", function () {
    //     const queryTerm = this.value.trim().toLowerCase();
    //     if (queryTerm.length > 0) {
    //         searchQuestions(queryTerm);
    //     } else {
    //         // If search term is empty, show all questions
    //         setupQuestionListener();
    //     }
    // });

    // function searchQuestions(queryTerm) {
    //     const questionsList = document.getElementById("questionsList");

    //     const questionsQuery = query(
    //         collection(db, "questions"),
    //         orderBy("post_time", "desc"),
    //         where("question_content", ">=", queryTerm),
    //         where("question_content", "<=", queryTerm + "\uf8ff")
    //     );
    //     onSnapshot(questionsQuery, async (querySnapshot) => {
    //         questionsList.innerHTML = ""; 

    //         querySnapshot.forEach(async (questionDoc) => {
    //             const questionData = questionDoc.data();
    //             const questionId = questionDoc.id;

    //             const questionElement = document.createElement("div");
    //             questionElement.classList.add("question-card");
    //             questionElement.innerHTML = ` 
    //                 <div class="question-card-header">
    //                     <div class="user-avatar me-2">
    //                         <img src="https://via.placeholder.com/40" alt="User" class="rounded-circle" />
    //                     </div>
    //                     <div class="username">${questionData.username}</div>
    //                 </div>
    //                 <p class="question-content mb-2">${questionData.question_content}</p>
    //                 ${questionData.description_content ? `<p class="question-description">${questionData.description_content}</p>` : ""}
    //                 <div class="question-card-footer">
    //                     <div class="d-flex align-items-center">
    //                         <button class="like-btn btn p-0 border-0 text-muted" data-question-id="${questionId}">
    //                             <i class="bi bi-heart fs-5"></i>
    //                         </button>
    //                         <span class="like-count ms-2">${questionData.likes || 0}</span>
    //                     </div>
    //                     <button class="btn p-0 border-0 comment-btn text-muted" data-question-id="${questionId}">
    //                         <i class="bi bi-chat-square-dots fs-4"></i> 
    //                         <span class="comment-count">0</span> comments
    //                     </button>
    //                 </div>
    //             `;
    //             questionsList.appendChild(questionElement);

    //         });
    //     });
    // }
});
