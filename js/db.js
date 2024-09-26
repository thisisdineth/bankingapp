import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';
import { getDatabase, ref as dbRef, push, set, onValue } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js'; // Firebase Database functions

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA-M8XsFZaZPu_lBIx0TbqcmzhTXeHRjQM",
    authDomain: "ecommerceapp-dab53.firebaseapp.com",
    databaseURL: "https://ecommerceapp-dab53-default-rtdb.asia-southeast1.firebasedatabase.app", // Update to region-specific URL
    projectId: "ecommerceapp-dab53",
    storageBucket: "ecommerceapp-dab53.appspot.com",
    messagingSenderId: "429988301014",
    appId: "1:429988301014:web:4f09bb412b6cf0b4a82177"
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
        loadTransactions(user.uid); // Load transactions only for the current user
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

// Add Transaction (specific to the user's UID)
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const transactionName = document.getElementById('transactionName').value.trim();
    const transactionAmount = document.getElementById('transactionAmount').value.trim();
    const transactionType = document.getElementById('transactionType').value;
    const transactionDate = document.getElementById('transactionDate').value;

    // Get the current user
    const user = auth.currentUser;

    if (user) {
        try {
            // Validate transaction data
            if (!transactionName || !transactionAmount || !transactionType || !transactionDate) {
                alert('Please fill in all fields.');
                return;
            }

            // Push new transaction under the current user's UID in the "transactions" node
            const transactionRef = push(dbRef(db, `transactions/${user.uid}`));
            await set(transactionRef, {
                name: transactionName || "Unnamed",
                amount: parseFloat(transactionAmount) || 0,
                type: transactionType || "Unknown",
                date: transactionDate || new Date().toISOString() // Set current date if not provided
            });

            alert('Transaction added successfully');
            loadTransactions(user.uid); // Reload the table after adding a transaction
        } catch (error) {
            console.error('Error adding transaction: ', error);
            alert('Failed to add transaction. Please try again.');
        }
    }
});

// Load Transactions from Realtime Database (specific to the user's UID)
async function loadTransactions(uid) {
    try {
        const transactionsRef = dbRef(db, `transactions/${uid}`);
        onValue(transactionsRef, (snapshot) => {
            transactionTableBody.innerHTML = ''; // Clear table body before loading

            if (!snapshot.exists()) {
                transactionTableBody.innerHTML = '<tr><td colspan="4">No transactions found.</td></tr>';
                return; // No data found for the user
            }

            snapshot.forEach((childSnapshot) => {
                const transaction = childSnapshot.val();

                // Only display if the data is valid (check for undefined)
                if (transaction && transaction.name && transaction.amount !== undefined && transaction.type && transaction.date) {
                    const row = `<tr>
                                    <td>${transaction.name}</td>
                                    <td>${transaction.amount}</td>
                                    <td>${transaction.type}</td>
                                    <td>${transaction.date}</td>
                                </tr>`;
                    transactionTableBody.innerHTML += row;
                }
            });
        });
    } catch (error) {
        console.error('Error loading transactions:', error);
        transactionTableBody.innerHTML = '<tr><td colspan="4">Error loading transactions.</td></tr>';
    }
}

// Search Transactions by Name (specific to the user's UID)
searchInput.addEventListener('input', async () => {
    const searchTerm = searchInput.value.toLowerCase();
    const user = auth.currentUser;

    if (user) {
        try {
            const transactionsRef = dbRef(db, `transactions/${user.uid}`);
            onValue(transactionsRef, (snapshot) => {
                transactionTableBody.innerHTML = ''; // Clear table for search results

                if (!snapshot.exists()) {
                    transactionTableBody.innerHTML = '<tr><td colspan="4">No transactions found.</td></tr>';
                    return;
                }

                snapshot.forEach((childSnapshot) => {
                    const transaction = childSnapshot.val();
                    if (transaction && transaction.name && transaction.name.toLowerCase().includes(searchTerm)) {
                        const row = `<tr>
                                        <td>${transaction.name}</td>
                                        <td>${transaction.amount}</td>
                                        <td>${transaction.type}</td>
                                        <td>${transaction.date}</td>
                                    </tr>`;
                        transactionTableBody.innerHTML += row;
                    }
                });

                // If no transactions match the search, display "No transactions found"
                if (transactionTableBody.innerHTML === '') {
                    transactionTableBody.innerHTML = '<tr><td colspan="4">No matching transactions found.</td></tr>';
                }
            });
        } catch (error) {
            console.error('Error searching transactions:', error);
            transactionTableBody.innerHTML = '<tr><td colspan="4">Error searching transactions.</td></tr>';
        }
    }
});

// Load transactions when the page loads
window.onload = () => {
    const user = auth.currentUser;
    if (user) {
        loadTransactions(user.uid);
    }
};
