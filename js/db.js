import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';
import { getDatabase, ref as dbRef, push, set, onValue, query, orderByChild, equalTo } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js'; // Import Realtime Database functions

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA-M8XsFZaZPu_lBIx0TbqcmzhTXeHRjQM",
    authDomain: "ecommerceapp-dab53.firebaseapp.com",
    projectId: "ecommerceapp-dab53",
    storageBucket: "ecommerceapp-dab53.appspot.com",
    messagingSenderId: "429988301014",
    appId: "1:429988301014:web:4f09bb412b6cf0b4a82177",
    databaseURL: "https://ecommerceapp-dab53-default-rtdb.asia-southeast1.firebasedatabase.app", // Update the URL to the region-specific one
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getDatabase(app); // Initialize Realtime Database

// DOM elements
const signOutButton = document.getElementById('signOutButton');
const profileImage = document.getElementById('profileImage');
const uploadProfilePhoto = document.getElementById('uploadProfilePhoto');
const greetingMessage = document.getElementById('greetingMessage');
const transactionForm = document.getElementById('transactionForm');
const transactionTableBody = document.getElementById('transactionTableBody');
const searchInput = document.getElementById('searchInput');

// Check user authentication
onAuthStateChanged(auth, user => {
    if (user) {
        // User is signed in, show greeting and load profile
        showGreeting(user.displayName);
        loadProfilePhoto(user);
    } else {
        // User is not signed in, redirect to login
        window.location.href = 'login.html';
    }
});

// Function to display greeting message based on the time of day
function showGreeting(userName) {
    const hours = new Date().getHours();
    let greeting = 'Hello';

    if (hours < 12) {
        greeting = 'Good Morning';
    } else if (hours >= 12 && hours < 18) {
        greeting = 'Good Afternoon';
    } else {
        greeting = 'Good Evening';
    }

    // Show actual user name, or 'User' if name is missing
    greetingMessage.textContent = `${greeting}, ${userName || 'User'}!`;
}

// Function to load the user's profile photo
function loadProfilePhoto(user) {
    if (user.photoURL) {
        profileImage.src = user.photoURL;
    } else {
        profileImage.src = 'images/default.png'; // Default profile image if none
    }
}

// Handle profile photo upload and update
uploadProfilePhoto.addEventListener('change', async function () {
    const file = uploadProfilePhoto.files[0];

    if (file) {
        try {
            const storageRef = ref(storage, `profilePhotos/${auth.currentUser.uid}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Update user profile with new photo
            await updateProfile(auth.currentUser, { photoURL: downloadURL });
            profileImage.src = downloadURL; // Update the profile image on the page
            alert('Profile photo updated!');
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Failed to upload profile photo. Please try again.');
        }
    }
});

// Sign out functionality
signOutButton.addEventListener('click', async function () {
    try {
        await signOut(auth);
        window.location.href = 'login.html'; // Redirect to login page after signing out
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Failed to sign out. Please try again.');
    }
});

// Add Transaction to Realtime Database
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const transactionName = document.getElementById('transactionName').value;
    const transactionAmount = document.getElementById('transactionAmount').value;
    const transactionType = document.getElementById('transactionType').value;
    const transactionDate = document.getElementById('transactionDate').value;

    // Push new transaction to the database under the "transactions" node
    try {
        const transactionRef = push(dbRef(db, 'transactions'));
        await set(transactionRef, {
            name: transactionName,
            amount: parseFloat(transactionAmount),
            type: transactionType,
            date: transactionDate
        });

        alert('Transaction added successfully');
        loadTransactions(); // Reload the table after adding a transaction
    } catch (error) {
        console.error('Error adding transaction: ', error);
        alert('Failed to add transaction. Please try again.');
    }
});

// Load Transactions from Realtime Database
async function loadTransactions() {
    try {
        const transactionsRef = dbRef(db, 'transactions');
        onValue(transactionsRef, (snapshot) => {
            transactionTableBody.innerHTML = ''; // Clear table body before loading

            snapshot.forEach((childSnapshot) => {
                const transaction = childSnapshot.val();
                const row = `<tr>
                                <td>${transaction.name}</td>
                                <td>${transaction.amount}</td>
                                <td>${transaction.type}</td>
                                <td>${transaction.date}</td>
                            </tr>`;
                transactionTableBody.innerHTML += row;
            });
        });
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Search Transactions by Name
searchInput.addEventListener('input', async () => {
    const searchTerm = searchInput.value.toLowerCase();

    try {
        const transactionsQuery = query(
            dbRef(db, 'transactions'),
            orderByChild('name'),
            equalTo(searchTerm)
        );

        onValue(transactionsQuery, (snapshot) => {
            transactionTableBody.innerHTML = ''; // Clear table for search results

            snapshot.forEach((childSnapshot) => {
                const transaction = childSnapshot.val();
                const row = `<tr>
                                <td>${transaction.name}</td>
                                <td>${transaction.amount}</td>
                                <td>${transaction.type}</td>
                                <td>${transaction.date}</td>
                            </tr>`;
                transactionTableBody.innerHTML += row;
            });
        });
    } catch (error) {
        console.error('Error searching transactions:', error);
    }
});

// Load transactions when the page loads
window.onload = loadTransactions;
