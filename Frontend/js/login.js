/**
 * login.js — Frontend logic for the Login page
 * Communicates with: /Backend/api/login.php
 */

'use strict';

// ── Config ────────────────────────────────────────────────
const API_URL = 'http://localhost/MyProjects/Backend/api/login.php';

// ── DOM References ────────────────────────────────────────
const form            = document.getElementById('loginForm');
const emailInput      = document.getElementById('email');
const passwordInput   = document.getElementById('password');
const submitBtn       = document.getElementById('submitBtn');
const alertSuccess    = document.getElementById('alertSuccess');
const alertError      = document.getElementById('alertError');
const alertSuccessMsg = document.getElementById('alertSuccessMsg');
const alertErrorMsg   = document.getElementById('alertErrorMsg');

// ── Toggle Visibility ─────────────────────────────────────
document.getElementById('togglePassword').addEventListener('click', () => {
    const isText = passwordInput.type === 'text';
    passwordInput.type = isText ? 'password' : 'text';
    document.getElementById('togglePassword').textContent = isText ? '👁️' : '🙈';
});

// ── Field Validators ──────────────────────────────────────
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
    const v  = emailInput.value.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!v)          { showError(emailInput, 'emailError', 'Email address is required.');    return false; }
    if (!re.test(v)) { showError(emailInput, 'emailError', 'Enter a valid email address.');  return false; }
    clearError(emailInput, 'emailError');
    return true;
}

function validatePassword() {
    const v = passwordInput.value;
    if (!v) { showError(passwordInput, 'passwordError', 'Password is required.'); return false; }
    clearError(passwordInput, 'passwordError');
    return true;
}

emailInput.addEventListener('blur', validateEmail);
passwordInput.addEventListener('blur', validatePassword);

// ── Alerts ────────────────────────────────────────────────
function showAlert(type, message) {
    hideAlerts();
    if (type === 'success') {
        alertSuccessMsg.textContent = message;
        alertSuccess.classList.add('show');
    } else {
        alertErrorMsg.textContent = message;
        alertError.classList.add('show');
    }
}
function hideAlerts() {
    alertSuccess.classList.remove('show');
    alertError.classList.remove('show');
}

// ── Loading State ─────────────────────────────────────────
function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.classList.toggle('loading', loading);
}

// ── Form Submit ───────────────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlerts();

    const valid = [validateEmail(), validatePassword()].every(Boolean);
    if (!valid) return;

    setLoading(true);

    const payload = {
        email:    emailInput.value.trim().toLowerCase(),
        password: passwordInput.value,
    };

    try {
        const res  = await fetch(API_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
        });
        const data = await res.json();

        if (data.success) {
            // Store token and user info in localStorage
            if (data.token) {
                localStorage.setItem('auth_token', data.token);
            }
            if (data.user) {
                localStorage.setItem('auth_user', JSON.stringify(data.user));
            }
            showAlert('success', data.message || 'Login successful! Redirecting…');
            setTimeout(() => {
                // Redirect to dashboard (create dashboard.html later)
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            showAlert('error', data.message || 'Invalid email or password.');
            passwordInput.value = '';
            passwordInput.classList.remove('valid', 'invalid');
        }
    } catch (err) {
        showAlert('error', 'Network error. Make sure XAMPP is running and the API is reachable.');
        console.error('Login error:', err);
    } finally {
        setLoading(false);
    }
});

// ── Forgot Password placeholder ───────────────────────────
document.getElementById('forgotLink').addEventListener('click', (e) => {
    e.preventDefault();
    showAlert('error', '🔧 Forgot password feature coming soon!');
});

// ── Auto-fill from URL param (after registration redirect) ─
const params = new URLSearchParams(window.location.search);
if (params.get('registered') === '1') {
    showAlert('success', '✅ Account created! Please sign in with your new credentials.');
}
