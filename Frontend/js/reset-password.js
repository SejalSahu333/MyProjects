/**
 * reset-password.js — Frontend logic for Step 3 of Password Reset
 * Communicates with: /Backend/api/reset-password.php
 */

'use strict';

const API_URL = 'http://localhost/MyProjects/Backend/api/reset-password.php';

const form          = document.getElementById('resetForm');
const passwordInput = document.getElementById('password');
const confirmInput  = document.getElementById('confirmPassword');
const submitBtn     = document.getElementById('submitBtn');
const alertSuccess  = document.getElementById('alertSuccess');
const alertError    = document.getElementById('alertError');
const alertSuccessMsg = document.getElementById('alertSuccessMsg');
const alertErrorMsg   = document.getElementById('alertErrorMsg');

// ── Initialization ────────────────────────────────────────
const resetToken = sessionStorage.getItem('reset_token');
if (!resetToken) {
    window.location.href = 'forgot-password.html';
}

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

passwordInput.addEventListener('blur', validatePassword);
confirmInput.addEventListener('blur', validateConfirm);
confirmInput.addEventListener('input', () => {
    if (confirmInput.classList.contains('invalid')) validateConfirm();
});

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

// ── Submit Reset ──────────────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const valid = [validatePassword(), validateConfirm()].every(Boolean);
    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    const payload = {
        reset_token:      resetToken,
        password:         passwordInput.value,
        confirm_password: confirmInput.value
    };

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            showAlert('success', data.message);
            // Clear sensitive data
            sessionStorage.removeItem('reset_email');
            sessionStorage.removeItem('reset_token');
            form.reset();
            updateStrengthMeter('');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showAlert('error', data.message);
            if (data.message.includes('token')) {
                // Token invalid/expired -> back to start
                setTimeout(() => {
                    window.location.href = 'forgot-password.html';
                }, 2000);
            }
        }
    } catch (err) {
        showAlert('error', 'Network error. Please try again.');
        console.error(err);
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
});
