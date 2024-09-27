// Get references to HTML elements
const filterTypeSelect = document.getElementById('filterType');
const dateRangeSelect = document.getElementById('dateRange');
const searchInput = document.getElementById('searchInput');
const transactionTableBody = document.getElementById('transactionTableBody');

// Filter transactions based on type
filterTypeSelect.addEventListener('change', () => {
  const filterValue = filterTypeSelect.value.toLowerCase();
  const rows = document.querySelectorAll('#transactionTableBody tr');

  rows.forEach(row => {
    const typeCell = row.cells[2].textContent.toLowerCase(); // Assuming type is the third column
    if (filterValue === '' || typeCell.includes(filterValue)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
});

// Sort transactions by date range
dateRangeSelect.addEventListener('change', () => {
  const selectedRange = dateRangeSelect.value;
  const today = new Date();
  const rows = Array.from(document.querySelectorAll('#transactionTableBody tr'));

  // Filter rows based on selected date range
  rows.forEach(row => {
    const dateCell = new Date(row.cells[3].textContent); // Assuming date is the fourth column
    let isVisible = true;

    switch (selectedRange) {
      case 'today':
        isVisible = dateCell.toDateString() === today.toDateString();
        break;
      case 'thisWeek':
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay())); // Sunday
        isVisible = dateCell >= startOfWeek && dateCell <= new Date();
        break;
      case 'last30Days':
        const last30Days = new Date(today.setDate(today.getDate() - 30));
        isVisible = dateCell >= last30Days && dateCell <= new Date();
        break;
      default:
        isVisible = true; // Show all
    }

    row.style.display = isVisible ? '' : 'none';
  });
});

// Search Transactions by Name
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