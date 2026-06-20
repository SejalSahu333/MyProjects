/**
 * forgot-password.js — Frontend logic for Step 1 of Password Reset
 * Communicates with: /Backend/api/forgot-password.php
 */

'use strict';

const API_URL = 'http://localhost/MyProjects/Backend/api/forgot-password.php';

const form       = document.getElementById('forgotForm');
const emailInput = document.getElementById('email');
const submitBtn  = document.getElementById('submitBtn');
const alertSuccess = document.getElementById('alertSuccess');
const alertError   = document.getElementById('alertError');
const alertSuccessMsg = document.getElementById('alertSuccessMsg');
const alertErrorMsg   = document.getElementById('alertErrorMsg');

// ── Validation ────────────────────────────────────────────
function showError(input, errorId, message) {
    input.classList.add('invalid');
    input.classList.remove('valid');
    const el = document.getElementById(errorId);
    el.textContent = '⚡ ' + message;
    el.classList.add('show');
}

function clearError(input, errorId) {
    input.classList.remove('invalid');
    input.classList.add('valid');
    document.getElementById(errorId).classList.remove('show');
}

function validateEmail() {
    const v = emailInput.value.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!v) {
        showError(emailInput, 'emailError', 'Email address is required.');
        return false;
    }
    if (!re.test(v)) {
        showError(emailInput, 'emailError', 'Enter a valid email address.');
        return false;
    }
    clearError(emailInput, 'emailError');
    return true;
}

emailInput.addEventListener('blur', validateEmail);

// ── Alerts ────────────────────────────────────────────────
function showAlert(type, message) {
    alertSuccess.classList.remove('show');
    alertError.classList.remove('show');
    if (type === 'success') {
        alertSuccessMsg.textContent = message;
        alertSuccess.classList.add('show');
    } else {
        alertErrorMsg.textContent = message;
        alertError.classList.add('show');
    }
}

// ── Form Submit ───────────────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    const email = emailInput.value.trim().toLowerCase();

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        const data = await res.json();

        if (data.success) {
            showAlert('success', data.message);
            // Store email in session storage for the verify page
            sessionStorage.setItem('reset_email', email);
            setTimeout(() => {
                window.location.href = 'verify-otp.html';
            }, 2000);
        } else {
            showAlert('error', data.message || 'Something went wrong.');
            emailInput.classList.remove('valid', 'invalid');
        }
    } catch (err) {
        showAlert('error', 'Network error. Make sure the backend is running.');
        console.error(err);
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
});
