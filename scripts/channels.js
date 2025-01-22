// Firebase configuration and initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js';

// Firebase Firestore Configuration (API Key 1)
const firestoreConfig = {
    apiKey: "AIzaSyBQHh2-bc-PqCgxnxSz5ea9XD8WKUFmI60",
    authDomain: "askify-4424d.firebaseapp.com",
    projectId: "askify-4424d",
    storageBucket: "askify-4424d.firebasestorage.app",
    messagingSenderId: "37659707490",
    appId: "1:37659707490:web:ef22a078102ce9cd0ca93b",
    measurementId: "G-HEQ098XY8L"
};

// Firebase Storage Configuration (API Key 2)
const storageConfig = {

    apiKey: "AIzaSyDjNXAfbq4kSRbAi7mh1FSHZeCo-dSFPOI",
    authDomain: "login-page-c40b9.firebaseapp.com",
    projectId: "login-page-c40b9",
    storageBucket: "login-page-c40b9.appspot.com",
    messagingSenderId: "514659604358",
    appId: "1:514659604358:web:e4a199ab402495c6aafe07"

};

// Initialize Firebase Firestore
const firestoreApp = initializeApp(firestoreConfig);
const db = getFirestore(firestoreApp);

// Initialize Firebase Storage
const storageApp = initializeApp(storageConfig, "storageApp");  // Create a secondary app for Storage
const storage = getStorage(storageApp);

// Elements from HTML
const createChannelForm = document.getElementById('createChannelForm');
const channelNameInput = document.getElementById('channelName');
const channelDescriptionInput = document.getElementById('channelDescription');
const channelImageInput = document.getElementById('channelImage');
const channelVisibilitySelect = document.getElementById('channelVisibility');
const imagePreview = document.getElementById('imagePreview');
const channelsList = document.getElementById('channelsList');
const createChannelSection = document.getElementById('createChannelSection');

// Show the create channel form
function showCreateChannelForm() {
    createChannelSection.style.display = 'block';
}
window.showCreateChannelForm = showCreateChannelForm;
window.previewImage = previewImage;

// Preview the uploaded image
function previewImage() {
    const file = channelImageInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = function () {
            imagePreview.src = reader.result;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Create a new channel and store it in Firestore
async function createChannel(event) {
    event.preventDefault();

    const channelName = channelNameInput.value.trim();
    const channelDescription = channelDescriptionInput.value.trim();
    const channelVisibility = channelVisibilitySelect.value;
    const channelImage = channelImageInput.files[0];

    if (!channelName || !channelDescription || !channelImage) {
        alert('Please fill in all fields.');
        return;
    }

    try {
        // Add the channel data to Firestore
        const imageUrl = await uploadImage(channelImage); // Upload the image and get the URL
        const docRef = await addDoc(collection(db, 'channels'), {
            name: channelName,
            description: channelDescription,
            visibility: channelVisibility,
            imageUrl: imageUrl,
            createdAt: new Date(),
        });

        // Reset the form
        createChannelForm.reset();
        imagePreview.style.display = 'none';

        // Close the create channel section
        createChannelSection.style.display = 'none';

        alert('Channel created successfully!');
        loadChannels();
    } catch (error) {
        console.error('Error creating channel:', error);
        alert('Error creating channel.');
    }
}

// Upload the channel image to Firebase Storage
async function uploadImage(imageFile) {
    const storageRef = ref(storage, 'channel_images/' + imageFile.name); // Create reference in Storage
    const uploadTask = uploadBytesResumable(storageRef, imageFile); // Upload the file

    // Wait for the upload to complete and get the download URL
    try {
        await uploadTask;
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL; // Return the URL of the uploaded image
    } catch (error) {
        console.error('Error uploading image:', error);
        throw new Error('Failed to upload image');
    }
}

// Fetch channels from Firestore and display them
async function loadChannels() {
    const q = query(collection(db, 'channels'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    channelsList.innerHTML = ''; // Clear existing channels

    querySnapshot.forEach((doc) => {
        const channelData = doc.data();
        const channelCard = createChannelCard(channelData);
        channelsList.appendChild(channelCard);
    });
}

// Create a card for each channel
function createChannelCard(channelData) {
    const card = document.createElement('div');
    card.classList.add('channel-card');
    card.innerHTML = `
        <img class="channel-img" src="${channelData.imageUrl}" alt="${channelData.name}">
        <div class="channel-content">
            <h5 class="channel-name">${channelData.name}</h5>
            <p class="channel-description">${channelData.description}</p>
            <p class="channel-visibility">Visibility: ${channelData.visibility}</p>
            <button class="btn btn-join">Join Channel</button>
        </div>
    `;
    return card;
}

// Event listeners
createChannelForm.addEventListener('submit', createChannel);

// Initial load of channels
loadChannels();
