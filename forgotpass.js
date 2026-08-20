// Firebase Auth Integration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Your Firebase Config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements
const forgotForm = document.getElementById('forgot-form');
const emailInput = document.getElementById('email');
const emailError = document.getElementById('email-error');
const resetBtn = document.getElementById('reset-btn');
const btnText = document.getElementById('btn-text');

const requestView = document.getElementById('request-view');
const successView = document.getElementById('success-view');
const sentEmailDisplay = document.getElementById('sent-email-display');
const resendBtn = document.getElementById('resend-btn');

// Submit Handler
forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();

    emailError.textContent = '';

    if (!email) {
        emailError.textContent = 'Email address is required.';
        return;
    }

    if (!validateEmail(email)) {
        emailError.textContent = 'Please enter a valid email address.';
        return;
    }

    // UI Loading State
    resetBtn.disabled = true;
    btnText.textContent = 'Sending...';

    try {
        // Send Firebase Password Reset Link
        await sendPasswordResetEmail(auth, email);
        
        // Show Success View
        sentEmailDisplay.textContent = email;
        requestView.classList.add('hidden');
        successView.classList.remove('hidden');

    } catch (error) {
        console.error("Error sending reset email:", error);
        
        // Handle Errors
        if (error.code === 'auth/user-not-found') {
            emailError.textContent = 'No account found with this email address.';
        } else {
            emailError.textContent = 'Failed to send reset email. Please try again.';
        }
    } finally {
        resetBtn.disabled = false;
        btnText.textContent = 'Send Reset Link';
    }
});

// Resend Email Handler
resendBtn.addEventListener('click', () => {
    successView.classList.add('hidden');
    requestView.classList.remove('hidden');
});

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}