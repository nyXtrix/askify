const firebaseConfig = {
  apiKey: "AIzaSyBql-S9mse5HsyDnzclvnSGI5kn3MjWArw",
  authDomain: "like-tweet-38a79.firebaseapp.com",
  projectId: "like-tweet-38a79",
  storageBucket: "like-tweet-38a79.firebasestorage.app",
  messagingSenderId: "976222867265",
  appId: "1:976222867265:web:4b0638a616a35c7e769bc0",
  measurementId: "G-LB8CPH3480"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Check if user is logged in and display the textarea and "Ask your Questions" section
auth.onAuthStateChanged(user => {
  const questionTextarea = document.getElementById("questionTextarea");
  const submitQuestionBtn = document.getElementById("submitQuestionBtn");
  const askQuestionsSection = document.getElementById("askQuestionsSection");

  if (user) {
      // User is logged in, show "Ask your Questions" section, textarea, and button
      askQuestionsSection.style.display = "block";
      questionTextarea.style.display = "block";
      submitQuestionBtn.style.display = "inline-block";
  } else {
      // User is not logged in, hide "Ask your Questions" section, textarea, and button
      askQuestionsSection.style.display = "none";
      questionTextarea.style.display = "none";
      submitQuestionBtn.style.display = "none";
  }
});

// Submit Question Function
function submitQuestion() {
  const questionContent = document.getElementById("questionTextarea").value;
  const user = auth.currentUser;

  if (questionContent && user) {
      // Create JSON object for question
      const question = {
          id: Date.now(), // Use timestamp as unique ID
          user_id: user.uid,
          tweet_content: questionContent,
          tweet_time: new Date().toISOString(),
          likes: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
      };

      // Add question to Firestore
      db.collection("questions").add(question)
          .then(() => {
              alert("Question posted successfully!");
              document.getElementById("questionTextarea").value = ""; // Clear textarea
          })
          .catch((error) => {
              console.error("Error posting question: ", error);
          });
  }
}