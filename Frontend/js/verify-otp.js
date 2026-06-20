/**
 * verify-otp.js — Frontend logic for Step 2 of Password Reset
 * Communicates with: /Backend/api/verify-otp.php and /Backend/api/forgot-password.php
 */

'use strict';

const VERIFY_API_URL = 'http://localhost/MyProjects/Backend/api/verify-otp.php';
const RESEND_API_URL = 'http://localhost/MyProjects/Backend/api/forgot-password.php';

const form         = document.getElementById('verifyForm');
const inputs       = document.querySelectorAll('.otp-input');
const submitBtn    = document.getElementById('submitBtn');
const resendBtn    = document.getElementById('resendBtn');
const timerDisplay = document.getElementById('timer');
const alertSuccess = document.getElementById('alertSuccess');
const alertError   = document.getElementById('alertError');
const alertSuccessMsg = document.getElementById('alertSuccessMsg');
const alertErrorMsg   = document.getElementById('alertErrorMsg');

let countdownInterval;
let timeLeft = 600; // 10 minutes

// ── Initialization ────────────────────────────────────────
const userEmail = sessionStorage.getItem('reset_email');
if (!userEmail) {
    window.location.href = 'forgot-password.html';
} else {
    document.getElementById('displayEmail').textContent = userEmail;
    startTimer();
    inputs[0].focus();
}

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

// ── OTP Inputs Logic ──────────────────────────────────────
inputs.forEach((input, index) => {
    // Only allow numbers
    input.addEventListener('input', (e) => {
        input.value = input.value.replace(/[^0-9]/g, '');
        input.classList.remove('invalid');
        
        if (input.value && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });

    // Handle backspace
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
            inputs[index - 1].focus();
        }
    });

    // Handle paste (distribute chars across boxes)
    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        if (pastedData) {
            inputs.forEach(i => i.classList.remove('invalid'));
            for (let i = 0; i < pastedData.length; i++) {
                if (index + i < inputs.length) {
                    inputs[index + i].value = pastedData[i];
                }
            }
            const focusIndex = Math.min(index + pastedData.length, inputs.length - 1);
            inputs[focusIndex].focus();
        }
    });
});

function getOTP() {
    return Array.from(inputs).map(i => i.value).join('');
}

// ── Timer Logic ───────────────────────────────────────────
function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    timerDisplay.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
}

function startTimer() {
    timeLeft = 600;
    resendBtn.classList.remove('active');
    updateTimerDisplay();
    
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            timerDisplay.textContent = '0:00';
            resendBtn.classList.add('active');
        }
    }, 1000);
}

// ── Resend OTP ────────────────────────────────────────────
resendBtn.addEventListener('click', async () => {
    if (!resendBtn.classList.contains('active')) return;
    
    resendBtn.textContent = 'Sending...';
    
    try {
        const res = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
        });
        const data = await res.json();
        
        if (data.success) {
            showAlert('success', 'New OTP sent to your email.');
            // Clear inputs
            inputs.forEach(i => i.value = '');
            inputs[0].focus();
            // Restart timer
            startTimer();
        } else {
            showAlert('error', data.message);
        }
    } catch (err) {
        showAlert('error', 'Network error. Please try again.');
    } finally {
        resendBtn.textContent = 'Resend OTP';
    }
});

// ── Submit Verification ───────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const otp = getOTP();
    if (otp.length !== 6) {
        inputs.forEach(i => {
            if (!i.value) i.classList.add('invalid');
        });
        showAlert('error', 'Please enter all 6 digits.');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    try {
        const res = await fetch(VERIFY_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, otp: otp })
        });
        const data = await res.json();

        if (data.success) {
            showAlert('success', data.message);
            // Save reset_token
            sessionStorage.setItem('reset_token', data.reset_token);
            setTimeout(() => {
                window.location.href = 'reset-password.html';
            }, 1500);
        } else {
            showAlert('error', data.message);
            inputs.forEach(i => i.classList.add('invalid'));
            // Auto clear if used/expired
            if (data.message.includes('expired') || data.message.includes('used')) {
                inputs.forEach(i => i.value = '');
                inputs[0].focus();
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
