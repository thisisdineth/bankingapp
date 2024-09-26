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
const incomeTableBody = document.getElementById('incomeTableBody');
const totalIncomeAmount = document.getElementById('totalIncomeAmount');

// Sign out functionality
signOutButton.addEventListener('click', async function () {
    try {
        await signOut(auth);
        window.location.href = 'login.html'; // Redirect to login page after signing out
    } catch (error) {
        console.error('Error signing out:', error);
    }
});

// Load Income Transactions from Realtime Database (specific to the user's UID)
onAuthStateChanged(auth, user => {
    if (user) {
        loadIncomeTransactions(user.uid);
    } else {
        window.location.href = 'login.html'; // Redirect to login if not authenticated
    }
});

// Function to load income transactions
function loadIncomeTransactions(uid) {
    const transactionsRef = dbRef(db, `transactions/${uid}`);
    onValue(transactionsRef, (snapshot) => {
        incomeTableBody.innerHTML = ''; // Clear table body before loading
        let totalIncome = 0; // Variable to hold total income

        if (!snapshot.exists()) {
            incomeTableBody.innerHTML = '<tr><td colspan="3">No income transactions found.</td></tr>';
            return; // No data found for the user
        }

        snapshot.forEach((childSnapshot) => {
            const transaction = childSnapshot.val();

            // Only display income transactions
            if (transaction && transaction.type === 'Income') {
                const row = `<tr>
                                <td>${transaction.name}</td>
                                <td>${transaction.amount}</td>
                                <td>${transaction.date}</td>
                            </tr>`;
                incomeTableBody.innerHTML += row;
                totalIncome += transaction.amount; // Accumulate total income
            }
        });

        totalIncomeAmount.textContent = totalIncome; // Display total income amount
    });
}
