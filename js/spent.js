import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getDatabase, ref as dbRef, onValue } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyA-M8XsFZaZPu_lBIx0TbqcmzhTXeHRjQM",
    authDomain: "ecommerceapp-dab53.firebaseapp.com",
    databaseURL: "https://ecommerceapp-dab53-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ecommerceapp-dab53",
    storageBucket: "ecommerceapp-dab53.appspot.com",
    messagingSenderId: "429988301014",
    appId: "1:429988301014:web:4f09bb412b6cf0b4a82177"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM elements
const signOutButton = document.getElementById('signOutButton');
const spentTableBody = document.getElementById('spentTableBody');
const totalSpentAmount = document.getElementById('totalSpentAmount');

// Sign out functionality
signOutButton.addEventListener('click', async function () {
    try {
        await signOut(auth);
        window.location.href = 'login.html'; // Redirect to login page after signing out
    } catch (error) {
        console.error('Error signing out:', error);
    }
});

// Load Spent Transactions from Realtime Database (specific to the user's UID)
onAuthStateChanged(auth, user => {
    if (user) {
        loadSpentTransactions(user.uid);
    } else {
        window.location.href = 'login.html'; // Redirect to login if not authenticated
    }
});

// Function to load spent transactions
function loadSpentTransactions(uid) {
    const transactionsRef = dbRef(db, `transactions/${uid}`);
    onValue(transactionsRef, (snapshot) => {
        spentTableBody.innerHTML = ''; // Clear table body before loading
        let totalSpent = 0; // Variable to hold total spent

        if (!snapshot.exists()) {
            spentTableBody.innerHTML = '<tr><td colspan="3">No spent transactions found.</td></tr>';
            return; // No data found for the user
        }

        snapshot.forEach((childSnapshot) => {
            const transaction = childSnapshot.val();

            // Only display spent transactions
            if (transaction && transaction.type === 'Spend') {
                const row = `<tr>
                                <td>${transaction.name}</td>
                                <td>${transaction.amount}</td>
                                <td>${transaction.date}</td>
                            </tr>`;
                spentTableBody.innerHTML += row;
                totalSpent += transaction.amount; // Accumulate total spent
            }
        });

        totalSpentAmount.textContent = totalSpent; // Display total spent amount
    });
}
