function submitTransaction() {
  var payer = document.getElementById('payer').value;
  var othersBill = parseFloat(document.getElementById('othersBill').value) || 0; 
  var totalBill = parseFloat(document.getElementById('totalBill').value) || 0;

  if (othersBill > totalBill) {
    Swal.fire({ // Use Swal for the error alert
      icon: 'error',
      title: 'Oops...',
      text: 'Bill yang ngutang kok lebih gede dari total bill nya?',
    });
  } else {
    console.log(othersBill);
    fetch(
      'https://script.google.com/macros/s/AKfycbyQCFlDHQP0SQ4tssjCAIA_zlYPin-0Py0caaa3cjB2LDlFCgxOjVRWZwWtWrCWGrI/exec?action=submitTransaction',
      {
        redirect: 'follow', 
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: new URLSearchParams({
          payer: payer,
          othersBill: othersBill,
          totalBill: totalBill,
        }),
      }
    )
      .then((data) => {
      console.log(data);
      refreshTransactionHistory();
      updateSummary();
      Swal.fire({ // Success message after submission
        icon: 'success',
        title: 'Transaction Submitted!',
        text: 'Your transaction has been successfully recorded.',
      });
    })
    .catch((error) => {
      console.error('Error submitting transaction:', error);
      Swal.fire({ // Error message if submission fails
        icon: 'error',
        title: 'Oops...',
        text: 'Something went wrong! Please try again.',
      });
    });
  }
}

function refreshTransactionHistory() {
Swal.fire({ // Loading indicator during settleUp
    title: 'Settling Up...',
    allowOutsideClick: false, // Prevent closing until done
    didOpen: () => {
      Swal.showLoading(); 
    },
  });
  fetch(
    'https://script.google.com/macros/s/AKfycbyQCFlDHQP0SQ4tssjCAIA_zlYPin-0Py0caaa3cjB2LDlFCgxOjVRWZwWtWrCWGrI/exec?action=getTransactionHistory',
    {
      redirect: 'follow',
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    }
  )
    .then((response) => response.json())
    .then((data) => {
      displayTransactionHistory(data);
Swal.close();
    })
    .catch((error) => {
      console.error('Error fetching transaction history:', error);
      Swal.close(); // Close the loading indicator in case of error
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Something went wrong while refreshing the transaction history. Please try again.',
      });
    });
}

function updateSummary() {
  Swal.fire({ // Loading indicator during update
    title: 'Updating Summary...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
  fetch(
    'https://script.google.com/macros/s/AKfycbyQCFlDHQP0SQ4tssjCAIA_zlYPin-0Py0caaa3cjB2LDlFCgxOjVRWZwWtWrCWGrI/exec?action=calculateSummary',
    {
      redirect: 'follow',
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    }
  )
    .then((response) => response.text())
    .then((summaryText) => {
      displaySummary(summaryText);
      Swal.close(); // Close the loading indicator
    })
    .catch((error) => {
      console.error('Error calculating summary:', error);
      Swal.close(); // Close the loading indicator in case of error
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Something went wrong while updating the summary. Please try again.',
      });
    });
}

function displayTransactionHistory(data) {
  var tableBody = document
    .getElementById('transactionTable')
    .getElementsByTagName('tbody')[0];
  tableBody.innerHTML = '';

  for (var i = 1; i < data.length; i++) {
    var row = tableBody.insertRow();
    row.setAttribute('data-row-index', i); 

    row.addEventListener('contextmenu', (event) => {
      event.preventDefault(); 
      confirmDelete(i); 
    });

    row.addEventListener('touchstart', handleTouchStart);
    row.addEventListener('touchend', handleTouchEnd);

    for (var j = 0; j < data[i].length; j++) {
      var cell = row.insertCell();
      if (j === 0) {
        var date = moment(data[i][j]); 
        var formattedDate = date.format('dddd DD/MM/YYYY HH:mm'); 
        cell.innerHTML = formattedDate;
      } else {
        cell.innerHTML = data[i][j];
      }
    }
  }
}

let touchStartTime;
const longPressDuration = 500; 

function handleTouchStart(event) {
  touchStartTime = new Date().getTime();
}

function handleTouchEnd(event) {
  const touchEndTime = new Date().getTime();
  if (touchEndTime - touchStartTime > longPressDuration) {
    const rowIndex = event.currentTarget.getAttribute('data-row-index');
    confirmDelete(rowIndex);
  }
}

function confirmDelete(rowIndex) {
  Swal.fire({ // Confirmation dialog for delete
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => { 
    if (result.isConfirmed) {
      deleteTransaction(rowIndex);    
    }
  }); 
}

function deleteTransaction(rowIndex) {
  fetch(`https://script.google.com/macros/s/AKfycbyQCFlDHQP0SQ4tssjCAIA_zlYPin-0Py0caaa3cjB2LDlFCgxOjVRWZwWtWrCWGrI/exec?action=deleteTransaction&rowIndex=${rowIndex}`, {
    method: 'POST', 
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
  })
  .then(data => {
    console.log(data); 
    refreshTransactionHistory();
    updateSummary();
    Swal.fire( // Success message after deletion
      'Deleted!',
      'Your transaction has been deleted.',
      'success'
    );
  })
  .catch(error => {
    console.error('Error deleting transaction:', error);
    Swal.fire({ // Error message if deletion fails
      icon: 'error',
      title: 'Oops...',
      text: 'Something went wrong! Please try again.',
    }); 
  });
}

function settleUp() {
  Swal.fire({ // Loading indicator during settleUp
    title: 'Settling Up...',
    allowOutsideClick: false, // Prevent closing until done
    didOpen: () => {
      Swal.showLoading(); 
    },
  });

  fetch('https://script.google.com/macros/s/AKfycbyQCFlDHQP0SQ4tssjCAIA_zlYPin-0Py0caaa3cjB2LDlFCgxOjVRWZwWtWrCWGrI/exec?action=settleUp', {
    method: 'POST', 
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
  })
  .then(data => {
    console.log(data);
    refreshTransactionHistory();
    updateSummary();
    Swal.close(); // Close the loading indicator
    Swal.fire( // Success message after settle up
      'Settled Up!',
      'All transactions have been settled.',
      'success'
    );
  })
  .catch(error => {
    console.error('Error settling up:', error);
    Swal.close(); // Close the loading indicator in case of error

    // Attempt to parse the error response as JSON
    if (error instanceof Response && error.headers.get('content-type').includes('application/json')) {
      error.json().then(errorData => {
        alert("Error settling up: " + errorData.error); // Display a user-friendly error message
      });
    } else {
      alert("An unexpected error occurred while settling up."); 
    }
  });
}

function displaySummary(summaryText) {
  document.getElementById('summaryText').innerHTML = summaryText;
}

// Initial calls to populate the UI
refreshTransactionHistory();
updateSummary();