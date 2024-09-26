import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getDatabase, ref as dbRef, set, push, onValue, get } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js';

// Firebase configuration
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

const monthNameElem = document.getElementById('monthName');
const totalIncomeElem = document.getElementById('totalIncome');
const totalSpendElem = document.getElementById('totalSpend');
const netAmountElem = document.getElementById('netAmount');
const transactionTableBody = document.getElementById('transactionTableBody');
const exportPdfButton = document.getElementById('exportPdfButton');
const monthNav = document.getElementById('monthNav');

const currentDate = new Date();
const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
const currentYear = currentDate.getFullYear();
const monthYear = `${currentMonth} ${currentYear}`;

// Set current month name
monthNameElem.textContent = `${currentMonth} ${currentYear}`;

// Initialize user state and load transactions
onAuthStateChanged(auth, user => {
    if (user) {
        loadMonthlySummary(user.uid, currentMonth, currentYear);
        loadPreviousMonths(user.uid);
    } else {
        window.location.href = 'login.html';
    }
});

// Load transactions for the current month
function loadMonthlySummary(uid, month, year) {
    const transactionsRef = dbRef(db, `transactions/${uid}/${year}/${month}`);
    let totalIncome = 0;
    let totalSpend = 0;
    transactionTableBody.innerHTML = '';

    onValue(transactionsRef, snapshot => {
        if (!snapshot.exists()) {
            totalIncomeElem.textContent = "0";
            totalSpendElem.textContent = "0";
            netAmountElem.textContent = "0";
            return;
        }

        snapshot.forEach(childSnapshot => {
            const transaction = childSnapshot.val();
            const amount = parseFloat(transaction.amount);

            if (transaction.type === "Income") {
                totalIncome += amount;
            } else if (transaction.type === "Spend") {
                totalSpend += amount;
            }

            // Add transaction to table
            const row = `<tr>
                            <td>${transaction.name}</td>
                            <td>${amount}</td>
                            <td class="${transaction.type === 'Income' ? 'green' : 'red'}">${transaction.type}</td>
                            <td>${transaction.date}</td>
                        </tr>`;
            transactionTableBody.innerHTML += row;
        });

        totalIncomeElem.textContent = totalIncome.toFixed(2);
        totalSpendElem.textContent = totalSpend.toFixed(2);
        netAmountElem.textContent = (totalIncome - totalSpend).toFixed(2);

        // Store the summary for the current month in Firebase
        set(dbRef(db, `monthlySummary/${uid}/${year}/${month}`), {
            totalIncome: totalIncome.toFixed(2),
            totalSpend: totalSpend.toFixed(2),
            netAmount: (totalIncome - totalSpend).toFixed(2),
            transactions: snapshot.val()
        });
    });
}

// Load previous months for the user
function loadPreviousMonths(uid) {
    const summaryRef = dbRef(db, `monthlySummary/${uid}`);

    onValue(summaryRef, snapshot => {
        monthNav.innerHTML = ''; // Clear previous data
        snapshot.forEach(yearSnapshot => {
            yearSnapshot.forEach(monthSnapshot => {
                const month = monthSnapshot.key;
                const year = yearSnapshot.key;

                const button = document.createElement('button');
                button.textContent = `${month} ${year}`;
                button.addEventListener('click', () => {
                    downloadMonthlyPdf(month, year, monthSnapshot.val());
                });

                monthNav.appendChild(button);
            });
        });
    });
}

// Function to download the monthly summary as PDF
function downloadMonthlyPdf(month, year, summary) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text(`Petty Cash Book Summary for ${month} ${year}`, 14, 10);
    doc.setFontSize(12);
    doc.text(`Total Income: ${summary.totalIncome}`, 14, 20);
    doc.text(`Total Spend: ${summary.totalSpend}`, 14, 30);
    doc.text(`Net Amount: ${summary.netAmount}`, 14, 40);

    const tableColumn = ["Name", "Amount", "Type", "Date"];
    const tableRows = [];

    for (let transactionId in summary.transactions) {
        const transaction = summary.transactions[transactionId];
        const row = [
            transaction.name,
            transaction.amount,
            transaction.type,
            transaction.date
        ];
        tableRows.push(row);
    }

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 50
    });

    doc.save(`${month}_${year}_summary.pdf`);
}

// Real-time PDF export for the current month
exportPdfButton.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text(`Petty Cash Book Summary for ${currentMonth} ${currentYear}`, 14, 10);
    doc.setFontSize(12);
    doc.text(`Total Income: ${totalIncomeElem.textContent}`, 14, 20);
    doc.text(`Total Spend: ${totalSpendElem.textContent}`, 14, 30);
    doc.text(`Net Amount: ${netAmountElem.textContent}`, 14, 40);

    const tableColumn = ["Name", "Amount", "Type", "Date"];
    const tableRows = [];

    transactionTableBody.querySelectorAll('tr').forEach(row => {
        const rowData = Array.from(row.children).map(td => td.textContent);
        tableRows.push(rowData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 50
    });

    doc.save(`${currentMonth}_${currentYear}_summary.pdf`);
});

// Sign out user
document.getElementById('signOutButton').addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'login.html';
    }).catch(error => {
        console.error('Sign out error', error);
    });
});
