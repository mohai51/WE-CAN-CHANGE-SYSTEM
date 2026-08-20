// Firebase SDK Version 10 Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const googleProvider = new GoogleAuthProvider();

// DOM Elements
const roleBtns = document.querySelectorAll('.role-btn');
const selectedRoleInput = document.getElementById('selected-role');
const submitBtnText = document.getElementById('submit-btn-text');
const googleBtnText = document.getElementById('google-btn-text');
const registerLink = document.getElementById('register-link'); // Registration Link Element

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const togglePassword = document.getElementById('toggle-password');
const googleBtn = document.getElementById('google-login-btn');

// 1. Handle Role Switching Tabs & Dynamic Link Update
roleBtns.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        roleBtns.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Get selected role (volunteer / donor / beneficiary)
        const role = button.getAttribute('data-role');
        selectedRoleInput.value = role;
        
        // Capitalize role name for UI text update
        const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);
        
        // Dynamic Button Text Updates
        submitBtnText.textContent = `Sign In as ${formattedRole}`;
        googleBtnText.textContent = `Continue as ${formattedRole} with Google`;
        
        // Dynamic Registration Link Update
        registerLink.href = `${role}-reg.html`;
    });
});

// 2. Password Visibility Toggle
togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
});

// 3. Form Validation & Submission
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let isValid = true;

    emailError.textContent = '';
    passwordError.textContent = '';

    if (!emailInput.value.trim()) {
        emailError.textContent = 'Email address is required.';
        isValid = false;
    } else if (!validateEmail(emailInput.value)) {
        emailError.textContent = 'Please enter a valid email address.';
        isValid = false;
    }

    if (!passwordInput.value) {
        passwordError.textContent = 'Password is required.';
        isValid = false;
    } else if (passwordInput.value.length < 6) {
        passwordError.textContent = 'Password must be at least 6 characters.';
        isValid = false;
    }

    if (isValid) {
        const currentRole = selectedRoleInput.value;
        console.log(`Logging in as [${currentRole}]:`, { email: emailInput.value });
        
        alert(`Successfully logged in as ${currentRole.toUpperCase()}!`);
        // window.location.href = `${currentRole}-dashboard.html`;
    }
});

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 4. Google Authentication Handling with Role
googleBtn.addEventListener('click', async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const currentRole = selectedRoleInput.value;
        
        console.log(`Google Auth Success for [${currentRole}]:`, user);
        
        alert(`Google Login successful as ${currentRole.toUpperCase()}!`);
        // window.location.href = `${currentRole}-dashboard.html`;

    } catch (error) {
        console.error('Google Auth Error:', error.message);
        alert('Google Sign-In failed. Please try again.');
    }
});