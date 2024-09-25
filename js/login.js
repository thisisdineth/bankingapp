import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyA-M8XsFZaZPu_lBIx0TbqcmzhTXeHRjQM",
    authDomain: "ecommerceapp-dab53.firebaseapp.com",
    projectId: "ecommerceapp-dab53",
    storageBucket: "ecommerceapp-dab53.appspot.com",
    messagingSenderId: "429988301014",
    appId: "1:429988301014:web:4f09bb412b6cf0b4a82177"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Utility function to show the loading spinner
function showLoading(isLoading) {
    const spinner = document.getElementById('loadingSpinner');
    if (isLoading) {
        spinner.classList.remove('hidden');
    } else {
        spinner.classList.add('hidden');
    }
}

// Error display function
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
}

// Clear all error messages
function clearErrors() {
    document.getElementById('loginError').textContent = '';
    document.getElementById('signupError').textContent = '';
}

// Email and password validation
function validateEmailAndPassword(email, password) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return 'Please enter a valid email address.';
    }
    if (password.length < 8) {
        return 'Password must be at least 8 characters long.';
    }
    return '';
}

// Toggle password visibility
function togglePasswordVisibility(inputId, toggleButtonId) {
    const inputField = document.getElementById(inputId);
    const toggleButton = document.getElementById(toggleButtonId);
    toggleButton.addEventListener('click', function () {
        const type = inputField.getAttribute('type') === 'password' ? 'text' : 'password';
        inputField.setAttribute('type', type);
        toggleButton.textContent = type === 'password' ? 'Show' : 'Hide';
    });
}

togglePasswordVisibility('loginPassword', 'togglePassword');
togglePasswordVisibility('signupPassword', 'toggleSignupPassword');

// Sign-up functionality
document.getElementById('signupButton').addEventListener('click', async function () {
    clearErrors();
    const fullName = document.getElementById('signupFullName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const profilePhoto = document.getElementById('profilePhoto').files[0];

    const validationError = validateEmailAndPassword(email, password);
    if (validationError) {
        showError('signupError', validationError);
        return;
    }

    if (profilePhoto && profilePhoto.size > 2097152) { // 2MB size limit
        showError('signupError', "Profile photo must be less than 2MB");
        return;
    }

    showLoading(true);  // Show the loading spinner

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Send email verification (correct usage in Firebase 9)
        await sendEmailVerification(user);
        alert("Verification email sent! Please check your inbox.");

        // Simulate success sign-up message and redirect
        alert("Sign up successful!");
        window.location.href = "login.html"; // Redirect back to login page
    } catch (error) {
        showError('signupError', error.message);
    } finally {
        showLoading(false);  // Hide the loading spinner
    }
});

// Sign-in functionality
document.getElementById('loginButton').addEventListener('click', async function () {
    clearErrors();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const validationError = validateEmailAndPassword(email, password);
    if (validationError) {
        showError('loginError', validationError);
        return;
    }

    showLoading(true);  // Show the loading spinner

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Login success, now signed in.");
        window.location.href = "db.html"; // Redirect after successful login
    } catch (error) {
        showError('loginError', error.message);
    } finally {
        showLoading(false);  // Hide the loading spinner
    }
});

// Forgot password functionality
document.getElementById('forgotPassword').addEventListener('click', async function () {
    clearErrors();
    const email = document.getElementById('loginEmail').value;

    if (!email) {
        showError('loginError', "Please enter your email to reset the password.");
        return;
    }

    showLoading(true);  // Show the loading spinner

    try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset email sent! Check your inbox.");
    } catch (error) {
        showError('loginError', error.message);
    } finally {
        showLoading(false);  // Hide the loading spinner
    }
});

// Form toggling between sign-in and sign-up
document.getElementById('showSignup').addEventListener('click', function () {
    clearErrors();
    document.getElementById('sign-in-form').classList.add('hidden');
    document.getElementById('sign-up-form').classList.remove('hidden');
});

document.getElementById('showSignin').addEventListener('click', function () {
    clearErrors();
    document.getElementById('sign-up-form').classList.add('hidden');
    document.getElementById('sign-in-form').classList.remove('hidden');
});
