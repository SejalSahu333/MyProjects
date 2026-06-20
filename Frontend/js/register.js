/**
 * register.js — Frontend logic for the Registration page
 * Communicates with: /Backend/api/register.php
 */

'use strict';

// ── Config ────────────────────────────────────────────────
const API_URL = 'http://localhost/MyProjects/Backend/api/register.php';

// ── DOM References ────────────────────────────────────────
const form            = document.getElementById('registerForm');
const fullNameInput   = document.getElementById('fullName');
const emailInput      = document.getElementById('email');
const passwordInput   = document.getElementById('password');
const confirmInput    = document.getElementById('confirmPassword');
const submitBtn       = document.getElementById('submitBtn');
const spinner         = document.getElementById('spinner');
const alertSuccess    = document.getElementById('alertSuccess');
const alertError      = document.getElementById('alertError');
const alertSuccessMsg = document.getElementById('alertSuccessMsg');
const alertErrorMsg   = document.getElementById('alertErrorMsg');

// ── Password Strength Meter ───────────────────────────────
const strengthColors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

function calcStrength(pwd) {
    let score = 0;
    if (pwd.length >= 8)                      score++;
    if (/[A-Z]/.test(pwd))                    score++;
    if (/[0-9]/.test(pwd))                    score++;
    if (/[^A-Za-z0-9]/.test(pwd))            score++;
    return score;
}

function updateStrengthMeter(pwd) {
    const score = pwd.length === 0 ? 0 : calcStrength(pwd);
    const color = strengthColors[score] || '';

    for (let i = 1; i <= 4; i++) {
        const seg = document.getElementById('seg' + i);
        seg.style.background = i <= score ? color : 'rgba(255,255,255,0.08)';
    }

    const label = document.getElementById('strengthLabel');
    label.textContent = pwd.length ? 'Password strength: ' + (strengthLabels[score] || '') : '';
    label.style.color = color;
}

passwordInput.addEventListener('input', () => {
    updateStrengthMeter(passwordInput.value);
    if (passwordInput.classList.contains('invalid')) validatePassword();
});

// ── Toggle Visibility ─────────────────────────────────────
function makeToggle(btnId, inputEl) {
    document.getElementById(btnId).addEventListener('click', () => {
        const isText = inputEl.type === 'text';
        inputEl.type = isText ? 'password' : 'text';
        document.getElementById(btnId).textContent = isText ? '👁️' : '🙈';
    });
}
makeToggle('togglePassword', passwordInput);
makeToggle('toggleConfirm',  confirmInput);

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

function validateFullName() {
    const v = fullNameInput.value.trim();
    if (!v) {
        showError(fullNameInput, 'fullNameError', 'Full name is required.');
        return false;
    }
    if (v.length < 3 || v.length > 100) {
        showError(fullNameInput, 'fullNameError', 'Must be between 3 and 100 characters.');
        return false;
    }
    clearError(fullNameInput, 'fullNameError');
    return true;
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

function validatePassword() {
    const v = passwordInput.value;
    if (!v) {
        showError(passwordInput, 'passwordError', 'Password is required.');
        return false;
    }
    if (v.length < 8) {
        showError(passwordInput, 'passwordError', 'At least 8 characters required.');
        return false;
    }
    if (!/[A-Z]/.test(v)) {
        showError(passwordInput, 'passwordError', 'Must contain at least one uppercase letter.');
        return false;
    }
    if (!/[0-9]/.test(v)) {
        showError(passwordInput, 'passwordError', 'Must contain at least one number.');
        return false;
    }
    clearError(passwordInput, 'passwordError');
    return true;
}

function validateConfirm() {
    if (confirmInput.value !== passwordInput.value) {
        showError(confirmInput, 'confirmPasswordError', 'Passwords do not match.');
        return false;
    }
    if (!confirmInput.value) {
        showError(confirmInput, 'confirmPasswordError', 'Please confirm your password.');
        return false;
    }
    clearError(confirmInput, 'confirmPasswordError');
    return true;
}

// Live validation on blur
fullNameInput.addEventListener('blur', validateFullName);
emailInput.addEventListener('blur', validateEmail);
passwordInput.addEventListener('blur', validatePassword);
confirmInput.addEventListener('blur', validateConfirm);
confirmInput.addEventListener('input', () => {
    if (confirmInput.classList.contains('invalid')) validateConfirm();
});

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

    const valid = [
        validateFullName(),
        validateEmail(),
        validatePassword(),
        validateConfirm(),
    ].every(Boolean);

    if (!valid) return;

    setLoading(true);

    const payload = {
        full_name:        fullNameInput.value.trim(),
        email:            emailInput.value.trim().toLowerCase(),
        password:         passwordInput.value,
        confirm_password: confirmInput.value,
    };

    try {
        const res  = await fetch(API_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
        });
        const data = await res.json();

        if (data.success) {
            showAlert('success', data.message || 'Account created! Redirecting to login…');
            form.reset();
            updateStrengthMeter('');
            [fullNameInput, emailInput, passwordInput, confirmInput].forEach(i => {
                i.classList.remove('valid', 'invalid');
            });
            setTimeout(() => { window.location.href = 'login.html'; }, 2200);
        } else {
            showAlert('error', data.message || 'Registration failed. Please try again.');
        }
    } catch (err) {
        showAlert('error', 'Network error. Make sure XAMPP is running and the API is reachable.');
        console.error('Registration error:', err);
    } finally {
        setLoading(false);
    }
});
