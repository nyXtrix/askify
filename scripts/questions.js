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
    // Firebase initialization
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

    // Hide Ask Section initially
    document.getElementById("askSection").style.display = "none"; // Hide by default

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
                // Unlike the question (remove like)
                await deleteDoc(likeRef);
                likeButton.classList.remove("text-danger");
                likeButton.classList.add("text-muted");
                likeButton.querySelector("i").classList.remove("bi-heart-fill"); // Change to empty heart
                likeButton.querySelector("i").classList.add("bi-heart");
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
                likeButton.querySelector("i").classList.remove("bi-heart");
                likeButton.querySelector("i").classList.add("bi-heart-fill"); // Change to filled heart
                await updateDoc(doc(db, "questions", questionId), {
                    likes: increment(1),
                });
                likeCountSpan.textContent = parseInt(likeCountSpan.textContent) + 1;
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    }

    // Toggle the "Ask Section" visibility when the "Ask Question" button is clicked
    document.getElementById('askQuestionButton').addEventListener('click', function() {
        const askSection = document.getElementById('askSection');
        const searchSection = document.getElementById('searchSection');
        const askQuestionButton = document.getElementById('askQuestionButton');
        
        // Hide Search Section
        searchSection.style.display = 'none'; 

        // Show Ask Section
        askSection.style.display = 'block'; 

        // Hide Ask Question button
        askQuestionButton.style.display = 'none';
    });

    // Close the "Ask Section" when the close icon is clicked
    document.getElementById('closeAskSection').addEventListener('click', function() {
        const askSection = document.getElementById('askSection');
        const searchSection = document.getElementById('searchSection');
        const askQuestionButton = document.getElementById('askQuestionButton');
        
        // Hide Ask Section
        askSection.style.display = 'none'; 

        // Show Search Section
        searchSection.style.display = 'block'; 

        // Show Ask Question button
        askQuestionButton.style.display = 'block';
    });

    /**
     * Loads and renders questions from Firestore.
     */
    async function setupQuestionListener() {
        const questionsList = document.getElementById("questionsList");

        onSnapshot(
            query(collection(db, "questions"), orderBy("post_time", "desc")),
            async (querySnapshot) => {
                questionsList.innerHTML = ""; // Clear existing questions

                querySnapshot.forEach(async (questionDoc) => {
                    const questionData = questionDoc.data();
                    const questionId = questionDoc.id;
                    console.log("Fetched question data:", questionData);

                    // Ensure user_id is a string
                    const userId = questionData.user_id;
                    if (typeof userId !== "string") {
                        console.error("Invalid user_id type:", userId);
                        return; // Skip this question if user_id is not a string
                    }

                    // Fetch username for the question
                    const userRef = doc(db, "users", userId);
                    const userSnap = await getDoc(userRef);

                    let username = "Unknown User"; // Default username
                    if (userSnap.exists()) {
                        username = userSnap.data().username;
                        console.log("Fetched username:", username); // Debugging log
                    } else {
                        console.log("User not found for userId:", userId); // Debugging log
                    }

                    // Create question element
                    const questionElement = document.createElement("div");
                    questionElement.classList.add("question-card");
                    questionElement.innerHTML = ` 
                        <div class="question-card-header">
                            <!-- <div class="user-avatar me-2">
                                <img src="https://via.placeholder.com/40" alt="User" class="rounded-circle" />
                            </div> -->
                            <div class="username">${username}</div>
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

                    // Show/hide edit and delete options based on ownership
                    const editOption = questionElement.querySelector('.edit-option');
                    const deleteOption = questionElement.querySelector('.delete-option');
                    const reportOption = questionElement.querySelector('li:last-child');

                    if (auth.currentUser?.uid === userId) {
                        editOption.style.display = "block"; // Allow edit for the owner
                        deleteOption.style.display = "block"; // Allow delete for the owner
                    } else {
                        editOption.style.display = "none"; // Hide edit for others
                        deleteOption.style.display = "none"; // Hide delete for others
                        reportOption.style.display = "block"; // Always show report for others
                    }

                    // Handle Edit, Delete, and Report actions
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

                    // Handle like button
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
                            likeButton.querySelector("i").classList.add("bi-heart-fill"); // Make heart filled
                            likeButton.querySelector("i").classList.remove("bi-heart");
                        }
                    }

                    likeButton.addEventListener("click", () =>
                        toggleLike(questionId, likeButton, likeCountSpan)
                    );

                    // Handle comment button and update comment count in real-time
                    const commentButton = questionElement.querySelector(".comment-btn");
                    const commentCountSpan = questionElement.querySelector(".comment-count");

                    const commentsQuery = query(
                        collection(db, "comments"),
                        where("question_id", "==", questionId)
                    );

                    // Real-time listener for comment count
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
            // If the checkbox is checked, show the description input field
            if (this.checked) {
                descriptionInput.style.display = "block";
            } else {
                descriptionInput.style.display = "none";
            }
        });

    // Handle "Post Question" functionality
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

                // Create a new question object and save it to Firestore, including description if present
                await setDoc(doc(newQuestionRef), {
                    user_id: userId,
                    question_content: questionContent,
                    description_content: descriptionContent || "", // Store description only if provided
                    post_time: new Date(),
                    likes: 0, // Initial like count
                });

                // Clear inputs after posting the question
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
            setupQuestionListener(); // Start listening to questions once the user is authenticated
        } else {
            console.log("No user signed in.");
            setupQuestionListener(); // Start listening even if no user is signed in
        }
    });

    // Real-time Search functionality
    document.getElementById("searchInput").addEventListener("input", function () {
        const queryTerm = this.value.trim().toLowerCase();
        if (queryTerm.length > 0) {
            searchQuestions(queryTerm);
        } else {
            // If search term is empty, show all questions
            setupQuestionListener();
        }
    });

    // Function for real-time search filtering
    function searchQuestions(queryTerm) {
        const questionsList = document.getElementById("questionsList");

        const questionsQuery = query(
            collection(db, "questions"),
            orderBy("post_time", "desc"),
            where("question_content", ">=", queryTerm),
            where("question_content", "<=", queryTerm + "\uf8ff")
        );

        // Listen for real-time updates and render questions
        onSnapshot(questionsQuery, async (querySnapshot) => {
            questionsList.innerHTML = ""; // Clear existing questions

            querySnapshot.forEach(async (questionDoc) => {
                const questionData = questionDoc.data();
                const questionId = questionDoc.id;

                // Create question element
                const questionElement = document.createElement("div");
                questionElement.classList.add("question-card");
                questionElement.innerHTML = ` 
                    <div class="question-card-header">
                        <div class="user-avatar me-2">
                            <img src="https://via.placeholder.com/40" alt="User" class="rounded-circle" />
                        </div>
                        <div class="username">${questionData.username}</div>
                    </div>
                    <p class="question-content mb-2">${questionData.question_content}</p>
                    ${questionData.description_content ? `<p class="question-description">${questionData.description_content}</p>` : ""}
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

                // Handle like button, comment button, etc. (same as your existing code)
            });
        });
    }
});
